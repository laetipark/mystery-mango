package com.mysterymango.security;

import com.mysterymango.common.*;
import com.mysterymango.game.GameService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;
import java.net.*;
import java.net.http.*;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.BooleanSupplier;
import static org.junit.jupiter.api.Assertions.*;

/** Real HTTP cookies and native STOMP frames, backed by PostgreSQL; no mocked authentication. */
@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT,properties={
        "app.origins=http://localhost:5173", "app.voice-provider=disabled", "app.game-phase-seconds=120", "game.tick-ms=3600000"})
class HttpSecurityIntegrationTest {
    private static final String ORIGIN="http://localhost:5173";
    private static final String PASSWORD="MangoSecurity!2026";
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
    @Autowired Json json; @Autowired Db db; @Autowired Commands commands; @Autowired Events events;
    @Autowired GameService games; @Autowired SimpUserRegistry registry;

    @Test void apiDocumentationIsPublicAndMalformedRequestsRemainClientErrors()throws Exception {
        try(Client client=new Client()) {
            var docs=client.get("/api/docs");assertEquals(302,docs.statusCode());
            var index=client.get(docs.headers().firstValue("location").orElseThrow());
            assertEquals(200,index.statusCode());assertTrue(index.body().contains("swagger-ui"));
            assertEquals(200,client.get("/api/swagger-ui/swagger-ui-bundle.js").statusCode());
            client.signup();
            assertEquals(400,client.get("/api/v1/rooms/not-a-uuid").statusCode());
            assertEquals(404,client.get("/api/v1/does-not-exist").statusCode());
            var missingKey=HttpRequest.newBuilder(URI.create("http://localhost:"+port+"/api/v1/rooms"))
                    .header("Content-Type","application/json").header(client.header,client.token)
                    .POST(HttpRequest.BodyPublishers.ofString("{}")).build();
            assertEquals(400,client.http.send(missingKey,HttpResponse.BodyHandlers.ofString()).statusCode());
        }
    }

    @Test void actualResponseBodiesMatchPublishedOpenApiContracts()throws Exception {
        try(Client client=new Client()) {
            UUID actor=client.signup();
            var document=json.object(client.get("/api/openapi").body());
            for(String path:List.of("/api/v1/auth/csrf","/api/v1/auth/me","/api/v1/me/activity","/api/v1/scenarios","/api/v1/rooms","/api/v1/me/history"))
                WireContractAssertions.response(document,path,json.object(client.get(path).body()));
            UUID game=createGame(actor);
            UUID room=Db.uuid(db.one("select room_id from game_session where id=?",game),"room_id");
            WireContractAssertions.response(document,"/api/v1/rooms/{id}",json.object(client.get("/api/v1/rooms/"+room).body()));
            WireContractAssertions.response(document,"/api/v1/games/{id}/me/role",json.object(client.get("/api/v1/games/"+game+"/me/role").body()));
            WireContractAssertions.response(document,"/api/v1/games/{id}/messages",json.object(client.get("/api/v1/games/"+game+"/messages").body()));
            for(int phase=0;phase<8;phase++) {
                var snapshot=json.object(client.get("/api/v1/games/"+game+"/snapshot").body());
                WireContractAssertions.response(document,"/api/v1/games/{id}/snapshot",snapshot);
                if("COMPLETED".equals(snapshot.get("status")))break;
                commands.transaction(()->{db.update("update phase_instance set ends_at=now()-interval '1 second' where id=(select current_phase_id from game_session where id=?)",game);games.tick();return null;});
            }
            WireContractAssertions.response(document,"/api/v1/me/history",json.object(client.get("/api/v1/me/history").body()));
        }
    }

    @Test void studioAndSandboxResponsesMatchAllowlistedContracts()throws Exception {
        try(Client client=new Client()) {
            client.signup();var schema=json.object(client.get("/api/openapi").body());
            WireContractAssertions.response(schema,"/api/v1/author/templates",json.object(client.get("/api/v1/author/templates").body()));
            for(String type:List.of("MURDER_MYSTERY","TABLETOP","YACHT","GOMOKU","REVERSI","CHECKERS")){
                var created=client.request("POST","/api/v1/author/works",Json.map("title","계약 검증 "+type,"gameType",type),true);assertEquals(200,created.statusCode(),created.body());
                String work=json.object(created.body()).get("id").toString();
                var response=client.get("/api/v1/author/works/"+work);assertEquals(200,response.statusCode());var body=json.object(response.body());
                WireContractAssertions.response(schema,"/api/v1/author/works/{id}",body);
                var frozen=client.request("POST","/api/v1/author/works/"+work+"/freeze",Json.map("revision",body.get("revision")),true);assertEquals(200,frozen.statusCode(),frozen.body());
                var definition=(Map<?,?>)body.get("document");
                var sandbox=client.request("POST","/api/v1/author/sandboxes",Json.map("versionId",json.object(frozen.body()).get("versionId"),"capacity",definition.get("playerCount")),true);assertEquals(200,sandbox.statusCode(),sandbox.body());
                String id=json.object(sandbox.body()).get("id").toString();var view=client.get("/api/v1/author/sandboxes/"+id);assertEquals(200,view.statusCode(),view.body());
                WireContractAssertions.response(schema,"/api/v1/author/sandboxes/{id}",json.object(view.body()));
            }
            WireContractAssertions.response(schema,"/api/v1/author/works",json.object(client.get("/api/v1/author/works").body()));
            WireContractAssertions.response(schema,"/api/v1/author/assets",json.object(client.get("/api/v1/author/assets").body()));
        }
    }

