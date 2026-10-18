package com.mysterymango.common;

import io.swagger.v3.oas.models.*;
import io.swagger.v3.oas.models.media.*;
import io.swagger.v3.oas.models.responses.ApiResponse;
import io.swagger.v3.oas.models.parameters.RequestBody;
import io.swagger.v3.oas.models.security.*;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.stereotype.Component;
import java.util.*;

/** Explicit allowlisted wire DTO schemas; never infer public models from persistence entities. */
@Component
public class ApiContracts implements OpenApiCustomizer {
    @Override public void customise(OpenAPI api){
        Components c=api.getComponents();if(c==null){c=new Components();api.setComponents(c);}
        c.addSecuritySchemes("session",new SecurityScheme().type(SecurityScheme.Type.APIKEY).in(SecurityScheme.In.COOKIE).name("SESSION"));
        api.setInfo(new io.swagger.v3.oas.models.info.Info().title("Mystery Mango API").version("1.0.0").description("Java 서버가 게임과 권한의 기준입니다. 변경 요청은 세션, CSRF 헤더, Idempotency-Key를 사용합니다."));
        c.addSchemas("ErrorResponse",obj("code",text(),"message",text(),"traceId",text()));
        c.addSchemas("CsrfResponse",obj("token",text(),"headerName",text()));
        api.path("/api/v1/auth/logout",new PathItem().post(new Operation().operationId("logout").tags(List.of("auth-controller")).responses(new io.swagger.v3.oas.models.responses.ApiResponses().addApiResponse("200",new ApiResponse().description("세션과 연결을 종료합니다.").content(content(obj("ok",bool())))))));
        c.addSchemas("UserView",obj("id",uuid(),"email",nullable(text()),"displayName",text(),"admin",bool()));
        c.addSchemas("AuthProviders",obj("kakaoConfigured",bool(),"localLoginEnabled",bool()));
        c.addSchemas("KakaoAuthorize",obj("authorizeUrl",text()));
        c.addSchemas("Activity",obj("kind",enumeration("IDLE","QUEUED","PROPOSED","ROOM","GAME"),"referenceId",nullable(uuid())));
        c.addSchemas("ScenarioCard",obj("id",uuid(),"versionId",uuid(),"title",text(),"synopsis",text(),"playerCount",integer(),"gameType",enumeration("MURDER_MYSTERY","TABLETOP","YACHT","GOMOKU","REVERSI","CHECKERS"),"engineId",text(),"supportedPlayerCounts",array(integer()),"estimatedMinutes",integer(),"durationEstimated",bool(),"genre",text(),"difficulty",text(),"language",text(),"modes",array(enumeration("TEXT","DISCORD")),"roles",array(obj("id",text(),"name",text(),"publicIntro",text()))));
        c.addSchemas("RoomCard",obj("id",uuid(),"title",text(),"scenarioVersionId",uuid(),"hostName",text(),"gameType",enumeration("MURDER_MYSTERY","TABLETOP","YACHT","GOMOKU","REVERSI","CHECKERS"),"count",integer(),"capacity",integer(),"mode",enumeration("TEXT","DISCORD")));
        c.addSchemas("RoomSnapshot",obj("id",uuid(),"title",text(),"scenarioVersionId",uuid(),"hostId",uuid(),"visibility",enumeration("PUBLIC","INVITE"),"mode",enumeration("TEXT","DISCORD"),"status",enumeration("WAITING","PLAYING","CLOSED"),"gameId",nullable(uuid()),"capacity",integer(),"gameType",enumeration("MURDER_MYSTERY","TABLETOP","YACHT","GOMOKU","REVERSI","CHECKERS"),"isTest",bool(),"participants",array(obj("userId",uuid(),"displayName",text(),"ready",bool(),"connected",bool())),"rules",text()));
        c.addSchemas("TicketView",obj("id",uuid(),"status",enumeration("WAITING","PROPOSED","CANCELLED","ROOM"),"queuedAt",date(),"proposalId",nullable(uuid()),"language",text(),"maxMinutes",integer(),"mode",enumeration("TEXT","DISCORD"),"genre",nullable(text()),"difficulty",nullable(text()),"requeue",bool(),"gameType",enumeration("MURDER_MYSTERY","TABLETOP","YACHT","GOMOKU","REVERSI","CHECKERS"),"capacity",integer(),"scenarioVersionId",nullable(uuid())));
        var candidate=new ObjectSchema();
        candidate.setProperties(new LinkedHashMap<>(c.getSchemas().get("ScenarioCard").getProperties()));
        candidate.addProperty("rank",integer());
        var candidateRequired=new ArrayList<>(c.getSchemas().get("ScenarioCard").getRequired());candidateRequired.add("rank");
        candidate.setRequired(candidateRequired);candidate.setAdditionalProperties(false);
        c.addSchemas("MatchProposal",obj("gameType",enumeration("MURDER_MYSTERY","TABLETOP","YACHT","GOMOKU","REVERSI","CHECKERS"),"capacity",integer(),"scenarioVersionId",nullable(uuid()),"id",uuid(),"status",enumeration("ACCEPTING","VOTING","ROOM","ENDED"),"expiresAt",date(),"roomId",nullable(uuid()),"members",array(obj("userId",uuid(),"displayName",text(),"accepted",bool())),"candidates",array(candidate),"myVote",nullable(uuid())));
        c.addSchemas("PrivateRole",obj("id",text(),"name",text(),"secret",text(),"objective",text()));
        c.addSchemas("ClueView",obj("id",text(),"title",text(),"text",text(),"owned",bool(),"public",bool(),"sharePolicy",enumeration("PRIVATE","PUBLIC","PUBLIC_AND_WHISPER")));
        c.addSchemas("PhaseView",obj("id",uuid(),"definitionId",text(),"kind",enumeration("READING","INVESTIGATION","DISCUSSION","VOTE","ENDING"),"endsAt",date(),"publicText",text(),"actions",array(text()),"ready",bool()));
        c.addSchemas("BallotView",obj("id",uuid(),"allowChange",bool(),"allowAbstain",bool(),"myVote",nullable(text()),"submitted",bool(),"endsAt",date()));
        c.addSchemas("GameSnapshot",obj("id",uuid(),"status",enumeration("ACTIVE","PAUSED","COMPLETED","ABORTED"),"stateVersion",integer(),"serverTime",date(),"phase",ref("PhaseView"),"participants",array(obj("userId",uuid(),"displayName",text(),"roleId",text(),"roleName",text(),"connected",bool(),"active",bool())),"myRole",ref("PrivateRole"),"clues",array(ref("ClueView")),"targets",array(obj("id",text(),"name",text(),"investigated",bool())),"investigationsRemaining",integer(),"ballot",nullable(ref("BallotView")),"whispers",array(obj("id",uuid(),"status",enumeration("INVITED","ACTIVE","CLOSED"),"inviterId",uuid(),"inviteeId",uuid())),"materials",array(obj("id",uuid(),"text",text())),"ending",nullable(obj("title",text(),"text",text(),"objectiveAchieved",bool())),"abortVotes",integer(),"abortRequired",integer(),"canRequestAbort",bool(),"scene",nullable(ref("SceneView")),"availableScenes",array(obj("id",text(),"name",text())),"canChangeScene",bool(),"layouts",array(ref("SceneView"))));
        c.addSchemas("ChatMessage",obj("id",uuid(),"senderId",uuid(),"senderName",text(),"text",text(),"createdAt",date(),"whisperId",nullable(uuid())));
        c.addSchemas("PlayHistoryEntry",obj("gameId",uuid(),"title",text(),"status",enumeration("COMPLETED","ABORTED"),"completedAt",nullable(date())));
        c.addSchemas("ServerEvent",obj("eventId",uuid(),"type",text(),"gameId",nullable(uuid()),"stateVersion",integer(),"serverTime",date()));
        response(api,"/api/v1/auth/csrf","CsrfResponse");response(api,"/api/v1/auth/me","UserView");response(api,"/api/v1/me/activity","Activity");
        response(api,"/api/v1/auth/providers","AuthProviders");
        var kakao=api.getPaths().get("/api/v1/auth/kakao");
        if(kakao!=null)kakao.getPost().getResponses().addApiResponse("200",new ApiResponse().description("카카오 인가 페이지 주소. 로그인한 세션에서는 계정 전환을 거부합니다.").content(content(ref("KakaoAuthorize"))));
        var callback=api.getPaths().get("/api/v1/auth/kakao/callback");
        if(callback!=null){callback.getGet().getResponses().remove("200");callback.getGet().getResponses().addApiResponse("302",new ApiResponse().description("로그인 후 검증된 같은 사이트 경로로 이동합니다. 실패 시 /login?kakaoError=cancelled|expired|failed|unavailable 로 이동합니다.").addHeaderObject("Location",new io.swagger.v3.oas.models.headers.Header().schema(text())));}
        response(api,"/api/v1/scenarios",page(ref("ScenarioCard")));response(api,"/api/v1/scenarios/{id}","ScenarioCard");
        response(api,"/api/v1/rooms",page(ref("RoomCard")));response(api,"/api/v1/rooms/{id}","RoomSnapshot");
        response(api,"/api/v1/match-tickets/{id}","TicketView");response(api,"/api/v1/match-proposals/{id}","MatchProposal");
        response(api,"/api/v1/games/{id}/snapshot","GameSnapshot");response(api,"/api/v1/games/{id}/me/role","PrivateRole");
        response(api,"/api/v1/games/{id}/messages",obj("items",array(ref("ChatMessage")),"hasMore",bool()));response(api,"/api/v1/me/history",page(ref("PlayHistoryEntry")));
        StudioApiContracts.configure(api);
        for(var entry:api.getPaths().entrySet())for(var op:entry.getValue().readOperations()){
            String path=entry.getKey();if(!Set.of("/api/v1/auth/login","/api/v1/auth/register","/api/v1/auth/csrf","/api/v1/auth/providers","/api/v1/auth/kakao","/api/v1/auth/kakao/callback").contains(path)&&!path.equals("/api/v1/meta")&&!path.startsWith("/api/v1/scenarios")&&!(path.equals("/api/v1/rooms")&&op==entry.getValue().getGet()))op.addSecurityItem(new SecurityRequirement().addList("session"));
            if(op!=entry.getValue().getGet())op.addParametersItem(new io.swagger.v3.oas.models.parameters.Parameter().name("X-CSRF-TOKEN").in("header").required(true).description("GET /api/v1/auth/csrf에서 받은 현재 세션 토큰").schema(text()));
            for(String status:List.of("400","401","403","404","409","413","422","429","503"))op.getResponses().addApiResponse(status,new ApiResponse().description("안정적인 오류 코드와 한국어 메시지").content(content(ref("ErrorResponse"))));
        }
        request(api,"/api/v1/auth/kakao",obj("next",text()).required(List.of()));
        request(api,"/api/v1/games/{id}/investigations",obj("targetId",text()));request(api,"/api/v1/games/{id}/clue-shares",obj("clueId",text(),"scope",enumeration("PUBLIC","WHISPER"),"whisperId",nullable(uuid())).required(List.of("clueId","scope")));
        request(api,"/api/v1/games/{id}/messages",obj("text",text(),"whisperId",nullable(uuid())).required(List.of("text")));request(api,"/api/v1/games/{id}/whispers",obj("inviteeId",uuid()));
        var ballot=api.getPaths().get("/api/v1/games/{id}/ballots/{ballotId}/me");if(ballot!=null)ballot.getPut().setRequestBody(new RequestBody().required(true).content(content(obj("roleId",nullable(text())))));
    }
    static Schema<?> text(){return new StringSchema();}
    static Schema<?> uuid(){return new StringSchema().format("uuid");}
    static Schema<?> date(){return new StringSchema().format("date-time");}
    static Schema<?> bool(){return new BooleanSchema();}
    static Schema<?> integer(){return new IntegerSchema();}
    static Schema<?> enumeration(String... values){return new StringSchema()._enum(List.of(values));}
    static Schema<?> ref(String name){return new Schema<>().$ref("#/components/schemas/"+name);}
    static Schema<?> nullable(Schema<?> schema){var nullSchema=new Schema<>();nullSchema.setTypes(Set.of("null"));return new Schema<>().anyOf(List.of(schema,nullSchema));}
    static Schema<?> array(Schema<?> schema){return new ArraySchema().items(schema);}
    static Schema<?> obj(Object... pairs){var schema=new ObjectSchema();List<String> required=new ArrayList<>();for(int i=0;i<pairs.length;i+=2){String name=(String)pairs[i];schema.addProperty(name,(Schema<?>)pairs[i+1]);required.add(name);}schema.setRequired(required);schema.setAdditionalProperties(false);return schema;}
    static Schema<?> page(Schema<?> item){return obj("items",array(item),"total",integer(),"page",integer(),"size",integer());}
    static Content content(Schema<?> schema){return new Content().addMediaType("application/json",new MediaType().schema(schema));}
    static void response(OpenAPI api,String path,String name){response(api,path,ref(name));}
    static void response(OpenAPI api,String path,Schema<?> schema){var item=api.getPaths().get(path);if(item!=null&&item.getGet()!=null)item.getGet().getResponses().addApiResponse("200",new ApiResponse().description("성공").content(content(schema)));}
    static void request(OpenAPI api,String path,Schema<?> schema){var item=api.getPaths().get(path);if(item!=null&&item.getPost()!=null)item.getPost().setRequestBody(new RequestBody().required(true).content(content(schema)));}
}
