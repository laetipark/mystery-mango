package com.mysterymango.game;

import com.mysterymango.common.*;
import com.mysterymango.scenario.ScenarioService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;
import java.net.*;
import java.net.http.*;
import java.time.Duration;
import java.util.*;
import static com.mysterymango.game.Definitions.*;
import static org.junit.jupiter.api.Assertions.*;

/** Real sessions, CSRF and HTTP commands on PostgreSQL. Only the phase clock is advanced directly. */
@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT,properties={
        "app.voice-provider=disabled","app.game-phase-seconds=120","game.tick-ms=3600000","matching.tick-ms=3600000"})
class SmallGameHttpIntegrationTest {
    private static PostgreSQLContainer postgres;
    @DynamicPropertySource static void database(DynamicPropertyRegistry p) {
        String external=System.getenv("TEST_DATABASE_URL");
        if(external!=null&&!external.isBlank()) {
            p.add("spring.datasource.url",()->external);
            p.add("spring.datasource.username",()->System.getenv().getOrDefault("TEST_DATABASE_USER","mango"));
            p.add("spring.datasource.password",()->System.getenv().getOrDefault("TEST_DATABASE_PASSWORD","mango_local_only"));
        } else {
            postgres=new PostgreSQLContainer(DockerImageName.parse("postgres:17.11-alpine@sha256:b0f9560a2de083e2cc7382e75f808c7381a32852a7ec49117deedb300e552b24").asCompatibleSubstituteFor("postgres"));
            postgres.start();p.add("spring.datasource.url",postgres::getJdbcUrl);p.add("spring.datasource.username",postgres::getUsername);p.add("spring.datasource.password",postgres::getPassword);
        }
    }
    @LocalServerPort int port;
    @Autowired Json json;@Autowired Db db;@Autowired Commands commands;@Autowired GameService games;@Autowired ScenarioService scenarios;

    @Test void playerCountFiltersPublicCatalogBeforePaginationWithoutLeakingStoryData()throws Exception {
        try(Client client=new Client()) {
            assertEquals(5,integer(client.get("/api/v1/scenarios?gameType=MURDER_MYSTERY"),"total",0));
            for(int count:List.of(1,2,3,4)) {
                int expected=count==4?3:count==3?0:1;
                var first=client.get("/api/v1/scenarios?gameType=MURDER_MYSTERY&playerCount="+count+"&size=1");
                assertEquals(expected,integer(first,"total",-1));assertEquals(Math.min(1,expected),objects(first.get("items")).size());
                var beyond=client.get("/api/v1/scenarios?gameType=MURDER_MYSTERY&playerCount="+count+"&size=1&page="+expected);
                assertEquals(expected,integer(beyond,"total",-1));assertTrue(objects(beyond.get("items")).isEmpty());
                for(var card:objects(client.get("/api/v1/scenarios?gameType=MURDER_MYSTERY&playerCount="+count).get("items"))) {
                    assertEquals(count,integer(card,"playerCount",0));assertEquals(count,objects(card.get("roles")).size());
                    var definition=scenarios.definition(UUID.fromString(str(card,"versionId")));
                    String response=json.write(client.get("/api/v1/scenarios/"+card.get("id")));
                    for(var role:objects(definition.get("roles")))assertFalse(response.contains(str(role,"secret")));
                    for(var clue:objects(definition.get("clues")))assertFalse(response.contains(str(clue,"text")));
                    for(var ending:objects(definition.get("endings")))assertFalse(response.contains(str(ending,"text")));
                }
            }
            assertEquals(422,client.request("GET","/api/v1/scenarios?playerCount=0",null).statusCode());
            assertEquals(422,client.request("GET","/api/v1/scenarios?playerCount=5",null).statusCode());
            assertEquals(400,client.request("GET","/api/v1/scenarios?playerCount=1.5",null).statusCode());
            var schema=client.get("/api/openapi");
            var list=map(map(map(schema.get("paths")).get("/api/v1/scenarios")).get("get"));
            assertTrue(objects(list.get("parameters")).stream().anyMatch(p->"playerCount".equals(p.get("name"))&&"query".equals(p.get("in"))&&!Boolean.TRUE.equals(p.get("required"))));
        }
    }

