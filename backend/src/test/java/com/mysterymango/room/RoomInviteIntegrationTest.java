package com.mysterymango.room;

import com.mysterymango.common.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;
import java.security.SecureRandom;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties={"app.voice-provider=disabled","game.tick-ms=3600000"})
class RoomInviteIntegrationTest {
    private static PostgreSQLContainer postgres;
    @DynamicPropertySource static void database(DynamicPropertyRegistry p) {
        String external=System.getenv("TEST_DATABASE_URL");
        if(external!=null&&!external.isBlank()) {
            p.add("spring.datasource.url",()->external);p.add("spring.datasource.username",()->System.getenv().getOrDefault("TEST_DATABASE_USER","mango"));p.add("spring.datasource.password",()->System.getenv().getOrDefault("TEST_DATABASE_PASSWORD","mango_local_only"));
        } else {
            postgres=new PostgreSQLContainer(DockerImageName.parse("postgres:17.11-alpine@sha256:b0f9560a2de083e2cc7382e75f808c7381a32852a7ec49117deedb300e552b24").asCompatibleSubstituteFor("postgres"));postgres.start();
            p.add("spring.datasource.url",postgres::getJdbcUrl);p.add("spring.datasource.username",postgres::getUsername);p.add("spring.datasource.password",postgres::getPassword);
        }
    }
    @Autowired RoomController controller;@Autowired Commands commands;@Autowired Db db;
    private UUID host,guest,version;
    @BeforeEach void fixture(){commands.transaction(()->{host=user();guest=user();version=Db.uuid(db.one("select id from scenario_version where status='PUBLISHED' order by id limit 1"),"id");return null;});as(host);}
    @AfterEach void clearActor(){SecurityContextHolder.clearContext();}

    @Test void invitationCreationAndRetryStoreOnlyAcknowledgementAndHash(){
        String token=token(),key=key();var request=new RoomController.Create(version,"INVITE","TEXT",token);
        var first=controller.create(key,request);var second=controller.create(key,request);UUID id=UUID.fromString(first.get("roomId").toString());
        assertEquals(first.get("roomId").toString(),second.get("roomId").toString());assertEquals(first.get("expiresAt").toString(),second.get("expiresAt").toString());
        assertEquals(Set.of("roomId","expiresAt"),first.keySet());assertEquals(Commands.hash(token),db.one("select invite_hash from room where id=?",id).get("invite_hash"));
        String cached=db.one("select result from command_result where user_id=? and key=?",host,key).get("result").toString();
        assertFalse(cached.contains(token));assertFalse(cached.contains("inviteToken"));assertFalse(cached.contains("token"));
        assertEquals(1,Db.num(db.one("select count(*) n from room where host_id=?",host),"n"));
    }
    @Test void rotationReplaysSameExpiryAndInvalidatesTheOriginalLink(){
        String original=token();UUID room=create(original);String next=token(),key=key();var request=new RoomController.Invite(next);
        var issued=controller.invite(room,key,request);var replay=controller.invite(room,key,request);
        assertEquals(issued.get("expiresAt").toString(),replay.get("expiresAt").toString());assertEquals(Set.of("roomId","expiresAt"),replay.keySet());
        String cached=db.one("select result from command_result where user_id=? and key=?",host,key).get("result").toString();assertFalse(cached.contains(next));
        as(guest);assertEquals("INVALID_INVITE",assertThrows(ApiException.class,()->controller.join(room,key(),new RoomController.Join(original))).code);
        assertEquals(room.toString(),controller.join(room,key(),new RoomController.Join(next)).get("roomId").toString());
    }
    @Test void revocationAndHostDeparturePreventPreviouslyAuthorizedCacheReplay(){
        String original=token();UUID room=create(original);String next=token(),issueKey=key();var request=new RoomController.Invite(next);
        controller.invite(room,issueKey,request);controller.revoke(room,key());
        assertEquals("INVITE_NO_LONGER_VALID",assertThrows(ApiException.class,()->controller.invite(room,issueKey,request)).code);
        String finalToken=token(),finalKey=key();var finalRequest=new RoomController.Invite(finalToken);controller.invite(room,finalKey,finalRequest);
        as(guest);controller.join(room,key(),new RoomController.Join(finalToken));as(host);controller.leave(room,key());
        assertEquals(403,assertThrows(ApiException.class,()->controller.invite(room,finalKey,finalRequest)).status);
        assertEquals(guest,Db.uuid(db.one("select host_id from room where id=?",room),"host_id"));
    }
    @Test void createAndJoinReplayCannotBypassRemovedMembership(){
        String token=token(),createKey=key(),joinKey=key();var request=new RoomController.Create(version,"INVITE","TEXT",token);UUID room=UUID.fromString(controller.create(createKey,request).get("roomId").toString());
        as(guest);controller.join(room,joinKey,new RoomController.Join(token));controller.leave(room,key());
        assertEquals(403,assertThrows(ApiException.class,()->controller.join(room,joinKey,new RoomController.Join(token))).status);
        as(host);controller.leave(room,key());assertEquals(403,assertThrows(ApiException.class,()->controller.create(createKey,request)).status);
    }
    @Test void changedPayloadAndMalformedTokenCannotRotateOrCreate(){
        String original=token();UUID room=create(original);String newToken=token(),issueKey=key();controller.invite(room,issueKey,new RoomController.Invite(newToken));
        assertEquals("IDEMPOTENCY_KEY_REUSED",assertThrows(ApiException.class,()->controller.invite(room,issueKey,new RoomController.Invite(token()))).code);
        assertEquals(Commands.hash(newToken),db.one("select invite_hash from room where id=?",room).get("invite_hash"));
        as(guest);assertEquals("INVALID_INVITE_TOKEN",assertThrows(ApiException.class,()->controller.create(key(),new RoomController.Create(version,"INVITE","TEXT","too-short"))).code);
        assertEquals("IDLE",db.one("select kind from player_activity where user_id=?",guest).get("kind"));
    }
    @Test void missingRoomFieldsReturnInputErrorsWithoutAnActivityChange(){
        for(var request:List.of(new RoomController.Create(null,"PUBLIC","TEXT",null),new RoomController.Create(version,null,"TEXT",null),new RoomController.Create(version,"PUBLIC",null,null))){
            var error=assertThrows(ApiException.class,()->controller.create(key(),request));assertEquals(400,error.status);assertEquals("INVALID_ROOM",error.code);
        }
        assertEquals("IDLE",db.one("select kind from player_activity where user_id=?",host).get("kind"));
    }
    private UUID create(String token){return UUID.fromString(controller.create(key(),new RoomController.Create(version,"INVITE","TEXT",token)).get("roomId").toString());}
    private UUID user(){UUID id=UUID.randomUUID();db.update("insert into app_user(id,email,display_name,password_hash) values(?,?,?,'unused-invitation-test')",id,id+"@invite.invalid","초대 검증");db.update("insert into player_activity(user_id,kind) values(?,'IDLE')",id);return id;}
    private void as(UUID user){SecurityContextHolder.getContext().setAuthentication(UsernamePasswordAuthenticationToken.authenticated(user.toString(),null,AuthorityUtils.createAuthorityList("ROLE_USER")));}
    private static String token(){byte[] bytes=new byte[32];new SecureRandom().nextBytes(bytes);return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);}
    private static String key(){return UUID.randomUUID().toString();}
}
