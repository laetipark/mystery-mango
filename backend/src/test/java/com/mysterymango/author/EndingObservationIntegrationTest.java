package com.mysterymango.author;

import com.mysterymango.common.*;
import com.mysterymango.game.*;
import com.mysterymango.room.RoomService;
import com.mysterymango.scenario.ScenarioService;
import java.net.*;
import java.net.http.*;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import static com.mysterymango.common.Json.map;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT,properties={"game.tick-ms=3600000","app.game-phase-seconds=120","app.voice-provider=disabled"})
class EndingObservationIntegrationTest {
    @DynamicPropertySource static void database(DynamicPropertyRegistry p){AuthorIntegrationTest.database(p);}
    @Autowired Db db;@Autowired Json json;@Autowired Commands commands;@Autowired AuthorService authors;
    @Autowired SandboxService sandboxes;@Autowired EndingObservationService observations;@Autowired GameService games;
    @Autowired ScenarioService scenarios;@Autowired RoomService rooms;
    @LocalServerPort int port;
    private UUID owner,admin,outsider;
    private record Work(UUID id,UUID version){}
    private record Game(UUID id,List<UUID> players){}

    @BeforeEach void users(){commands.transaction(()->{owner=user(false);admin=user(true);outsider=user(false);return null;});}
    @AfterEach void hidePublishedFixtures(){commands.transaction(()->db.update("update scenario_version set status='DRAFT' where scenario_id in (select scenario_id from author_work where owner_id=?)",owner));}

    @Test void sandboxRecordsOnEndingEntryAndResetPreservesFirstReachAcrossDifferentBranches(){
        var work=work("MURDER_MYSTERY");UUID run=sandbox(owner,work.version);
        assertEquals(0,observations.get(owner,work.version).get("reachedEndings"));
        reach(run,owner,false);
        assertEquals("ACTIVE",object(sandboxes.snapshot(run,owner,0).get("state")).get("status"));
        var first=ending(owner,work.version,"unresolved");assertNotNull(first.get("authorReachedAt"));assertNull(first.get("reviewerReachedAt"));assertNull(first.get("invitedTestReachedAt"));
        sandboxCommand(run,owner,0,"ADVANCE_TIME",Map.of());assertEquals("COMPLETED",object(sandboxes.snapshot(run,owner,0).get("state")).get("status"));
        sandboxCommand(run,owner,0,"RESET",Map.of());assertEquals(1,observations.get(owner,work.version).get("reachedEndings"));
        reach(run,owner,false);assertEquals(first,ending(owner,work.version,"unresolved"));
        sandboxCommand(run,owner,0,"RESET",Map.of());reach(run,owner,true);
        assertEquals(2,observations.get(owner,work.version).get("reachedEndings"));assertEquals(2,count("select count(*) n from sandbox_ending_observation where sandbox_id=?",run));
        assertEquals("IDLE",db.one("select kind from player_activity where user_id=?",owner).get("kind"));
        assertEquals(0,count("select count(*) n from game_session where scenario_version_id=?",work.version));
    }

    @Test void reviewerIsClassifiedByActorIncludingAnAuthorsRunAndRecordsStayIsolatedByVersion(){
        var work=work("MURDER_MYSTERY");commands.transaction(()->authors.submit(owner,work.id,1));
        UUID ownRun=sandbox(owner,work.version);sandboxes.snapshot(ownRun,admin,0);
        assertEquals(1,count("select count(*) n from scenario_exposure_source where user_id=? and version_id=? and source='AUTHOR_PREVIEW'",admin,work.version));
        reach(ownRun,admin,false);
        assertNull(ending(owner,work.version,"unresolved").get("authorReachedAt"));assertNotNull(ending(owner,work.version,"unresolved").get("reviewerReachedAt"));
        UUID reviewRun=sandbox(admin,work.version);reach(reviewRun,admin,true);
        assertEquals(2,observations.get(admin,work.version).get("reachedEndings"));
        sandboxCommand(ownRun,owner,0,"RESET",Map.of());reach(ownRun,owner,false);
        assertNotNull(ending(owner,work.version,"unresolved").get("authorReachedAt"));assertEquals(2,count("select count(*) n from sandbox_ending_observation where sandbox_id=?",ownRun));
        var edited=document(work.id);edited.put("title","다음 초안");rows(edited.get("endings")).getFirst().put("title","새 버전 엔딩 제목");commands.transaction(()->authors.save(owner,work.id,1,edited));
        UUID next=commands.transaction(()->authors.freeze(owner,work.id,2));assertNotEquals(next,work.version);assertEquals(0,observations.get(owner,next).get("reachedEndings"));
        assertEquals("사건 해결",ending(owner,work.version,"solved").get("title"));assertEquals("새 버전 엔딩 제목",ending(owner,next,"solved").get("title"));
        assertEquals(403,assertThrows(ApiException.class,()->observations.get(admin,next)).status);
    }

