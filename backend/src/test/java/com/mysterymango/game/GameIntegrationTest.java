package com.mysterymango.game;

import com.mysterymango.common.*;
import com.mysterymango.scenario.ScenarioService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import static com.mysterymango.game.Definitions.*;
import static org.junit.jupiter.api.Assertions.*;

/** These are real PostgreSQL tests. A missing Docker engine fails setup, never silently passes. */
@SpringBootTest(properties={"game.tick-ms=3600000","app.game-phase-seconds=120","app.voice-provider=disabled"})
class GameIntegrationTest {
    private static PostgreSQLContainer postgres;
    @DynamicPropertySource static void database(DynamicPropertyRegistry p) {
        String external=System.getenv("TEST_DATABASE_URL");
        if(external!=null&&!external.isBlank()) {
            p.add("spring.datasource.url",()->external);p.add("spring.datasource.username",()->System.getenv().getOrDefault("TEST_DATABASE_USER","mango"));p.add("spring.datasource.password",()->System.getenv().getOrDefault("TEST_DATABASE_PASSWORD","mango_local_only"));
        } else {
            postgres=new PostgreSQLContainer(DockerImageName.parse("postgres:17.11-alpine@sha256:b0f9560a2de083e2cc7382e75f808c7381a32852a7ec49117deedb300e552b24").asCompatibleSubstituteFor("postgres"));
            postgres.start();p.add("spring.datasource.url",postgres::getJdbcUrl);p.add("spring.datasource.username",postgres::getUsername);p.add("spring.datasource.password",postgres::getPassword);
        }
    }
    @Autowired GameService games; @Autowired Commands commands; @Autowired Db db; @Autowired Json json; @Autowired ScenarioService scenarios; @Autowired Activities activities; @Autowired Events events;
    private UUID gameId,roomId;private final List<UUID> users=new ArrayList<>();
    @BeforeEach void createGame() {
        commands.transaction(()->{
            UUID version=Db.uuid(db.one("select v.id from scenario_version v join scenario s on s.id=v.scenario_id where s.slug='after-hours-gallery' order by v.version desc limit 1"),"id");
            for(int i=0;i<4;i++){UUID id=UUID.randomUUID();users.add(id);db.update("insert into app_user(id,email,display_name,password_hash) values(?,?,?,'unused-test-hash')",id,id+"@test.invalid","테스트 "+i);db.update("insert into player_activity(user_id,kind) values(?,'IDLE')",id);}
            roomId=UUID.randomUUID();db.update("insert into room(id,scenario_version_id,host_id,visibility,mode) values(?,?,?,'PUBLIC','TEXT')",roomId,version,users.getFirst());
            for(UUID user:users){db.update("insert into room_participant(room_id,user_id,ready) values(?,?,true)",roomId,user);activities.set(user,"ROOM",roomId);}
            gameId=UUID.fromString(games.start(roomId,users.getFirst()).get("gameId").toString());return null;
        });
    }
    @Test void fourStableRolesAndPrivateSnapshotNeverReturnOtherSecrets() {
        Set<Object> roleIds=new HashSet<>();
        for(UUID user:users){var first=games.snapshot(gameId,user);var role=map(first.get("myRole"));roleIds.add(role.get("id"));assertEquals(role,games.snapshot(gameId,user).get("myRole"));
            var definition=scenarios.definition(Db.uuid(db.one("select * from game_session where id=?",gameId),"scenario_version_id"));String serialized=json.write(first);
            for(var other:objects(definition.get("roles")))if(!other.get("id").equals(role.get("id")))assertFalse(serialized.contains(str(other,"secret")));
        }
        assertEquals(4,roleIds.size());assertThrows(ApiException.class,()->games.role(gameId,UUID.randomUUID()));
        assertEquals(4,Db.num(db.one("select count(*) n from scenario_exposure where user_id in (?,?,?,?)",users.toArray()),"n"));
    }
    @Test void duplicateConcurrentInvestigationConsumesOnlyOneAllowance()throws Exception {
        advance();UUID user=users.getFirst();String key=UUID.randomUUID().toString();var start=new CountDownLatch(1);
        try(var pool=Executors.newFixedThreadPool(2)) {
            Callable<Map<String,Object>> work=()->{start.await();return commands.run(user,key,"test-investigation",Map.of("targetId","target-invoice"),()->games.investigate(gameId,user,"target-invoice"));};
            var a=pool.submit(work);var b=pool.submit(work);start.countDown();assertEquals(a.get(10,TimeUnit.SECONDS).get("investigationId").toString(),b.get(10,TimeUnit.SECONDS).get("investigationId").toString());
        }
        assertEquals(1,Db.num(db.one("select count(*) n from game_investigation where game_id=? and user_id=?",gameId,user),"n"));
        assertEquals(1,((Number)games.snapshot(gameId,user).get("investigationsRemaining")).intValue());
        assertThrows(ApiException.class,()->commands.run(user,key,"test-investigation",Map.of("targetId","target-entry"),()->games.investigate(gameId,user,"target-entry")));
    }
    @Test void whisperRecipientsAndSharedClueSurviveLeavingWithoutLeakingToOthers() {
        advance();UUID a=users.get(0),b=users.get(1),c=users.get(2);
        UUID whisper=commands.transaction(()->UUID.fromString(games.inviteWhisper(gameId,a,b).get("whisperId").toString()));
        commands.transaction(()->{games.acceptWhisper(gameId,b,whisper);games.investigate(gameId,a,"target-invoice");games.share(gameId,a,"invoice","WHISPER",whisper);games.message(gameId,a,"둘만의 증거",whisper);games.leaveWhisper(gameId,b,whisper);return null;});
        assertEquals(1,objects(games.messages(gameId,b,whisper,null,50).get("items")).size());
        assertThrows(ApiException.class,()->games.messages(gameId,c,whisper,null,50));
        assertTrue(objects(games.snapshot(gameId,b).get("clues")).stream().anyMatch(x->"invoice".equals(x.get("id"))));
        assertFalse(objects(games.snapshot(gameId,c).get("clues")).stream().anyMatch(x->"invoice".equals(x.get("id"))));
        assertEquals(2,Db.num(db.one("select count(*) n from message_recipient r join chat_message m on m.id=r.message_id where m.game_id=?",gameId),"n"));
    }
    @Test void restartRecoveryAdvancesOnlyOnePhaseAndPreservesRoles() {
        var before=games.role(gameId,users.getFirst());
        commands.transaction(()->{db.update("update phase_instance set ends_at=? where game_id=?",Instant.now().minus(Duration.ofDays(3)),gameId);return null;});
        GameService restarted=new GameService(commands,db,json,scenarios,activities,events,120,120,300,1800);
        commands.transaction(()->{restarted.tick();return null;});
        assertEquals(1,Db.num(db.one("select p.ordinal from phase_instance p join game_session g on g.current_phase_id=p.id where g.id=?",gameId),"ordinal"));
        assertTrue(Db.instant(db.one("select p.ends_at from phase_instance p join game_session g on g.current_phase_id=p.id where g.id=?",gameId),"ends_at").isAfter(Instant.now().plusSeconds(100)));
        assertEquals(before,games.role(gameId,users.getFirst()));
    }
    @Test void tiedBallotSelectsFallbackAndCompletesExactlyOnce() {
        for(int i=0;i<5;i++)advance();
        var ballot=map(games.snapshot(gameId,users.getFirst()).get("ballot"));UUID bid=UUID.fromString(ballot.get("id").toString());
        commands.transaction(()->{for(int i=0;i<4;i++)games.vote(gameId,users.get(i),bid,i<2?"manager":"guard");return null;});
        advance();var result=games.snapshot(gameId,users.getFirst());assertEquals("ENDING",map(result.get("phase")).get("kind"));assertEquals("엇갈린 지목 뒤의 진실",map(result.get("ending")).get("title"));
        advance();games.tick();assertEquals("COMPLETED",db.one("select status from game_session where id=?",gameId).get("status"));
        assertEquals(1,((Number)games.history(users.getFirst(),0,20).get("total")).intValue());
        for(UUID uid:users)assertEquals("IDLE",db.one("select kind from player_activity where user_id=?",uid).get("kind"));
    }
    @Test void absentPlayersCanBeAbortedByRemainingPlayersWithoutReplacement() {
        commands.transaction(()->{for(int i=1;i<4;i++)db.update("update player_role set last_seen_at=? where game_id=? and user_id=?",Instant.now().minusSeconds(600),gameId,users.get(i));games.abortVote(gameId,users.getFirst());return null;});
        assertEquals("ABORTED",games.snapshot(gameId,users.getFirst()).get("status"));assertNull(games.snapshot(gameId,users.getFirst()).get("ending"));
        assertEquals(4,Db.num(db.one("select count(*) n from player_role where game_id=?",gameId),"n"));
    }
    @Test void noVotesStillHaveAFiniteEndingAndPublicCatalogContainsNoSolution() {
        var game=db.one("select * from game_session where id=?",gameId);var card=scenarios.publicVersion(Db.uuid(game,"scenario_version_id"));
        assertFalse(card.containsKey("ballot"));assertFalse(card.containsKey("clues"));for(var role:objects(card.get("roles")))assertFalse(role.containsKey("secret"));
        for(int i=0;i<6;i++)advance();assertNotNull(games.snapshot(gameId,users.getFirst()).get("ending"));advance();
        assertEquals("COMPLETED",games.snapshot(gameId,users.getFirst()).get("status"));
    }
    @Test void explicitDepartureRevokesExistingMaterialAndMessageAccess() {
        advance();UUID actor=users.getFirst();commands.transaction(()->{games.investigate(gameId,actor,"target-invoice");games.message(gameId,actor,"이미 보낸 내용",null);games.leaveGame(gameId,actor);return null;});
        assertFalse(games.isParticipant(gameId,actor));assertThrows(ApiException.class,()->games.snapshot(gameId,actor));assertThrows(ApiException.class,()->games.messages(gameId,actor,null,null,50));
        assertEquals("IDLE",db.one("select kind from player_activity where user_id=?",actor).get("kind"));
        assertEquals(4,Db.num(db.one("select count(*) n from player_role where game_id=?",gameId),"n"));
    }
    private void advance(){commands.transaction(()->{db.update("update phase_instance set ends_at=? where id=(select current_phase_id from game_session where id=?)",Instant.now().minusSeconds(1),gameId);games.tick();return null;});}
}
