package com.mysterymango.auth;

import com.mysterymango.common.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import static org.junit.jupiter.api.Assertions.*;

@ActiveProfiles({"prod","dev","e2e"})
@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT,properties={"app.kakao.client-id=","app.kakao.client-secret=","app.kakao.redirect-uri=","app.voice-provider=disabled","game.tick-ms=3600000"})
class ProductionAuthIntegrationTest {
    @DynamicPropertySource static void database(DynamicPropertyRegistry p){KakaoAuthIntegrationTest.database(p);}
    @LocalServerPort int port;@Autowired Json json;@Autowired Db db;
    @Test void prodDisablesLocalAuthenticationEvenWithDevelopmentProfilesAndMissingKakaoConfig()throws Exception{
        try(var client=new KakaoHttpClient(port,json)){
            assertEquals(Map.of("kakaoConfigured",false,"localLoginEnabled",false),json.object(client.get("/api/v1/auth/providers").body()));
            client.csrf();
            String email="production-denied-"+UUID.randomUUID()+"@example.test";
            for(String path:List.of("/api/v1/auth/register","/api/v1/auth/login")){
                var response=client.request("POST",path,Map.of("email",email,"password","BlockedTest!2026","displayName","생성 금지"),true);
                assertTrue(response.statusCode()==401||response.statusCode()==403);
            }
            assertEquals(0,Db.num(db.one("select count(*) n from app_user where email=?",email),"n"));
            assertEquals(0,Db.num(db.one("select count(*) n from app_user where email in ('admin@example.test','player1@example.test')"),"n"));
            assertEquals(503,client.request("POST","/api/v1/auth/kakao",Map.of(),true).statusCode());
            KakaoHttpClient.redirect(client.get("/api/v1/auth/kakao/callback?code=ignored&state=invalid"),"/login?kakaoError=unavailable");
        }
    }
}