    @Test void failedTransitionRollsBackStateAndRecordAndConcurrentRetriesOnlyRecordOnce()throws Exception{
        var work=work("MURDER_MYSTERY");UUID run=sandbox(owner,work.version);advanceToVote(run,owner);long before=revision(run,owner);
        assertThrows(IllegalStateException.class,()->commands.transaction(()->{sandboxes.command(run,owner,0,"ADVANCE_TIME",before,Map.of());throw new IllegalStateException("강제 롤백");}));
        assertEquals(before,revision(run,owner));assertEquals(0,count("select count(*) n from sandbox_ending_observation where sandbox_id=?",run));
        var start=new CountDownLatch(1);String first=UUID.randomUUID().toString(),second=UUID.randomUUID().toString();List<String> results;
        try(var pool=Executors.newFixedThreadPool(2)){var a=pool.submit(()->concurrentEnding(start,run,before,first));var b=pool.submit(()->concurrentEnding(start,run,before,second));start.countDown();results=List.of(a.get(10,TimeUnit.SECONDS),b.get(10,TimeUnit.SECONDS));}
        assertEquals(1,results.stream().filter("OK"::equals).count());assertEquals(1,results.stream().filter("STALE_STATE"::equals).count());
        String winningKey=results.getFirst().equals("OK")?first:second;assertEquals("OK",concurrentEnding(new CountDownLatch(0),run,before,winningKey));
        assertEquals(before+1,revision(run,owner));assertEquals(1,count("select count(*) n from sandbox_ending_observation where sandbox_id=?",run));
    }

    @Test void invitedTestsRecordBeforeCompletionAndKeepObservationsAfterAbortButNotBeforeEnding(){
        var work=work("MURDER_MYSTERY");var game=start(work,true);realReach(game,true);
        assertEquals("ACTIVE",db.one("select status from game_session where id=?",game.id).get("status"));
        var record=ending(owner,work.version,"solved");assertNotNull(record.get("invitedTestReachedAt"));assertNull(record.get("authorReachedAt"));
        for(UUID player:game.players)commands.transaction(()->games.abortVote(game.id,player));
        assertEquals("ABORTED",db.one("select status from game_session where id=?",game.id).get("status"));assertEquals(record,ending(owner,work.version,"solved"));
        assertEquals(0,((Number)games.history(game.players.get(1),0,20).get("total")).intValue());
        String wire=json.write(games.snapshot(game.id,game.players.get(1)));for(String forbidden:List.of("authorReachedAt","reviewerReachedAt","invitedTestReachedAt","reachedEndings","authorRevision"))assertFalse(wire.contains(forbidden));
        assertEquals(403,assertThrows(ApiException.class,()->observations.get(game.players.get(1),work.version)).status);
        var aborted=start(work,true);for(UUID player:aborted.players)commands.transaction(()->games.abortVote(aborted.id,player));
        assertEquals(0,count("select count(*) n from invited_test_ending_observation where game_id=?",aborted.id));
        UUID ownRun=sandbox(owner,work.version);reach(ownRun,owner,true);
        assertNotNull(ending(owner,work.version,"solved").get("authorReachedAt"));assertEquals(record.get("invitedTestReachedAt"),ending(owner,work.version,"solved").get("invitedTestReachedAt"));
        assertEquals(1,observations.get(owner,work.version).get("reachedEndings"));
    }

    @Test void normalGamesNeverContributeAndCompositeForeignKeyRejectsFalseTestProvenance(){
        var work=work("MURDER_MYSTERY");var game=start(work,false);realReach(game,false);
        assertEquals("unresolved",db.one("select ending_id from game_session where id=?",game.id).get("ending_id"));assertEquals(0,observations.get(owner,work.version).get("reachedEndings"));
        assertThrows(DataIntegrityViolationException.class,()->commands.transaction(()->db.update("insert into invited_test_ending_observation(game_id,ending_id,reached_at) values(?,'unresolved',now())",game.id)));
        assertThrows(DataIntegrityViolationException.class,()->commands.transaction(()->db.update("insert into invited_test_ending_observation(game_id,is_test,ending_id,reached_at) values(?,false,'unresolved',now())",game.id)));
        assertThrows(DataIntegrityViolationException.class,()->commands.transaction(()->db.update("insert into sandbox_ending_observation(sandbox_id,ending_id,observer_kind,observed_by,reached_at) values(?,'unresolved','AUTHOR',?,now())",UUID.randomUUID(),owner)));
        expire(game.id);assertEquals("COMPLETED",db.one("select status from game_session where id=?",game.id).get("status"));assertEquals(1,((Number)games.history(game.players.getFirst(),0,20).get("total")).intValue());
        assertEquals(0,observations.get(owner,work.version).get("reachedEndings"));
    }