    @Test void signupLoginSessionCsrfAdminAndLogoutAreEnforcedOverHttp()throws Exception {
        try(Client client=new Client()) {
            client.csrf();String email="security-"+UUID.randomUUID()+"@example.test";
            var signup=Map.of("email",email,"password",PASSWORD,"displayName","보안 검증");
            assertEquals(403,client.request("POST","/api/v1/auth/register",signup,false).statusCode());
            var registered=client.request("POST","/api/v1/auth/register",signup,true);assertEquals(200,registered.statusCode());
            UUID actor=UUID.fromString(json.object(registered.body()).get("id").toString());
            assertFalse(client.cookies.getCookieStore().getCookies().isEmpty(),"The HTTP session must be backed by a cookie");
            assertTrue(client.cookies.getCookieStore().getCookies().stream().anyMatch(HttpCookie::isHttpOnly));
            client.csrf();assertEquals(actor.toString(),json.object(client.get("/api/v1/auth/me").body()).get("id"));
            assertEquals(403,client.request("POST","/api/v1/match-tickets",Map.of("language","ko","maxMinutes",60,"mode","TEXT","requeue",false),false).statusCode());
            assertEquals(403,client.get("/api/v1/admin/reports").statusCode());
            assertEquals(200,client.request("POST","/api/v1/auth/logout",Map.of(),true).statusCode());
            assertEquals(401,client.get("/api/v1/auth/me").statusCode());
            client.csrf();assertEquals(200,client.request("POST","/api/v1/auth/login",Map.of("email",email,"password",PASSWORD),true).statusCode());
            assertEquals(actor.toString(),json.object(client.get("/api/v1/auth/me").body()).get("id"));
        }
    }

    @Test void forgedActorFieldsDoNotGrantAnotherUsersRoomOrGame()throws Exception {
        try(Client owner=new Client();Client stranger=new Client()) {
            UUID ownerId=owner.signup(),strangerId=stranger.signup();UUID gameId=createGame(ownerId);
            assertEquals(403,stranger.get("/api/v1/games/"+gameId+"/snapshot?userId="+ownerId).statusCode());
            assertEquals(403,stranger.get("/api/v1/games/"+gameId+"/me/role?userId="+ownerId).statusCode());
            var privateResponse=owner.get("/api/v1/games/"+gameId+"/me/role?userId="+strangerId);
            assertEquals(200,privateResponse.statusCode());
            assertEquals(db.one("select role_id from player_role where game_id=? and user_id=?",gameId,ownerId).get("role_id"),json.object(privateResponse.body()).get("id"));
            UUID version=Db.uuid(db.one("select scenario_version_id from game_session where id=?",gameId),"scenario_version_id");
            var forged=Json.map("scenarioVersionId",version,"visibility","PUBLIC","mode","TEXT","userId",ownerId,"hostId",ownerId);
            var roomResponse=stranger.request("POST","/api/v1/rooms",forged,true);assertEquals(200,roomResponse.statusCode());
            UUID room=UUID.fromString(json.object(roomResponse.body()).get("roomId").toString());
            assertEquals(strangerId.toString(),json.object(stranger.get("/api/v1/rooms/"+room).body()).get("hostId"));
            assertEquals(403,owner.get("/api/v1/rooms/"+room).statusCode());
        }
    }

