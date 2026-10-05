package com.mysterymango.auth;

import com.mysterymango.common.Json;
import com.sun.net.httpserver.HttpServer;
import java.net.*;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.atomic.AtomicReference;
import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import tools.jackson.databind.ObjectMapper;
import static org.junit.jupiter.api.Assertions.*;

class KakaoSecurityTest {
    private AuthPolicy policy(String... profiles){var env=new MockEnvironment();env.setActiveProfiles(profiles);return new AuthPolicy(env);}
    @Test void productionWinsOverDevelopmentAndConfigurationRequiresSecretAndExactCallback(){
        assertTrue(policy("e2e").localLoginEnabled());assertFalse(policy("prod","dev","e2e").localLoginEnabled());
        String url="https://mystery.laetipark.me/api/v1/auth/kakao/callback";
        assertTrue(new KakaoSettings("client","secret",url,policy("prod")).configured());
        assertFalse(new KakaoSettings("client","",url,policy("prod")).configured());
        assertTrue(KakaoSettings.validRedirect("http://127.0.0.1:18081/api/v1/auth/kakao/callback",true));
        assertFalse(KakaoSettings.validRedirect("http://127.0.0.1:18081/api/v1/auth/kakao/callback",false));
        for(String bad:List.of("http://example.com/api/v1/auth/kakao/callback",url+"?next=/",url+"#fragment",url+"/",url.replace("/callback","/%63allback"),"https://user:password@mystery.laetipark.me/api/v1/auth/kakao/callback","//mystery.laetipark.me/api/v1/auth/kakao/callback"))
            assertFalse(KakaoSettings.validRedirect(bad,true),bad);
    }
    @Test void nextPathsCannotEscapeTheSiteOrSmuggleHeaders(){
        for(String bad:List.of("https://evil.invalid/","//evil.invalid/","/\\evil.invalid","/%2fevil.invalid","/%252fevil.invalid","/%5cevil.invalid","/a/../..//evil.invalid","/\r\nLocation:https://evil.invalid","/%0d%0aLocation:evil"," /account","/account#fragment"))
            assertEquals("/",KakaoLoginService.safeNext(bad),bad);
        assertEquals("/rooms/123?invite=token",KakaoLoginService.safeNext("/rooms/123?invite=token"));
        assertEquals("/",KakaoLoginService.safeNext(null));
    }
    @Test void providerIdentityRequiresPositiveIntegralIdAndUsesOnlyNickname(){
        for(Object id:List.of(0,-1,1.2,"123",true,Long.MIN_VALUE))assertThrows(KakaoClient.Failure.class,()->KakaoClient.identity(Map.of("id",id)));
        assertThrows(KakaoClient.Failure.class,()->KakaoClient.identity(Map.of()));
        assertThrows(KakaoClient.Failure.class,()->KakaoClient.identity(Map.of("id",1,"has_signed_up",false)));
        var plain=KakaoClient.identity(Map.of("id",Long.MAX_VALUE,"kakao_account",Map.of("email","admin@example.test")));
        assertEquals(Long.toString(Long.MAX_VALUE),plain.id());assertEquals("탐정",plain.nickname());
        var named=KakaoClient.identity(Map.of("id",2,"kakao_account",Map.of("profile",Map.of("nickname","\u200b"+"🥭".repeat(50)))));
        assertEquals(40,named.nickname().codePointCount(0,named.nickname().length()));
    }
    @Test void providerExchangeSendsSecretOnlyToTokenEndpointAndRequestsNoEmail()throws Exception{
        var server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
        var tokenBody=new AtomicReference<String>();var profileBody=new AtomicReference<String>();var authorization=new AtomicReference<String>();
        server.createContext("/token",e->{tokenBody.set(new String(e.getRequestBody().readAllBytes(),StandardCharsets.UTF_8));byte[] body="{\"access_token\":\"disposable-provider-token\",\"token_type\":\"bearer\"}".getBytes(StandardCharsets.UTF_8);e.sendResponseHeaders(200,body.length);e.getResponseBody().write(body);e.close();});
        server.createContext("/me",e->{profileBody.set(new String(e.getRequestBody().readAllBytes(),StandardCharsets.UTF_8));authorization.set(e.getRequestHeaders().getFirst("Authorization"));byte[] body="{\"id\":12345,\"kakao_account\":{\"profile\":{\"nickname\":\"망고 탐정\"},\"email\":\"ignored@example.test\"}}".getBytes(StandardCharsets.UTF_8);e.sendResponseHeaders(200,body.length);e.getResponseBody().write(body);e.close();});
        server.start();
        try(var http=HttpClient.newBuilder().followRedirects(HttpClient.Redirect.NEVER).build()){
            String base="http://127.0.0.1:"+server.getAddress().getPort();
            var settings=new KakaoSettings("client","test-secret","https://example.test/api/v1/auth/kakao/callback",policy("prod"));
            var client=new KakaoClient(settings,new Json(new ObjectMapper()),http,URI.create(base+"/token"),URI.create(base+"/me"));
            assertEquals(new KakaoClient.Identity("12345","망고 탐정"),client.exchange("code with + &"));
            assertTrue(tokenBody.get().contains("client_secret=test-secret"));assertTrue(tokenBody.get().contains("code=code+with+%2B+%26"));
            assertEquals("Bearer disposable-provider-token",authorization.get());
            String fields=URLDecoder.decode(profileBody.get(),StandardCharsets.UTF_8);
            assertTrue(fields.contains("property_keys=[\"kakao_account.profile\"]"));assertFalse(fields.contains("email"));assertFalse(fields.contains("secret"));
            String authorize=URLDecoder.decode(client.authorizeUrl("test-state"),StandardCharsets.UTF_8);
            assertTrue(authorize.startsWith("https://kauth.kakao.com/oauth/authorize?"));assertTrue(authorize.contains("scope=profile_nickname"));assertFalse(authorize.contains("test-secret"));
        }finally{server.stop(0);}
    }
    @Test void providerHttpErrorsRedirectsMalformedTokensAndOversizedBodiesFailClosed()throws Exception{
        var status=new AtomicReference<>(200);var payload=new AtomicReference<>("{}");
        var server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
        server.createContext("/token",e->{byte[] body=payload.get().getBytes(StandardCharsets.UTF_8);e.getResponseHeaders().set("Location","http://127.0.0.1:1/leak");e.sendResponseHeaders(status.get(),body.length);e.getResponseBody().write(body);e.close();});server.start();
        try(var http=HttpClient.newBuilder().followRedirects(HttpClient.Redirect.NEVER).build()){
            URI endpoint=URI.create("http://127.0.0.1:"+server.getAddress().getPort()+"/token");
            var settings=new KakaoSettings("client","secret","https://example.test/api/v1/auth/kakao/callback",policy("prod"));
            var client=new KakaoClient(settings,new Json(new ObjectMapper()),http,endpoint,endpoint);
            for(String value:List.of("{}","{\"error\":\"bad\"}","{\"access_token\":123,\"token_type\":\"bearer\"}","{\"access_token\":\"t\",\"token_type\":\"mac\"}","x".repeat(65537))){payload.set(value);assertThrows(KakaoClient.Failure.class,()->client.exchange("code"));}
            payload.set("{}");for(int code:List.of(302,401,429,500)){status.set(code);assertThrows(KakaoClient.Failure.class,()->client.exchange("code"));}
        }finally{server.stop(0);}
    }
    @Test void providerDeadlineIncludesTheBodyAfterSuccessfulHeaders()throws Exception{
        var server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
        var executor=java.util.concurrent.Executors.newVirtualThreadPerTaskExecutor();server.setExecutor(executor);
        server.createContext("/slow",e->{
            e.sendResponseHeaders(200,0);e.getResponseBody().flush();
            try{Thread.sleep(2000);e.getResponseBody().write("{}".getBytes(StandardCharsets.UTF_8));}catch(Exception ignored){}finally{e.close();}
        });server.start();
        try(var http=HttpClient.newBuilder().followRedirects(HttpClient.Redirect.NEVER).build()){
            URI endpoint=URI.create("http://127.0.0.1:"+server.getAddress().getPort()+"/slow");
            var settings=new KakaoSettings("client","secret","https://example.test/api/v1/auth/kakao/callback",policy("prod"));
            var client=new KakaoClient(settings,new Json(new ObjectMapper()),http,endpoint,endpoint,Duration.ofMillis(200));
            long start=System.nanoTime();assertThrows(KakaoClient.Failure.class,()->client.exchange("code"));
            assertTrue(Duration.ofNanos(System.nanoTime()-start).toMillis()<1200,"The complete provider response must have a deadline");
        }finally{server.stop(0);executor.shutdownNow();}
    }
}