    @ParameterizedTest
    @CsvSource({
            "locker-at-twelve,1,ACCUSE,accountable-preservation",
            "locker-at-twelve,1,ABSTAIN,preserved-without-verdict",
            "snowbound-last-parcel,2,ACCUSE,complete-chain",
            "snowbound-last-parcel,2,TIE,unresolved"})
    void smallRoomsPlayFromSignupThroughPrivateCluesToEnding(String slug,int count,String decision,String expectedEnding)throws Exception {
        List<Client> players=new ArrayList<>();
        try(Client outsider=new Client()) {
            outsider.signup();for(int i=0;i<count;i++){Client client=new Client();players.add(client);client.signup();}
            Client host=players.getFirst();
            UUID version=Db.uuid(db.one("select v.id from scenario_version v join scenario s on s.id=v.scenario_id where s.slug=? and v.status='PUBLISHED' order by v.version desc limit 1",slug),"id");
            var definition=scenarios.definition(version);
            String room=str(host.write("POST","/api/v1/rooms",Map.of("scenarioVersionId",version,"visibility","PUBLIC","mode","TEXT")),"roomId");
            String roomPath="/api/v1/rooms/"+room;
            assertEquals(409,host.request("POST",roomPath+"/start",Map.of()).statusCode());
            host.write("PUT",roomPath+"/ready",Map.of("ready",true));
            if(count==2) {
                assertEquals(409,host.request("POST",roomPath+"/start",Map.of()).statusCode());
                Client guest=players.get(1);guest.write("POST",roomPath+"/join",Map.of());
                assertEquals(409,host.request("POST",roomPath+"/start",Map.of()).statusCode());
                assertEquals(403,guest.request("POST",roomPath+"/start",Map.of()).statusCode());
                guest.write("PUT",roomPath+"/ready",Map.of("ready",true));
            }
            assertEquals(409,outsider.request("POST",roomPath+"/join",Map.of()).statusCode());
            var waiting=host.get(roomPath);assertEquals(count,integer(waiting,"capacity",0));
            assertEquals(count,objects(waiting.get("participants")).size());assertTrue(str(waiting,"rules").contains(count+"명이"));
            String game=str(host.write("POST",roomPath+"/start",Map.of()),"gameId");
            String path="/api/v1/games/"+game;
            assertEquals(403,outsider.request("GET",path+"/snapshot",null).statusCode());
            assertEquals(403,outsider.request("GET",path+"/me/role",null).statusCode());
            Set<String> assigned=new HashSet<>();
            for(Client player:players) {
                var snapshot=player.get(path+"/snapshot");assertEquals("READING",map(snapshot.get("phase")).get("kind"));
                assertEquals(count,objects(snapshot.get("participants")).size());assertNull(snapshot.get("ending"));
                var role=map(snapshot.get("myRole"));assigned.add(str(role,"id"));
                assertEquals(role,player.get(path+"/me/role"));
                String body=json.write(snapshot);
                for(var other:objects(definition.get("roles")))if(!other.get("id").equals(role.get("id")))assertFalse(body.contains(str(other,"secret")));
                if(count==2) {
                    String own="curator".equals(role.get("id"))?"identification-card":"custody-slip";
                    String other="curator".equals(role.get("id"))?"custody-slip":"identification-card";
                    assertEquals(List.of(own),objects(snapshot.get("clues")).stream().map(c->str(c,"id")).toList());
                    assertFalse(body.contains(str(find(definition,"clues",other),"text")));
                }
            }
            assertEquals(count,assigned.size());
            for(int i=0;i<count;i++) {
                players.get(i).write("POST",path+"/phase-ready",Map.of());
                assertEquals(i+1<count?"READING":"INVESTIGATION",map(host.get(path+"/snapshot").get("phase")).get("kind"));
            }
            var targets=objects(host.get(path+"/snapshot").get("targets"));assertEquals(4,targets.size());
            for(int i=0;i<targets.size();i++) {
                Client player=players.get(i%count);String target=str(targets.get(i),"id");
                player.write("POST",path+"/investigations",Map.of("targetId",target));
                if(count==2) {
                    String clue=strings(find(definition,"targets",target).get("clueIds")).getFirst();
                    String otherBody=json.write(players.get((i+1)%count).get(path+"/snapshot"));
                    assertFalse(otherBody.contains(str(find(definition,"clues",clue),"text")),"Investigations must remain private until shared");
                }
            }
            for(Client player:players) {
                var snapshot=player.get(path+"/snapshot");assertEquals(0,integer(snapshot,"investigationsRemaining",-1));
                for(var clue:objects(snapshot.get("clues")))if(Boolean.TRUE.equals(clue.get("owned")))player.write("POST",path+"/clue-shares",Map.of("clueId",clue.get("id"),"scope","PUBLIC"));
            }
            for(Client player:players) {
                var clues=objects(player.get(path+"/snapshot").get("clues"));
                assertEquals(objects(definition.get("clues")).size(),clues.size());assertTrue(clues.stream().allMatch(c->Boolean.TRUE.equals(c.get("public"))));
            }
            advance(game);assertEquals("DISCUSSION",map(host.get(path+"/snapshot").get("phase")).get("kind"));
            assertEquals(409,host.request("POST",path+"/investigations",Map.of("targetId",targets.getFirst().get("id"))).statusCode());
            advance(game);var ballot=map(host.get(path+"/snapshot").get("ballot"));assertTrue(bool(ballot,"allowAbstain"));
            String culprit=str(map(definition.get("ballot")),"culpritRoleId");
            for(int i=0;i<count;i++) {
                String vote=decision.equals("ABSTAIN")?null:decision.equals("TIE")&&i==1?assigned.stream().filter(r->!r.equals(culprit)).findFirst().orElseThrow():culprit;
                players.get(i).write("PUT",path+"/ballots/"+ballot.get("id")+"/me",Json.map("roleId",vote));
                var submitted=map(players.get(i).get(path+"/snapshot").get("ballot"));assertTrue(bool(submitted,"submitted"));assertEquals(vote,submitted.get("myVote"));
            }
            advance(game);
            for(Client player:players) {
                var result=player.get(path+"/snapshot");assertEquals("ENDING",map(result.get("phase")).get("kind"));
                assertEquals(find(definition,"endings",expectedEnding).get("title"),map(result.get("ending")).get("title"));
                assertTrue(bool(map(result.get("ending")),"objectiveAchieved"));
            }
            advance(game);games.tick();
            assertEquals("CLOSED",host.get(roomPath).get("status"));
            for(Client player:players) {
                assertEquals("COMPLETED",player.get(path+"/snapshot").get("status"));assertEquals("IDLE",player.get("/api/v1/me/activity").get("kind"));
                var history=player.get("/api/v1/me/history");assertEquals(1,integer(history,"total",0));assertEquals(game,str(objects(history.get("items")).getFirst(),"gameId"));
            }
        } finally {for(Client player:players)player.close();}
    }
    private void advance(String game){commands.transaction(()->{db.update("update phase_instance set ends_at=now()-interval '1 second' where id=(select current_phase_id from game_session where id=?)",UUID.fromString(game));games.tick();return null;});}
    private final class Client implements AutoCloseable {
        final HttpClient http=HttpClient.newBuilder().cookieHandler(new CookieManager(null,CookiePolicy.ACCEPT_ALL)).connectTimeout(Duration.ofSeconds(5)).build();
        String header,token;
        HttpResponse<String> request(String method,String path,Object body)throws Exception {
            var request=HttpRequest.newBuilder(URI.create("http://localhost:"+port+path)).timeout(Duration.ofSeconds(10)).header("Content-Type","application/json").header("Idempotency-Key",UUID.randomUUID().toString());
            if(!method.equals("GET"))request.header(header,token);
            return http.send(request.method(method,body==null?HttpRequest.BodyPublishers.noBody():HttpRequest.BodyPublishers.ofString(json.write(body))).build(),HttpResponse.BodyHandlers.ofString());
        }
        Map<String,Object> get(String path)throws Exception {return write("GET",path,null);}
        Map<String,Object> write(String method,String path,Object body)throws Exception {var response=request(method,path,body);assertEquals(200,response.statusCode(),()->method+" "+path+": "+response.body());return json.object(response.body());}
        void csrf()throws Exception {var result=get("/api/v1/auth/csrf");header=str(result,"headerName");token=str(result,"token");}
        void signup()throws Exception {csrf();write("POST","/api/v1/auth/register",Map.of("email","small-"+UUID.randomUUID()+"@example.test","password","MangoSmall!2026","displayName","샘플 검증"));csrf();}
        public void close(){http.close();}
    }
}