    @Test void authenticatedOwnQueueSubscriptionReceivesOnlyServerEvents()throws Exception {
        try(Client client=new Client()) {
            UUID actor=client.signup();
            try(Socket socket=client.connect(client.token)) {
                socket.send("SUBSCRIBE\nid:own\ndestination:/user/queue/events\n\n\0");
                await(()->{
                    var user=registry.getUser(actor.toString());
                    return user!=null&&user.getSessions().stream().flatMap(s->s.getSubscriptions().stream()).anyMatch(s->s.getDestination().equals("/user/queue/events"));
                },Duration.ofSeconds(5),"The authorized user queue subscription was not registered");
                commands.transaction(()->{events.emit(List.of(actor),"SECURITY_TEST_EVENT",null,1);return null;});
                String frame=socket.frame("MESSAGE",Duration.ofSeconds(6));
                Map<String,Object> event=json.object(frame.substring(frame.indexOf("\n\n")+2));
                assertEquals("SECURITY_TEST_EVENT",event.get("type"));assertNotNull(event.get("eventId"));
                assertEquals(Set.of("eventId","type","gameId","stateVersion","serverTime"),event.keySet());
            }
        }
    }

    @Test void publicTopicsOtherUsersQueuesAndClientEventPublicationAreDenied()throws Exception {
        try(Client client=new Client()) {
            client.signup();
            for(String destination:List.of("/topic/all","/user/"+UUID.randomUUID()+"/queue/events","/queue/events")) {
                try(Socket socket=client.connect(client.token)) {
                    socket.send("SUBSCRIBE\nid:forbidden\ndestination:"+destination+"\n\n\0");
                    socket.denied();
                }
            }
            try(Socket socket=client.connect(client.token)) {
                socket.send("SEND\ndestination:/user/queue/events\ncontent-type:application/json\n\n{\"type\":\"GAME_COMPLETED\"}\0");
                socket.denied();
            }
        }
    }

    @Test void nativeStompConnectRequiresCsrfAndHandshakeRejectsForeignOrigin()throws Exception {
        try(Client client=new Client()) {
            client.signup();
            try(Socket socket=client.open(ORIGIN)) {
                socket.send("CONNECT\naccept-version:1.2\nhost:localhost\nheart-beat:0,0\n"+client.header+":incorrect-token\n\n\0");
                socket.denied();
            }
            ExecutionException failure=assertThrows(ExecutionException.class,()->client.http.newWebSocketBuilder().header("Origin","https://foreign.example").buildAsync(URI.create("ws://localhost:"+port+"/ws"),new Frames()).get(5,TimeUnit.SECONDS));
            Throwable reason=failure.getCause();while(reason.getCause()!=null&&!(reason instanceof WebSocketHandshakeException))reason=reason.getCause();
            assertInstanceOf(WebSocketHandshakeException.class,reason);
            assertEquals(403,((WebSocketHandshakeException)reason).getResponse().statusCode());
        }
    }

    @Test void logoutImmediatelyClosesPreviouslyAuthorizedSocket()throws Exception {
        try(Client client=new Client()) {
            client.signup();
            try(Socket socket=client.connect(client.token)) {
                assertEquals(200,client.request("POST","/api/v1/auth/logout",Map.of(),true).statusCode());
                assertNotNull(socket.listener.closed.get(5,TimeUnit.SECONDS));
                assertEquals(401,client.get("/api/v1/auth/me").statusCode());
            }
        }
    }