    @Test void frozenVersionReadUsesItsOwnDocumentPermissionsAndSpoilerExposure(){
        var work=work("MURDER_MYSTERY");var changed=document(work.id);changed.put("title","아직 저장 중인 초안");commands.transaction(()->authors.save(owner,work.id,1,changed));
        var frozen=authors.getVersion(owner,work.id,work.version);assertEquals("관찰 시험 작품",object(frozen.get("document")).get("title"));assertEquals(1L,((Number)frozen.get("authorRevision")).longValue());
        assertEquals(Set.of("workId","versionId","version","authorRevision","status","reviewStatus","reviewNote","document"),frozen.keySet());
        assertEquals(403,assertThrows(ApiException.class,()->authors.getVersion(outsider,work.id,work.version)).status);
        assertEquals(403,assertThrows(ApiException.class,()->authors.getVersion(admin,work.id,work.version)).status);
        assertEquals(404,assertThrows(ApiException.class,()->authors.getVersion(owner,work("TABLETOP").id,work.version)).status);
        commands.transaction(()->{db.update("insert into scenario_review(id,version_id,author_id,status) values(?,?,?,'PENDING')",UUID.randomUUID(),work.version,owner);return null;});
        observations.get(admin,work.version);assertEquals(1,count("select count(*) n from scenario_exposure_source where user_id=? and version_id=? and source='AUTHOR_PREVIEW'",admin,work.version));
        authors.getVersion(admin,work.id,work.version);assertEquals(1,count("select count(*) n from scenario_exposure_source where user_id=? and version_id=? and source='AUTHOR_PREVIEW'",admin,work.version));
        assertEquals(1,count("select count(*) n from scenario_exposure where user_id=? and scenario_id=(select scenario_id from scenario_version where id=?)",admin,work.version));
        assertEquals(0,count("select count(*) n from scenario_exposure_source where user_id=? and version_id=?",outsider,work.version));
        var board=work("YACHT");assertEquals(map("versionId",board.version,"authorRevision",1L,"totalEndings",0,"reachedEndings",0,"endings",List.of()),observations.get(owner,board.version));
    }

    @Test void httpReadContractsRequireLoginAndOwnershipAndNeverAddObservationFieldsToPublicCards()throws Exception{
        try(var author=new Client();var other=new Client();var anonymous=new Client()){
            author.signup();other.signup();String work=author.write("POST","/author/works",map("title","HTTP 고정 버전","gameType","MURDER_MYSTERY")).get("id").toString();String version=author.write("POST","/author/works/"+work+"/freeze",map("revision",1)).get("versionId").toString();
            String versionPath="/author/works/"+work+"/versions/"+version,observationPath="/author/versions/"+version+"/ending-observations";
            for(String path:List.of(versionPath,observationPath)){assertEquals(401,anonymous.get(path).statusCode());assertEquals(403,other.get(path).statusCode());}
            var frozen=author.read(versionPath);assertEquals(Set.of("workId","versionId","version","authorRevision","status","reviewStatus","reviewNote","document"),frozen.keySet());assertEquals(version,frozen.get("versionId"));
            var observed=author.read(observationPath);assertEquals(Set.of("versionId","authorRevision","totalEndings","reachedEndings","endings"),observed.keySet());assertEquals(2,observed.get("totalEndings"));assertEquals(0,observed.get("reachedEndings"));
            for(var ending:rows(observed.get("endings")))assertEquals(Set.of("endingId","title","authorReachedAt","reviewerReachedAt","invitedTestReachedAt"),ending.keySet());
            commands.transaction(()->db.update("update scenario_version set status='PUBLISHED' where id=?",UUID.fromString(version)));
            var card=scenarios.publicVersion(UUID.fromString(version));for(String forbidden:List.of("endings","document","reachedEndings","authorRevision"))assertFalse(card.containsKey(forbidden));
            commands.transaction(()->db.update("update scenario_version set status='DRAFT' where id=?",UUID.fromString(version)));
        }
    }

