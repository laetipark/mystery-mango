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
class MatchingIntegrationTest {
    static final PostgreSQLContainer POSTGRES=new PostgreSQLContainer(org.testcontainers.utility.DockerImageName.parse("postgres:17.11-alpine@sha256:b0f9560a2de083e2cc7382e75f808c7381a32852a7ec49117deedb300e552b24").asCompatibleSubstituteFor("postgres"));
    @DynamicPropertySource static void database(DynamicPropertyRegistry p){
        String external=System.getenv("TEST_DATABASE_URL");
        if(external==null||external.isBlank()){POSTGRES.start();p.add("spring.datasource.url",POSTGRES::getJdbcUrl);p.add("spring.datasource.username",POSTGRES::getUsername);p.add("spring.datasource.password",POSTGRES::getPassword);}
        else{p.add("spring.datasource.url",()->external);p.add("spring.datasource.username",()->System.getenv().getOrDefault("TEST_DATABASE_USER","mango"));p.add("spring.datasource.password",()->System.getenv().getOrDefault("TEST_DATABASE_PASSWORD",""));}
    }
    @Autowired Db db;@Autowired Commands commands;@Autowired Activities activities;@Autowired RoomService rooms;@Autowired MatchingService matching;
    final List<UUID> users=new ArrayList<>();UUID version;
    @BeforeEach void setup(){commands.transaction(()->{db.update("update match_ticket set status='CANCELLED' where status in('WAITING','PROPOSED')");db.update("update match_proposal set status='ENDED' where status in('ACCEPTING','VOTING')");db.update("update player_activity set kind='IDLE',reference_id=null where kind in('QUEUED','PROPOSED')");for(int i=0;i<8;i++){UUID id=UUID.randomUUID();users.add(id);db.update("insert into app_user(id,email,display_name,password_hash) values(?,?,?,'unused')",id,id+"@test.invalid","탐정"+i);db.update("insert into player_activity(user_id,kind) values(?,'IDLE')",id);}version=Db.uuid(db.one("select id from scenario_version where status='PUBLISHED' limit 1"),"id");return null;});}
    @Test void onlyOneOfTwoConcurrentRoomJoinsWins()throws Exception{
        UUID a=create(users.get(0)),b=create(users.get(1)),user=users.get(2);
        var outcomes=race(()->join(a,user),()->join(b,user));assertEquals(1,outcomes.stream().filter(Boolean::booleanValue).count());
        assertEquals(1,Db.num(db.one("select count(*) n from room_participant where user_id=?",user),"n"));
    }
    @Test void lastSeatCannotBeOverbooked()throws Exception{
        UUID room=create(users.getFirst());join(room,users.get(1));join(room,users.get(2));
        var results=race(()->join(room,users.get(3)),()->join(room,users.get(4)));assertEquals(1,results.stream().filter(Boolean::booleanValue).count());assertEquals(4,Db.num(db.one("select count(*) n from room_participant where room_id=?",room),"n"));
    }
    @Test void duplicateQueueRequestsCannotCreateTwoTickets()throws Exception{
        var results=race(()->enqueue(users.getFirst(),false,120),()->enqueue(users.getFirst(),false,120));assertEquals(1,results.stream().filter(Boolean::booleanValue).count());assertEquals(1,Db.num(db.one("select count(*) n from match_ticket where user_id=? and status='WAITING'",users.getFirst()),"n"));
    }
    @Test void fourAcceptAndVoteProduceExactlyOneFullRoom(){
        UUID proposal=group(false);for(int i=0;i<4;i++){UUID user=users.get(i);commands.transaction(()->matching.accept(proposal,user));}
        UUID selected=Db.uuid(db.one("select scenario_version_id from match_candidate where proposal_id=? order by rank limit 1",proposal),"scenario_version_id");
        for(int i=0;i<4;i++){UUID user=users.get(i);commands.transaction(()->matching.vote(proposal,user,selected));}
        expire(proposal);matching.tick();UUID room=Db.uuid(db.one("select room_id from match_proposal where id=?",proposal),"room_id");assertNotNull(room);assertEquals(4,Db.num(db.one("select count(*) n from room_participant where room_id=?",room),"n"));matching.tick();assertEquals(room,db.one("select room_id from match_proposal where id=?",proposal).get("room_id"));
    }
    @Test void blockedOrExposedUsersCannotBeProposed(){
        commands.transaction(()->{db.update("insert into user_block(user_id,blocked_id) values(?,?)",users.get(0),users.get(1));return null;});for(int i=0;i<4;i++)enqueue(users.get(i),false,120);matching.tick();assertWaiting();
        commands.transaction(()->{db.update("delete from user_block where user_id=?",users.getFirst());for(var s:db.list("select id from scenario"))db.update("insert into scenario_exposure(user_id,scenario_id) values(?,?)",users.getFirst(),s.get("id"));return null;});matching.tick();assertWaiting();
    }
    @Test void noMatchingScenarioMaintainsRealWaitingState(){for(int i=0;i<4;i++)enqueue(users.get(i),false,1);matching.tick();assertWaiting();}
    @Test void unpublishedWinnerEndsProposalInsteadOfLeavingItStuck(){
        UUID proposal=group(false);
        UUID winner=Db.uuid(db.one("select scenario_version_id from match_candidate where proposal_id=? order by rank limit 1",proposal),"scenario_version_id");
        for(int i=0;i<4;i++){UUID user=users.get(i);commands.transaction(()->{matching.accept(proposal,user);return null;});}
        for(int i=0;i<4;i++){UUID user=users.get(i);commands.transaction(()->matching.vote(proposal,user,winner));}
        try {
            commands.transaction(()->{db.update("update scenario_version set status='DRAFT' where id=?",winner);return null;});
            expire(proposal);matching.tick();
            assertEquals("ENDED",db.one("select status from match_proposal where id=?",proposal).get("status"));
            assertNull(db.one("select room_id from match_proposal where id=?",proposal).get("room_id"));
            for(int i=0;i<4;i++)assertEquals("IDLE",db.one("select kind from player_activity where user_id=?",users.get(i)).get("kind"));
        } finally {commands.transaction(()->{db.update("update scenario_version set status='PUBLISHED' where id=?",winner);return null;});}
    }
    @Test void rejectionRequeuesOthersWithOriginalPriority(){UUID proposal=group(true);var before=db.one("select queued_at from match_ticket where user_id=?",users.get(1)).get("queued_at");commands.transaction(()->matching.reject(proposal,users.getFirst()));assertEquals("IDLE",db.one("select kind from player_activity where user_id=?",users.getFirst()).get("kind"));assertEquals("QUEUED",db.one("select kind from player_activity where user_id=?",users.get(1)).get("kind"));assertEquals(before,db.one("select queued_at from match_ticket where user_id=?",users.get(1)).get("queued_at"));}
    @Test void timeoutAndZeroVotesDoNotStartGame(){UUID p=group(false);expire(p);matching.tick();assertEquals("ENDED",db.one("select status from match_proposal where id=?",p).get("status"));for(int i=0;i<4;i++)enqueue(users.get(i),false,120);matching.tick();UUID second=Db.uuid(db.one("select reference_id from player_activity where user_id=?",users.getFirst()),"reference_id");for(int i=0;i<4;i++){UUID user=users.get(i);commands.transaction(()->matching.accept(second,user));}expire(second);matching.tick();assertEquals("ENDED",db.one("select status from match_proposal where id=?",second).get("status"));assertNull(db.one("select room_id from match_proposal where id=?",second).get("room_id"));}
    @Test void cancelRacingFinalizationHasOneAuthoritativeOutcome()throws Exception{
        UUID p=group(false);for(int i=0;i<4;i++){UUID user=users.get(i);commands.transaction(()->matching.accept(p,user));}
        UUID candidate=Db.uuid(db.one("select scenario_version_id from match_candidate where proposal_id=? limit 1",p),"scenario_version_id");commands.transaction(()->matching.vote(p,users.getFirst(),candidate));UUID ticket=Db.uuid(db.one("select ticket_id from match_member where proposal_id=? and user_id=?",p,users.getFirst()),"ticket_id");expire(p);
        race(()->{matching.tick();return true;},()->commands.transaction(()->{matching.cancel(ticket,users.getFirst());return true;}));var state=db.one("select * from match_proposal where id=?",p);assertTrue(Set.of("ENDED","ROOM").contains(state.get("status")));String kind=Db.str(db.one("select kind from player_activity where user_id=?",users.getFirst()),"kind");assertEquals("ROOM".equals(state.get("status"))?"ROOM":"IDLE",kind);
    }
    private UUID create(UUID host){return commands.transaction(()->UUID.fromString(rooms.create(host,version,"PUBLIC","TEXT").get("roomId").toString()));}
    private boolean join(UUID room,UUID user){return commands.transaction(()->{rooms.join(room,user,null);return true;});}
    private boolean enqueue(UUID user,boolean requeue,int minutes){return commands.transaction(()->{matching.enqueue(user,new MatchingService.TicketRequest("ko",minutes,"TEXT",null,null,requeue));return true;});}
    private UUID group(boolean requeue){for(int i=0;i<4;i++)enqueue(users.get(i),requeue,120);matching.tick();return Db.uuid(db.one("select reference_id from player_activity where user_id=?",users.getFirst()),"reference_id");}
    private void expire(UUID id){commands.transaction(()->{db.update("update match_proposal set expires_at=now()-interval '1 second' where id=?",id);return null;});}
    private void assertWaiting(){for(int i=0;i<4;i++)assertEquals("QUEUED",db.one("select kind from player_activity where user_id=?",users.get(i)).get("kind"));}
    private List<Boolean> race(Callable<Boolean> a,Callable<Boolean> b)throws Exception{var latch=new CountDownLatch(1);try(var pool=Executors.newFixedThreadPool(2)){var x=pool.submit(()->{latch.await();try{return a.call();}catch(ApiException e){return false;}});var y=pool.submit(()->{latch.await();try{return b.call();}catch(ApiException e){return false;}});latch.countDown();return List.of(x.get(15,TimeUnit.SECONDS),y.get(15,TimeUnit.SECONDS));}}
}