    private UUID createGame(UUID owner) {
        return commands.transaction(()->{
            UUID version=Db.uuid(db.one("select id from scenario_version where status='PUBLISHED' and definition->>'playerCount'='4' order by id limit 1"),"id");
            List<UUID> players=new ArrayList<>();players.add(owner);
            for(int i=0;i<3;i++){UUID id=UUID.randomUUID();players.add(id);db.update("insert into app_user(id,email,display_name,password_hash) values(?,?,?,'unused-http-security-test')",id,id+"@security.invalid","권한 검사 "+i);db.update("insert into player_activity(user_id,kind) values(?,'IDLE')",id);}
            UUID room=UUID.randomUUID();db.update("insert into room(id,scenario_version_id,host_id,visibility,mode) values(?,?,?,'PUBLIC','TEXT')",room,version,owner);
            for(UUID player:players){db.update("insert into room_participant(room_id,user_id,ready) values(?,?,true)",room,player);db.update("update player_activity set kind='ROOM',reference_id=? where user_id=?",room,player);}
            return UUID.fromString(games.start(room,owner).get("gameId").toString());
        });
    }
    private static void await(BooleanSupplier ready,Duration duration,String failure)throws InterruptedException {
        long end=System.nanoTime()+duration.toNanos();while(!ready.getAsBoolean()&&System.nanoTime()<end)Thread.sleep(20);assertTrue(ready.getAsBoolean(),failure);
    }
    private final class Client implements AutoCloseable {
        final CookieManager cookies=new CookieManager(null,CookiePolicy.ACCEPT_ALL);
        final HttpClient http=HttpClient.newBuilder().cookieHandler(cookies).connectTimeout(Duration.ofSeconds(5)).build();
        String token,header;
        HttpResponse<String> get(String path)throws Exception{return request("GET",path,null,false);}
        HttpResponse<String> request(String method,String path,Object body,boolean withCsrf)throws Exception {
            var builder=HttpRequest.newBuilder(URI.create("http://localhost:"+port+path)).timeout(Duration.ofSeconds(10)).header("Content-Type","application/json").header("Idempotency-Key",UUID.randomUUID().toString());
            if(withCsrf)builder.header(header,token);
            return http.send(builder.method(method,body==null?HttpRequest.BodyPublishers.noBody():HttpRequest.BodyPublishers.ofString(json.write(body))).build(),HttpResponse.BodyHandlers.ofString());
        }
        void csrf()throws Exception {var response=get("/api/v1/auth/csrf");assertEquals(200,response.statusCode());var body=json.object(response.body());token=body.get("token").toString();header=body.get("headerName").toString();}
        UUID signup()throws Exception {csrf();var response=request("POST","/api/v1/auth/register",Map.of("email","security-"+UUID.randomUUID()+"@example.test","password",PASSWORD,"displayName","권한 검증"),true);assertEquals(200,response.statusCode());UUID actor=UUID.fromString(json.object(response.body()).get("id").toString());csrf();return actor;}
        Socket open(String origin)throws Exception {var frames=new Frames();WebSocket webSocket=http.newWebSocketBuilder().header("Origin",origin).buildAsync(URI.create("ws://localhost:"+port+"/ws"),frames).get(5,TimeUnit.SECONDS);return new Socket(webSocket,frames);}
        Socket connect(String csrf)throws Exception {Socket socket=open(ORIGIN);socket.send("CONNECT\naccept-version:1.2\nhost:localhost\nheart-beat:0,0\n"+header+":"+csrf+"\n\n\0");try{socket.frame("CONNECTED",Duration.ofSeconds(5));return socket;}catch(Exception|AssertionError ex){socket.close();throw ex;}}
        public void close(){http.close();}
    }
    private static final class Socket implements AutoCloseable {
        final WebSocket socket;final Frames listener;
        Socket(WebSocket socket,Frames listener){this.socket=socket;this.listener=listener;}
        void send(String frame)throws Exception{socket.sendText(frame,true).get(5,TimeUnit.SECONDS);}
        String frame(String command,Duration timeout)throws Exception {
            long end=System.nanoTime()+timeout.toNanos();
            while(System.nanoTime()<end){String value=listener.frames.poll(100,TimeUnit.MILLISECONDS);if(value!=null){assertFalse(value.startsWith("ERROR"),"Server returned STOMP ERROR instead of "+command);if(value.startsWith(command+"\n"))return value;}if(listener.failure.get()!=null)throw new AssertionError("WebSocket transport failed",listener.failure.get());}
            throw new AssertionError("No STOMP "+command+" frame received");
        }
        void denied()throws Exception {
            long end=System.nanoTime()+Duration.ofSeconds(5).toNanos();
            while(System.nanoTime()<end){String frame=listener.frames.poll(50,TimeUnit.MILLISECONDS);if(frame!=null){assertFalse(frame.startsWith("CONNECTED"),"Unauthorized CONNECT was accepted");if(frame.startsWith("ERROR\n"))return;}if(listener.closed.isDone())return;if(listener.failure.get()!=null)throw new AssertionError("Unexpected transport failure instead of a security response",listener.failure.get());}
            fail("The unauthorized STOMP frame was neither rejected nor disconnected");
        }
        public void close(){socket.abort();}
    }
    private static final class Frames implements WebSocket.Listener {
        final BlockingQueue<String> frames=new LinkedBlockingQueue<>();final CompletableFuture<Integer> closed=new CompletableFuture<>();final AtomicReference<Throwable> failure=new AtomicReference<>();private final StringBuilder pending=new StringBuilder();
        @Override public void onOpen(WebSocket socket){socket.request(1);}
        @Override public CompletionStage<?> onText(WebSocket socket,CharSequence data,boolean last){
            pending.append(data);int boundary;
            while((boundary=pending.indexOf("\0"))>=0){String frame=pending.substring(0,boundary).stripLeading().replace("\r\n","\n");pending.delete(0,boundary+1);if(!frame.isBlank())frames.add(frame);}
            socket.request(1);return CompletableFuture.completedFuture(null);
        }
        @Override public CompletionStage<?> onClose(WebSocket socket,int status,String reason){closed.complete(status);return CompletableFuture.completedFuture(null);}
        @Override public void onError(WebSocket socket,Throwable error){failure.set(error);}
    }
}