    private Work work(String type){return commands.transaction(()->{UUID id=Db.uuid(authors.create(owner,"관찰 시험 작품",type),"id");return new Work(id,authors.freeze(owner,id,1));});}
    private UUID user(boolean admin){UUID id=UUID.randomUUID();db.update("insert into app_user(id,email,display_name,password_hash,admin) values(?,?,?,'unused',?)",id,id+"@observations.invalid","엔딩 시험",admin);db.update("insert into player_activity(user_id,kind) values(?,'IDLE')",id);return id;}
    private Map<String,Object> document(UUID work){return object(authors.get(owner,work).get("document"));}
    private UUID sandbox(UUID actor,UUID version){return commands.transaction(()->Db.uuid(sandboxes.create(actor,version,2),"id"));}
    private long revision(UUID run,UUID actor){return ((Number)sandboxes.snapshot(run,actor,0).get("stateVersion")).longValue();}
    private void sandboxCommand(UUID run,UUID actor,int seat,String type,Map<String,Object> payload){commands.transaction(()->sandboxes.command(run,actor,seat,type,revision(run,actor),payload));}
    private void advanceToVote(UUID run,UUID actor){sandboxCommand(run,actor,0,"ADVANCE_TIME",Map.of());sandboxCommand(run,actor,0,"ADVANCE_TIME",Map.of());}
    private void reach(UUID run,UUID actor,boolean solved){advanceToVote(run,actor);if(solved)for(int seat=0;seat<2;seat++)sandboxCommand(run,actor,seat,"VOTE",map("roleId","role-1"));sandboxCommand(run,actor,0,"ADVANCE_TIME",Map.of());}
    private Map<String,Object> ending(UUID actor,UUID version,String id){return rows(observations.get(actor,version).get("endings")).stream().filter(e->id.equals(e.get("endingId"))).findFirst().orElseThrow();}
    private int count(String sql,Object... args){return Db.num(db.one(sql,args),"n");}
    private String concurrentEnding(CountDownLatch latch,UUID run,long expected,String key)throws InterruptedException{latch.await();try{commands.run(owner,key,"observation-test:"+run,map("expectedVersion",expected),()->sandboxes.command(run,owner,0,"ADVANCE_TIME",expected,Map.of()),r->sandboxes.authorize(run,owner));return "OK";}catch(ApiException e){return e.code;}}
    private Game start(Work work,boolean test){return commands.transaction(()->{UUID host=test?owner:user(false),guest=user(false);UUID room;
        if(test){byte[] bytes=new byte[32];new java.security.SecureRandom().nextBytes(bytes);String token=Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);room=Db.uuid(rooms.createTest(host,work.version,2,"TEXT",token),"roomId");rooms.join(room,guest,token);}
        else{db.update("update scenario_version set status='PUBLISHED' where id=?",work.version);room=Db.uuid(rooms.create(host,work.version,"PUBLIC","TEXT"),"roomId");rooms.join(room,guest,null);}
        rooms.ready(room,host,true);rooms.ready(room,guest,true);return new Game(Db.uuid(games.start(room,host),"gameId"),List.of(host,guest));});}
    private void realReach(Game game,boolean solved){for(UUID p:game.players)commands.transaction(()->games.phaseReady(game.id,p));expire(game.id);if(solved){UUID ballot=Db.uuid(db.one("select id from ballot where game_id=? and closed_at is null",game.id),"id");for(UUID p:game.players)commands.transaction(()->games.vote(game.id,p,ballot,"role-1"));}expire(game.id);}
    private void expire(UUID game){commands.transaction(()->{db.update("update phase_instance set ends_at=? where id=(select current_phase_id from game_session where id=?)",Instant.now().minusSeconds(1),game);games.tick();return null;});}
    @SuppressWarnings("unchecked") private static Map<String,Object> object(Object value){return (Map<String,Object>)value;}
    @SuppressWarnings("unchecked") private static List<Map<String,Object>> rows(Object value){return (List<Map<String,Object>>)value;}

    private final class Client implements AutoCloseable{
        final HttpClient http=HttpClient.newBuilder().cookieHandler(new CookieManager(null,CookiePolicy.ACCEPT_ALL)).connectTimeout(Duration.ofSeconds(10)).build();String csrf,header;
        HttpResponse<String> get(String path)throws Exception{return http.send(HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+port+"/api/v1"+path)).GET().build(),HttpResponse.BodyHandlers.ofString());}
        Map<String,Object> read(String path)throws Exception{var response=get(path);assertEquals(200,response.statusCode(),response.body());return json.object(response.body());}
        Map<String,Object> write(String method,String path,Object body)throws Exception{var response=http.send(HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+port+"/api/v1"+path)).header(header,csrf).header("Content-Type","application/json").header("Idempotency-Key",UUID.randomUUID().toString()).method(method,HttpRequest.BodyPublishers.ofString(json.write(body))).build(),HttpResponse.BodyHandlers.ofString());assertEquals(200,response.statusCode(),response.body());return json.object(response.body());}
        void refreshCsrf()throws Exception{var response=read("/auth/csrf");csrf=response.get("token").toString();header=response.get("headerName").toString();}
        void signup()throws Exception{refreshCsrf();write("POST","/auth/register",map("email","observation-"+UUID.randomUUID()+"@example.test","password","ObservationTest!2026","displayName","엔딩 HTTP 시험"));refreshCsrf();}
        public void close(){http.close();}
    }
}
