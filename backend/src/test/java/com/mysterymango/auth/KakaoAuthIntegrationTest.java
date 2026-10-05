package com.mysterymango.auth;

import com.mysterymango.common.*;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/** Real HTTP sessions/CSRF and PostgreSQL; only the external Kakao exchange is mocked. */
@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT,properties={
        "app.kakao.client-id=disposable-client","app.kakao.client-secret=disposable-secret",
        "app.kakao.redirect-uri=https://example.test/api/v1/auth/kakao/callback","app.voice-provider=disabled","game.tick-ms=3600000"})
class KakaoAuthIntegrationTest {
    private static PostgreSQLContainer postgres;
    @DynamicPropertySource static void database(DynamicPropertyRegistry p){
        String url=System.getenv("TEST_DATABASE_URL");
        if(url!=null&&!url.isBlank()){
            p.add("spring.datasource.url",()->url);p.add("spring.datasource.username",()->System.getenv().getOrDefault("TEST_DATABASE_USER","mango"));p.add("spring.datasource.password",()->System.getenv().getOrDefault("TEST_DATABASE_PASSWORD","mango_local_only"));
        }else{
            postgres=new PostgreSQLContainer(DockerImageName.parse("postgres:17.11-alpine@sha256:b0f9560a2de083e2cc7382e75f808c7381a32852a7ec49117deedb300e552b24").asCompatibleSubstituteFor("postgres"));postgres.start();
            p.add("spring.datasource.url",postgres::getJdbcUrl);p.add("spring.datasource.username",postgres::getUsername);p.add("spring.datasource.password",postgres::getPassword);
        }
    }
    @LocalServerPort int port;
    @Autowired Json json;@Autowired Db db;@Autowired Commands commands;@Autowired KakaoLoginService logins;
    @MockitoBean KakaoClient kakao;
    String providerId;
    @BeforeEach void provider(){
        providerId=Long.toString(ThreadLocalRandom.current().nextLong(1,Long.MAX_VALUE));
        when(kakao.authorizeUrl(anyString())).thenAnswer(a->"https://kauth.kakao.com/oauth/authorize?state="+a.getArgument(0));
        when(kakao.exchange(anyString())).thenReturn(new KakaoClient.Identity(providerId,"카카오 탐정"));
    }
    @Test void providerDiscoveryIsPublicAndBeginningLoginRequiresCsrf()throws Exception{
        try(var client=new KakaoHttpClient(port,json)){
            var providers=client.get("/api/v1/auth/providers");assertEquals(200,providers.statusCode());
            assertEquals(Map.of("kakaoConfigured",true,"localLoginEnabled",true),json.object(providers.body()));
            assertFalse(providers.body().contains("disposable"));
            assertEquals(403,client.request("POST","/api/v1/auth/kakao",Map.of(),false).statusCode());
            client.csrf();String state=client.begin("/account");assertEquals(43,state.length());
            var row=db.one("select * from kakao_login_state where state_hash=?",Commands.hash(state));
            assertEquals("/account",row.get("next_path"));assertFalse(row.toString().contains(state));
            var schema=json.object(client.get("/api/openapi").body());
            @SuppressWarnings("unchecked") var paths=(Map<String,Object>)schema.get("paths");
            assertFalse(json.write(paths.get("/api/v1/auth/providers")).contains("\"session\""));
            assertFalse(json.write(paths.get("/api/v1/auth/kakao/callback")).contains("\"200\""));
            assertTrue(json.write(paths.get("/api/v1/auth/kakao/callback")).contains("\"302\""));
        }
    }
    @Test void callbackCreatesProviderAccountAndRotatesSessionAndCsrf()throws Exception{
        try(var client=new KakaoHttpClient(port,json);var oldSession=new KakaoHttpClient(port,json)){
            client.csrf();String csrf=client.token;String cookie=client.sessionCookie();String state=client.begin("/rooms/example?invite=token");
            client.copyCookiesTo(oldSession);
            KakaoHttpClient.redirect(client.callback(state),"/rooms/example?invite=token");
            assertNotEquals(cookie,client.sessionCookie());
            assertEquals(401,oldSession.get("/api/v1/auth/me").statusCode());
            var me=json.object(client.get("/api/v1/auth/me").body());
            assertNull(me.get("email"));assertEquals("카카오 탐정",me.get("displayName"));assertEquals(false,me.get("admin"));assertFalse(me.containsKey("kakaoId"));
            var user=db.one("select * from app_user where kakao_id=?",providerId);
            assertEquals(user.get("id").toString(),me.get("id"));assertNull(user.get("email"));assertNull(user.get("password_hash"));
            assertEquals(1,Db.num(db.one("select count(*) n from player_activity where user_id=?",user.get("id")),"n"));
            assertEquals(403,client.request("POST","/api/v1/auth/logout",Map.of(),true).statusCode());
            client.csrf();assertNotEquals(csrf,client.token);
            assertEquals(409,client.request("POST","/api/v1/auth/kakao",Map.of(),true).statusCode());
            assertEquals(200,client.request("POST","/api/v1/auth/logout",Map.of(),true).statusCode());
            client.csrf();String again=client.begin(null);KakaoHttpClient.redirect(client.callback(again),"/");
            assertEquals(me.get("id"),json.object(client.get("/api/v1/auth/me").body()).get("id"));
        }
    }
    @Test void stateIsSessionBoundConsumedOnCancellationAndRejectsReplay()throws Exception{
        try(var owner=new KakaoHttpClient(port,json);var stranger=new KakaoHttpClient(port,json)){
            owner.csrf();stranger.csrf();String state=owner.begin("/account");
            KakaoHttpClient.redirect(stranger.callback(state),"/login?kakaoError=expired");
            verify(kakao,never()).exchange(anyString());
            KakaoHttpClient.redirect(owner.get("/api/v1/auth/kakao/callback?state="+state+"&error=access_denied"),"/login?kakaoError=cancelled");
            KakaoHttpClient.redirect(owner.callback(state),"/login?kakaoError=expired");
            verify(kakao,never()).exchange(anyString());assertEquals(401,owner.get("/api/v1/auth/me").statusCode());
        }
    }
    @Test void expirationReplacementAndProviderErrorsNeverAuthenticate()throws Exception{
        try(var client=new KakaoHttpClient(port,json)){
            client.csrf();String expired=client.begin(null);
            commands.transaction(()->{db.update("update kakao_login_state set expires_at=now()-interval '1 second' where state_hash=?",Commands.hash(expired));return null;});
            KakaoHttpClient.redirect(client.callback(expired),"/login?kakaoError=expired");
            String replaced=client.begin(null);String current=client.begin(null);
            KakaoHttpClient.redirect(client.callback(replaced),"/login?kakaoError=expired");
            KakaoHttpClient.redirect(client.get("/api/v1/auth/kakao/callback?state="+current+"&error=provider_error"),"/login?kakaoError=failed");
            String failed=client.begin(null);when(kakao.exchange(anyString())).thenThrow(new KakaoClient.Failure());
            KakaoHttpClient.redirect(client.callback(failed),"/login?kakaoError=failed");
            KakaoHttpClient.redirect(client.callback(failed),"/login?kakaoError=expired");
            assertEquals(401,client.get("/api/v1/auth/me").statusCode());
        }
    }
    @Test void concurrentCallbacksConsumeTheStateExactlyOnce()throws Exception{
        try(var client=new KakaoHttpClient(port,json);var copy=new KakaoHttpClient(port,json);var pool=Executors.newFixedThreadPool(2)){
            client.csrf();String state=client.begin("/account");client.copyCookiesTo(copy);
            var gate=new CountDownLatch(1);
            var a=pool.submit(()->{gate.await();return client.callback(state);});var b=pool.submit(()->{gate.await();return copy.callback(state);});gate.countDown();
            var first=a.get(15,TimeUnit.SECONDS);var second=b.get(15,TimeUnit.SECONDS);
            assertEquals(302,first.statusCode());assertEquals(302,second.statusCode());
            assertEquals(Set.of("/account","/login?kakaoError=expired"),Set.of(first.headers().firstValue("Location").orElseThrow(),second.headers().firstValue("Location").orElseThrow()));
            verify(kakao,times(1)).exchange(anyString());
            var winner=first.headers().firstValue("Location").orElseThrow().equals("/account")?client:copy;
            assertEquals(200,winner.get("/api/v1/auth/me").statusCode());
        }
    }
    @Test void providerIdentityDoesNotLinkLocalAccountsAndConcurrentSignupCreatesOneUser()throws Exception{
        UUID localId=UUID.randomUUID();String email="local-"+localId+"@example.test";
        commands.transaction(()->{db.update("insert into app_user(id,email,display_name,password_hash,admin) values(?,?,?,'local-only',true)",localId,email,"카카오 탐정");return null;});
        var identity=new KakaoClient.Identity(providerId,"카카오 탐정");
        try(var pool=Executors.newFixedThreadPool(4)){
            var tasks=new ArrayList<Callable<UUID>>();for(int i=0;i<4;i++)tasks.add(()->logins.user(identity).id);
            Set<UUID> ids=new HashSet<>();for(var future:pool.invokeAll(tasks))ids.add(future.get());
            assertEquals(1,ids.size());assertFalse(ids.contains(localId));
            var created=db.one("select * from app_user where id=?",ids.iterator().next());assertNull(created.get("email"));assertEquals(false,created.get("admin"));
            assertNull(db.one("select * from app_user where id=?",localId).get("kakao_id"));
            assertEquals(1,Db.num(db.one("select count(*) n from player_activity where user_id=?",ids.iterator().next()),"n"));
        }
    }
    @Test void anInterveningLocalLoginCannotBeSwitchedByAnOldKakaoCallback()throws Exception{
        try(var client=new KakaoHttpClient(port,json)){
            client.csrf();String state=client.begin("/account");
            var local=client.request("POST","/api/v1/auth/register",Map.of("email",UUID.randomUUID()+"@example.test","password","LocalTest!2026","displayName","기존 로그인"),true);
            assertEquals(200,local.statusCode());String id=json.object(local.body()).get("id").toString();
            KakaoHttpClient.redirect(client.callback(state),"/login?kakaoError=expired");
            assertEquals(id,json.object(client.get("/api/v1/auth/me").body()).get("id"));verify(kakao,never()).exchange(anyString());
        }
    }
    @Test void unsafeNextAndMalformedProviderIdentityCannotRedirectOrCreateAnAccount()throws Exception{
        try(var client=new KakaoHttpClient(port,json)){
            client.csrf();String state=client.begin("//evil.invalid/steal");
            assertEquals("/",db.one("select next_path from kakao_login_state where state_hash=?",Commands.hash(state)).get("next_path"));
            when(kakao.exchange(anyString())).thenReturn(new KakaoClient.Identity("00123","잘못된 사용자"));
            KakaoHttpClient.redirect(client.callback(state),"/login?kakaoError=failed");
            assertEquals(401,client.get("/api/v1/auth/me").statusCode());
            assertEquals(0,Db.num(db.one("select count(*) n from app_user where kakao_id='00123'"),"n"));
            when(kakao.exchange(anyString())).thenReturn(new KakaoClient.Identity(providerId,"탐정"));
            String safe=client.begin("/%252fevil.invalid");KakaoHttpClient.redirect(client.callback(safe),"/");
        }
    }
}
