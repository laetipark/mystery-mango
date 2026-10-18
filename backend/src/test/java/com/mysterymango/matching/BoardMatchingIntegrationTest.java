package com.mysterymango.matching;

import com.mysterymango.common.*;
import com.mysterymango.room.RoomService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.postgresql.PostgreSQLContainer;
import java.util.*;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties={"game.tick-ms=3600000","matching.tick-ms=3600000"})
class BoardMatchingIntegrationTest {
    static final PostgreSQLContainer POSTGRES=new PostgreSQLContainer(org.testcontainers.utility.DockerImageName.parse("postgres:17.11-alpine@sha256:b0f9560a2de083e2cc7382e75f808c7381a32852a7ec49117deedb300e552b24").asCompatibleSubstituteFor("postgres"));
    @DynamicPropertySource static void database(DynamicPropertyRegistry p){
        String external=System.getenv("TEST_DATABASE_URL");
        if(external==null||external.isBlank()){POSTGRES.start();p.add("spring.datasource.url",POSTGRES::getJdbcUrl);p.add("spring.datasource.username",POSTGRES::getUsername);p.add("spring.datasource.password",POSTGRES::getPassword);}
        else{p.add("spring.datasource.url",()->external);p.add("spring.datasource.username",()->System.getenv().getOrDefault("TEST_DATABASE_USER","mango"));p.add("spring.datasource.password",()->System.getenv().getOrDefault("TEST_DATABASE_PASSWORD",""));}
    }
    @Autowired Db db;@Autowired Commands commands;@Autowired Activities activities;@Autowired RoomService rooms;@Autowired MatchingService matching;
    @Autowired Json json;
    final List<UUID> users=new ArrayList<>();UUID version,otherVersion;
    @BeforeEach void setup(){commands.transaction(()->{
        db.update("update match_ticket set status='CANCELLED' where status in('WAITING','PROPOSED')");db.update("update match_proposal set status='ENDED' where status in('ACCEPTING','VOTING')");db.update("update player_activity set kind='IDLE',reference_id=null where kind in('QUEUED','PROPOSED')");
        for(int i=0;i<8;i++){UUID id=UUID.randomUUID();users.add(id);db.update("insert into app_user(id,email,display_name,password_hash) values(?,?,?,'unused')",id,id+"@test.invalid","보드 참가자"+i);db.update("insert into player_activity(user_id,kind) values(?,'IDLE')",id);}
        UUID scenario=UUID.randomUUID();version=UUID.randomUUID();otherVersion=UUID.randomUUID();db.update("insert into scenario(id,slug) values(?,?)",scenario,"board-"+scenario);
        var definition=Json.map("schemaVersion",1,"slug","board-"+scenario,"title","요트 검증","synopsis","매칭 검증","gameType","YACHT","engineId","yacht-v1","playerCount",4,"supportedPlayerCounts",List.of(1,2,3,4),"estimatedMinutes",30,"genre","주사위","difficulty","쉬움","language","ko","modes",List.of("TEXT"),"roles",List.of());
        db.update("insert into scenario_version(id,scenario_id,version,status,definition) values(?,?,1,'PUBLISHED',?::jsonb)",version,scenario,json.write(definition));db.update("insert into scenario_version(id,scenario_id,version,status,definition) values(?,?,2,'PUBLISHED',?::jsonb)",otherVersion,scenario,json.write(definition));return null;
    });}
    @AfterEach void cleanup(){commands.transaction(()->{db.update("update scenario_version set status='DRAFT' where id in (?,?)",version,otherVersion);return null;});}
    @Test void twoThreeAndFourPlayersAcceptWithoutCandidateVote(){
        for(int count=2;count<=4;count++){
            final int capacity=count;
            for(int i=0;i<count;i++)enqueue(users.get(i),version,capacity,false);
            matching.tick();UUID proposal=proposal(users.getFirst());assertEquals("YACHT",matching.proposal(proposal,users.getFirst()).get("gameType"));
            for(int i=0;i<count;i++){UUID user=users.get(i);commands.transaction(()->matching.accept(proposal,user));}
            var state=db.one("select * from match_proposal where id=?",proposal);assertEquals("ROOM",state.get("status"));UUID room=Db.uuid(state,"room_id");assertEquals(capacity,rooms.snapshot(room,users.getFirst()).get("capacity"));
            for(int i=0;i<count;i++){UUID user=users.get(i);commands.transaction(()->rooms.leave(room,user));}
        }
    }
    @Test void versionsAndCapacitiesDoNotMixAndLaterQueueStillMatches(){
        enqueue(users.get(0),version,4,false);enqueue(users.get(1),version,2,false);enqueue(users.get(2),otherVersion,2,false);enqueue(users.get(3),otherVersion,2,false);
        matching.tick();assertEquals("QUEUED",activity(users.get(0)));assertEquals("QUEUED",activity(users.get(1)));assertEquals("PROPOSED",activity(users.get(2)));assertEquals(proposal(users.get(2)),proposal(users.get(3)));
    }
    @Test void exposureDoesNotPreventRepeatBoardgamesAndBlocksAreRechecked(){
        commands.transaction(()->{db.update("insert into scenario_exposure(user_id,scenario_id) select ?,scenario_id from scenario_version where id=?",users.getFirst(),version);return null;});
        enqueue(users.get(0),version,2,false);enqueue(users.get(1),version,2,false);matching.tick();UUID proposal=proposal(users.getFirst());
        commands.transaction(()->matching.accept(proposal,users.getFirst()));commands.transaction(()->{db.update("insert into user_block(user_id,blocked_id) values(?,?)",users.getFirst(),users.get(1));return null;});commands.transaction(()->matching.accept(proposal,users.get(1)));
        assertEquals("ENDED",db.one("select status from match_proposal where id=?",proposal).get("status"));assertEquals("IDLE",activity(users.getFirst()));
    }
    @Test void unpublishingBeforeLastAcceptNeverCreatesRoom(){
        enqueue(users.get(0),version,2,false);enqueue(users.get(1),version,2,false);matching.tick();UUID proposal=proposal(users.getFirst());commands.transaction(()->matching.accept(proposal,users.getFirst()));
        commands.transaction(()->{db.update("update scenario_version set status='DRAFT' where id=?",version);return null;});commands.transaction(()->matching.accept(proposal,users.get(1)));assertEquals("ENDED",db.one("select status from match_proposal where id=?",proposal).get("status"));
    }
    @Test void lastAcceptanceRacingCancellationHasOneOutcome()throws Exception{
        UUID ticket=enqueue(users.getFirst(),version,2,false);enqueue(users.get(1),version,2,false);matching.tick();UUID proposal=proposal(users.getFirst());commands.transaction(()->matching.accept(proposal,users.getFirst()));
        var gate=new CountDownLatch(1);try(var pool=Executors.newFixedThreadPool(2)){
            var a=pool.submit(()->{gate.await();try{commands.transaction(()->matching.accept(proposal,users.get(1)));}catch(ApiException ignored){}return true;});
            var b=pool.submit(()->{gate.await();try{commands.transaction(()->matching.cancel(ticket,users.getFirst()));}catch(ApiException ignored){}return true;});gate.countDown();a.get(15,TimeUnit.SECONDS);b.get(15,TimeUnit.SECONDS);
        }
        var state=db.one("select * from match_proposal where id=?",proposal);assertTrue(Set.of("ENDED","ROOM").contains(state.get("status")));assertEquals("ROOM".equals(state.get("status"))?"ROOM":"IDLE",activity(users.getFirst()));
        if("ROOM".equals(state.get("status")))assertEquals(2,Db.num(db.one("select count(*) n from room_participant where room_id=?",state.get("room_id")),"n"));
    }
    @Test void unsupportedCapacityAndMixedActivityAreRejected(){
        assertThrows(ApiException.class,()->enqueue(users.getFirst(),version,1,false));
        UUID room=commands.transaction(()->(UUID)rooms.create(users.getFirst(),version,"PUBLIC","TEXT",null,1).get("roomId"));assertEquals(1,rooms.snapshot(room,users.getFirst()).get("capacity"));
        assertThrows(ApiException.class,()->enqueue(users.getFirst(),version,2,false));
        assertThrows(ApiException.class,()->commands.transaction(()->rooms.create(users.get(1),version,"PUBLIC","TEXT",null,5)));
    }
    @Test void classicPublicGamesMatchOnlyTwoPlayersAndRemainReplayable(){
        for(String type:List.of("GOMOKU","REVERSI","CHECKERS")){
            UUID classic=Db.uuid(db.one("select id from scenario_version where status='PUBLISHED' and definition->>'gameType'=? order by version desc limit 1",type),"id");
            commands.transaction(()->{db.update("insert into scenario_exposure(user_id,scenario_id) select ?,scenario_id from scenario_version where id=? on conflict do nothing",users.getFirst(),classic);return null;});
            assertThrows(ApiException.class,()->commands.transaction(()->rooms.create(users.getFirst(),classic,"PUBLIC","TEXT",null,1)));
            assertThrows(ApiException.class,()->commands.transaction(()->matching.enqueue(users.getFirst(),new MatchingService.TicketRequest("ko",120,"TEXT",null,null,false,type,classic,3))));
            for(int i=0;i<2;i++){UUID actor=users.get(i);commands.transaction(()->matching.enqueue(actor,new MatchingService.TicketRequest("ko",120,"TEXT",null,null,false,type,classic,2)));}
            matching.tick();UUID proposal=proposal(users.getFirst());
            assertEquals(type,matching.proposal(proposal,users.getFirst()).get("gameType"));
            assertEquals(1,((List<?>)matching.proposal(proposal,users.getFirst()).get("candidates")).size());
            for(int i=0;i<2;i++){UUID actor=users.get(i);commands.transaction(()->matching.accept(proposal,actor));}
            UUID room=Db.uuid(db.one("select room_id from match_proposal where id=? and status='ROOM'",proposal),"room_id");
            assertEquals(2,rooms.snapshot(room,users.getFirst()).get("capacity"));
            assertEquals(type,rooms.snapshot(room,users.getFirst()).get("gameType"));
            for(int i=0;i<2;i++){UUID actor=users.get(i);commands.transaction(()->rooms.leave(room,actor));}
        }
    }
    private UUID enqueue(UUID user,UUID version,int capacity,boolean requeue){return commands.transaction(()->(UUID)matching.enqueue(user,new MatchingService.TicketRequest("ko",120,"TEXT",null,null,requeue,"YACHT",version,capacity)).get("ticketId"));}
    private UUID proposal(UUID user){return Db.uuid(db.one("select reference_id from player_activity where user_id=?",user),"reference_id");}
    private String activity(UUID user){return Db.str(db.one("select kind from player_activity where user_id=?",user),"kind");}
}
