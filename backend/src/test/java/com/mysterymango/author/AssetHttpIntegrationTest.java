package com.mysterymango.author;

import com.mysterymango.common.Json;
import java.awt.image.BufferedImage;
import java.io.*;
import java.net.*;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT,properties={"app.voice-provider=disabled","game.tick-ms=3600000"})
class AssetHttpIntegrationTest {
    @DynamicPropertySource static void database(DynamicPropertyRegistry p){AuthorIntegrationTest.database(p);}
    @LocalServerPort int port;@Autowired Json json;
    @Test void realMultipartRequiresCsrfAndImageDownloadChecksTheCurrentUser()throws Exception{
        try(var owner=new Client();var outsider=new Client()){
            owner.signup();outsider.signup();byte[] png=png();
            assertEquals(403,owner.upload(png,false,false).statusCode());
            var uploaded=owner.upload(png,true,false);assertEquals(200,uploaded.statusCode(),uploaded.body());var body=json.object(uploaded.body());assertEquals(Set.of("id","name","mimeType","size"),body.keySet());
            assertEquals("image/png",body.get("mimeType"));String id=body.get("id").toString();
            var image=owner.http.send(HttpRequest.newBuilder(owner.uri("/assets/"+id)).GET().build(),HttpResponse.BodyHandlers.ofByteArray());assertEquals(200,image.statusCode());assertEquals("image/png",image.headers().firstValue("Content-Type").orElseThrow());assertEquals("nosniff",image.headers().firstValue("X-Content-Type-Options").orElseThrow());assertNotNull(ImageIO.read(new ByteArrayInputStream(image.body())));
            assertEquals(404,outsider.get("/assets/"+id).statusCode());
            var deleted=owner.json("DELETE","/author/assets/"+id,Map.of());assertEquals(200,deleted.statusCode());assertEquals(404,owner.get("/assets/"+id).statusCode());
        }
    }
    @Test void actualChunkedUploadOverFileLimitIsRejectedWithoutTrustingContentLength()throws Exception{
        try(var owner=new Client()){
            owner.signup();byte[] oversized=new byte[25*1024*1024+1];var result=owner.upload(oversized,true,true);assertEquals(413,result.statusCode(),result.body());
            assertEquals(List.of(),json.object(owner.get("/author/assets").body()).get("items"));
        }
    }
    @Test void templateCatalogReturnsOnlySafeMetadataAndCreationUsesTheServerRegistry()throws Exception{
        try(var owner=new Client()){
            owner.signup();var response=owner.read("/author/templates");assertEquals(Set.of("items"),response.keySet());var templates=(List<Map<String,Object>>)response.get("items");assertEquals(12,templates.size());
            var bases=List.of("mystery","tabletop","yacht","gomoku","reversi","checkers");
            assertEquals(bases.stream().flatMap(id->java.util.stream.Stream.of(id+"-starter",id+"-blank")).collect(java.util.stream.Collectors.toSet()),templates.stream().map(t->t.get("id").toString()).collect(java.util.stream.Collectors.toSet()));
            for(var template:templates){assertEquals(Set.of("id","title","description","gameType","playerCounts","customizable","rulesSummary","blank"),template.keySet());assertEquals(template.get("id").toString().endsWith("-blank"),template.get("blank"));assertFalse(((List<?>)template.get("customizable")).isEmpty());assertFalse(template.get("rulesSummary").toString().isBlank());}
            String metadata=json.write(response);for(String privateField:List.of("\"document\"","\"definition\"","\"secret\"","\"roles\"","\"ownerId\""))assertFalse(metadata.contains(privateField));
            String work=owner.write("POST","/author/works",Map.of("title","템플릿에서 만든 오목","templateId","gomoku-starter")).get("id").toString();var definition=(Map<?,?>)owner.read("/author/works/"+work).get("document");assertEquals("GOMOKU",definition.get("gameType"));assertEquals("gomoku-v1",definition.get("engineId"));assertEquals(List.of(2),definition.get("supportedPlayerCounts"));
            var edited=json.object(json.write(definition));edited.put("title","다른 창에서 저장한 오목");owner.write("PUT","/author/works/"+work,Map.of("revision",1,"document",edited));
            var stale=owner.json("POST","/author/works/"+work+"/validate",Map.of("revision",1));assertEquals(409,stale.statusCode());assertEquals("DRAFT_CONFLICT",json.object(stale.body()).get("code"));assertEquals(true,owner.write("POST","/author/works/"+work+"/validate",Map.of("revision",2)).get("valid"));
            var noBody=owner.http.send(HttpRequest.newBuilder(owner.uri("/author/works/"+work+"/validate")).header(owner.csrfHeader,owner.csrf).POST(HttpRequest.BodyPublishers.noBody()).build(),HttpResponse.BodyHandlers.ofString());assertEquals(200,noBody.statusCode(),noBody.body());assertEquals(true,json.object(noBody.body()).get("valid"));
            var mismatch=owner.json("POST","/author/works",Map.of("title","유형 바꿔치기","templateId","gomoku-starter","gameType","YACHT"));assertEquals(422,mismatch.statusCode());assertEquals("TEMPLATE_TYPE_MISMATCH",json.object(mismatch.body()).get("code"));
            var unknown=owner.json("POST","/author/works",Map.of("title","다른 원본 요청","templateId",UUID.randomUUID().toString()));assertEquals(422,unknown.statusCode());assertEquals("UNKNOWN_TEMPLATE",json.object(unknown.body()).get("code"));
        }
    }
    @Test void blankTemplateHttpCreationAllowsDraftSaveButBlocksIncompleteFreezeAndSubmission()throws Exception{
        try(var owner=new Client()){
            owner.signup();String work=owner.write("POST","/author/works",Map.of("title","빈 추리극","templateId","mystery-blank")).get("id").toString();var draft=owner.read("/author/works/"+work);var definition=(Map<?,?>)draft.get("document");
            assertEquals("MURDER_MYSTERY",definition.get("gameType"));assertEquals("",definition.get("synopsis"));assertEquals(List.of(),definition.get("roles"));assertEquals(List.of(),definition.get("phases"));assertEquals("",((Map<?,?>)definition.get("ballot")).get("culpritRoleId"));
            assertEquals(2,owner.write("PUT","/author/works/"+work,Map.of("revision",1,"document",definition)).get("revision"));
            var validation=owner.write("POST","/author/works/"+work+"/validate",Map.of("revision",2));assertEquals(Set.of("valid","issues","revision","truncated"),validation.keySet());assertEquals(false,validation.get("valid"));assertEquals(2,validation.get("revision"));assertEquals(false,validation.get("truncated"));
            var issues=(List<Map<String,Object>>)validation.get("issues");assertTrue(issues.size()>1);assertTrue(issues.size()<=100);assertTrue(issues.stream().anyMatch(issue->issue.get("path").equals("roles")));assertTrue(issues.stream().anyMatch(issue->issue.get("path").equals("phases")));for(var issue:issues){assertEquals(Set.of("path","code","message","severity"),issue.keySet());assertEquals("ERROR",issue.get("severity"));}
            assertEquals(422,owner.json("POST","/author/works/"+work+"/freeze",Map.of("revision",2)).statusCode());assertEquals(422,owner.json("POST","/author/works/"+work+"/submit",Map.of("revision",2)).statusCode());
            assertEquals(List.of(),owner.read("/author/works/"+work).get("versions"));
            var mismatch=owner.json("POST","/author/works",Map.of("title","유형 불일치","templateId","mystery-blank","gameType","TABLETOP"));assertEquals(422,mismatch.statusCode());assertEquals("TEMPLATE_TYPE_MISMATCH",json.object(mismatch.body()).get("code"));
        }
    }
    @Test void malformedRootDocumentsAreRejectedAndNeverReplaceTheSavedRevision()throws Exception{
        try(var owner=new Client()){
            owner.signup();String work=owner.write("POST","/author/works",Map.of("title","형식 검사","templateId","yacht-starter")).get("id").toString();
            var missing=owner.json("PUT","/author/works/"+work,Json.map("revision",1,"document",null));assertEquals(422,missing.statusCode());assertEquals("INVALID_DOCUMENT",json.object(missing.body()).get("code"));
            for(Object malformed:List.of(List.of(),"문자열",true)){
                var response=owner.json("PUT","/author/works/"+work,Map.of("revision",1,"document",malformed));assertEquals(400,response.statusCode(),response.body());
            }
            assertEquals(1,owner.read("/author/works/"+work).get("revision"));var validated=owner.write("POST","/author/works/"+work+"/validate",Map.of());assertEquals(true,validated.get("valid"));assertEquals(1,validated.get("revision"));assertEquals(List.of(),validated.get("issues"));assertEquals(false,validated.get("truncated"));
        }
    }
    @Test void authorInviteTestRoomUsesFrozenPrivateVersionAndNeverEntersPublicCatalogOrOfficialHistory()throws Exception{
        try(var owner=new Client();var guest=new Client();var outsider=new Client()){
            owner.signup();guest.signup();outsider.signup();
            String work=owner.write("POST","/author/works",Map.of("title","비공개 초대 시험 "+UUID.randomUUID(),"gameType","TABLETOP")).get("id").toString();
            String scenario=owner.read("/author/works/"+work).get("scenarioId").toString();
            String version=owner.write("POST","/author/works/"+work+"/freeze",Map.of("revision",1)).get("versionId").toString();
            String otherWork=outsider.write("POST","/author/works",Map.of("title","다른 작가 작품","gameType","YACHT")).get("id").toString();
            String otherVersion=outsider.write("POST","/author/works/"+otherWork+"/freeze",Map.of("revision",1)).get("versionId").toString();
            String token=inviteToken();assertEquals(43,token.length());
            var request=Map.of("versionId",version,"capacity",2,"mode","TEXT","inviteToken",token);
            assertEquals(404,guest.json("POST","/author/works/"+work+"/test-room",request).statusCode());
            assertEquals(404,outsider.json("POST","/author/works/"+otherWork+"/test-room",request).statusCode());
            assertEquals(404,owner.json("POST","/author/works/"+work+"/test-room",Map.of("versionId",otherVersion,"capacity",2,"mode","TEXT","inviteToken",token)).statusCode());
            assertEquals(404,owner.json("POST","/rooms",Map.of("scenarioVersionId",version,"visibility","PUBLIC","mode","TEXT","capacity",2)).statusCode());
            assertEquals(422,owner.json("POST","/author/works/"+work+"/test-room",Map.of("versionId",version,"capacity",2,"mode","TEXT","inviteToken","short")).statusCode());
            assertEquals(404,outsider.get("/scenarios/"+scenario).statusCode());
            assertFalse(json.write(outsider.read("/scenarios?gameType=TABLETOP&size=50")).contains(version));
            for(Client client:List.of(owner,guest))assertEquals(0,((Number)client.read("/me/history").get("total")).intValue());
            var created=owner.write("POST","/author/works/"+work+"/test-room",request);String room=created.get("roomId").toString();String roomPath="/rooms/"+room;
            assertFalse(json.write(created).contains(token));assertEquals(true,owner.read(roomPath).get("isTest"));assertEquals("INVITE",owner.read(roomPath).get("visibility"));
            assertEquals(0,((Number)outsider.read("/rooms?scenarioId="+scenario).get("total")).intValue());
            assertEquals(403,guest.get(roomPath).statusCode());assertEquals(403,guest.json("POST",roomPath+"/join",Map.of()).statusCode());
            assertEquals(403,guest.json("POST",roomPath+"/join",Map.of("inviteToken",inviteToken())).statusCode());
            guest.write("POST",roomPath+"/join",Map.of("inviteToken",token));
            assertEquals(409,owner.json("POST",roomPath+"/start",Map.of()).statusCode());owner.write("PUT",roomPath+"/ready",Map.of("ready",true));
            assertEquals(409,owner.json("POST",roomPath+"/start",Map.of()).statusCode());guest.write("PUT",roomPath+"/ready",Map.of("ready",true));
            assertEquals(403,guest.json("POST",roomPath+"/start",Map.of()).statusCode());
            String game=owner.write("POST",roomPath+"/start",Map.of()).get("gameId").toString();String gamePath="/games/"+game;
            assertEquals(403,outsider.get(gamePath+"/board-snapshot").statusCode());
            for(Client client:List.of(owner,guest)){
                var kind=client.read(gamePath+"/kind");assertEquals("TABLETOP",kind.get("gameType"));assertEquals(true,kind.get("test"));
                var snapshot=client.read(gamePath+"/board-snapshot");assertEquals("ACTIVE",snapshot.get("status"));assertEquals(2,((List<?>)snapshot.get("participants")).size());
                assertEquals(0,((Number)client.read("/me/history").get("total")).intValue());
            }
            Object expected=owner.read(gamePath+"/board-snapshot").get("stateVersion");var finish=Map.of("type","FINISH","expectedVersion",expected,"payload",Map.of());
            assertEquals(403,guest.json("POST",gamePath+"/board-commands",finish).statusCode());owner.write("POST",gamePath+"/board-commands",finish);
            for(Client client:List.of(owner,guest)){
                assertEquals("COMPLETED",client.read(gamePath+"/board-snapshot").get("status"));assertEquals(true,client.read(gamePath+"/kind").get("test"));
                var history=client.read("/me/history");assertEquals(0,((Number)history.get("total")).intValue());assertEquals(List.of(),history.get("items"));assertEquals("IDLE",client.read("/me/activity").get("kind"));
            }
            assertEquals(404,outsider.get("/scenarios/"+scenario).statusCode());assertEquals(0,((Number)outsider.read("/rooms?scenarioId="+scenario).get("total")).intValue());
        }
    }
    @Test void cardDesignDownloadsFollowCurrentFaceAndNeverExposeOverriddenImages()throws Exception{
        try(var owner=new Client();var guest=new Client()){
            owner.signup();guest.signup();var ids=new ArrayList<String>();for(int i=0;i<4;i++)ids.add(json.object(owner.upload(png(),true,false).body()).get("id").toString());
            String front=ids.get(0),commonBack=ids.get(1),unusedBack=ids.get(2),legacy=ids.get(3);
            String work=owner.write("POST","/author/works",Map.of("title","카드 면 권한 검증","gameType","TABLETOP")).get("id").toString();var document=json.object(json.write(owner.read("/author/works/"+work).get("document")));
            document.put("presentation",Json.map("scenes",List.of(),"cardLayouts",List.of(Json.map("id","individual","name","앞면 디자인","width",600,"height",850,"front",httpCardFace(front),"back",httpCardFace(unusedBack)),Json.map("id","common","name","공통 뒷면","width",600,"height",850,"front",httpCardFace(unusedBack),"back",httpCardFace(commonBack)))));
            document.put("tabletop",Json.map("objects",List.of(),"decks",List.of(Json.map("id","deck","name","카드 덱","x",0,"y",0,"backAssetId",legacy,"backLayoutId","common","cards",List.of(Json.map("id","private-card-id","name","비밀 카드","text","디자인 이전의 비밀 문구","assetId",legacy,"layoutId","individual"))))));
            owner.write("PUT","/author/works/"+work,Map.of("revision",1,"document",document));String version=owner.write("POST","/author/works/"+work+"/freeze",Map.of("revision",2)).get("versionId").toString();String token=inviteToken();
            String room=owner.write("POST","/author/works/"+work+"/test-room",Map.of("versionId",version,"capacity",2,"mode","TEXT","inviteToken",token)).get("roomId").toString();guest.write("POST","/rooms/"+room+"/join",Map.of("inviteToken",token));for(Client player:List.of(owner,guest))player.write("PUT","/rooms/"+room+"/ready",Map.of("ready",true));String game=owner.write("POST","/rooms/"+room+"/start",Map.of()).get("gameId").toString();String path="/games/"+game;
            assertEquals(200,guest.get("/assets/"+commonBack+"?gameId="+game).statusCode());for(String id:List.of(front,unusedBack,legacy))assertEquals(404,guest.get("/assets/"+id+"?gameId="+game).statusCode());
            var snapshot=guest.read(path+"/board-snapshot");guest.write("POST",path+"/board-commands",Map.of("type","DRAW","expectedVersion",snapshot.get("stateVersion"),"payload",Map.of("deckId","deck")));
            snapshot=guest.read(path+"/board-snapshot");var state=(Map<?,?>)snapshot.get("state");var card=(Map<?,?>)((List<?>)state.get("objects")).getFirst();String cardId=card.get("id").toString();assertTrue(card.containsKey("faceDesign"));assertEquals(200,guest.get("/assets/"+front+"?gameId="+game).statusCode());assertEquals(404,guest.get("/assets/"+legacy+"?gameId="+game).statusCode());
            guest.write("POST",path+"/board-commands",Map.of("type","TRANSFER","expectedVersion",snapshot.get("stateVersion"),"payload",Json.map("objectId",cardId,"toSeat",null)));assertEquals(404,guest.get("/assets/"+front+"?gameId="+game).statusCode());
            snapshot=guest.read(path+"/board-snapshot");guest.write("POST",path+"/board-commands",Map.of("type","FLIP","expectedVersion",snapshot.get("stateVersion"),"payload",Map.of("objectId",cardId)));assertEquals(200,guest.get("/assets/"+front+"?gameId="+game).statusCode());
            snapshot=guest.read(path+"/board-snapshot");String wire=json.write(snapshot);for(String hidden:List.of("layoutId","backLayoutId","private-card-id","card-node-id","디자인 이전",unusedBack,legacy))assertFalse(wire.contains(hidden),hidden);
            Object hostSeat=owner.read(path+"/board-snapshot").get("mySeat");guest.write("POST",path+"/board-commands",Map.of("type","TRANSFER","expectedVersion",snapshot.get("stateVersion"),"payload",Map.of("objectId",cardId,"toSeat",hostSeat)));assertEquals(404,guest.get("/assets/"+front+"?gameId="+game).statusCode());assertEquals(List.of(),((Map<?,?>)guest.read(path+"/board-snapshot").get("state")).get("objects"));
        }
    }
    private static Map<String,Object> httpCardFace(String asset){return Json.map("background","#ffffff","nodes",List.of(Json.map("id","card-node-id","kind","IMAGE","x",0,"y",0,"width",600,"height",850,"rotation",0,"assetId",asset,"hidden",false,"locked",false)));}
    private final class Client implements AutoCloseable{
        final HttpClient http=HttpClient.newBuilder().cookieHandler(new CookieManager(null,CookiePolicy.ACCEPT_ALL)).connectTimeout(Duration.ofSeconds(10)).build();String csrf,csrfHeader;
        URI uri(String path){return URI.create("http://127.0.0.1:"+port+"/api/v1"+path);}
        HttpResponse<String> get(String path)throws Exception{return http.send(HttpRequest.newBuilder(uri(path)).GET().build(),HttpResponse.BodyHandlers.ofString());}
        Map<String,Object> read(String path)throws Exception{var response=get(path);assertEquals(200,response.statusCode(),response.body());return json.object(response.body());}
        Map<String,Object> write(String method,String path,Object data)throws Exception{var response=json(method,path,data);assertEquals(200,response.statusCode(),response.body());return json.object(response.body());}
        void csrf()throws Exception{var response=get("/auth/csrf");assertEquals(200,response.statusCode());var body=json.object(response.body());csrf=body.get("token").toString();csrfHeader=body.get("headerName").toString();}
        void signup()throws Exception{csrf();var response=json("POST","/auth/register",Map.of("email","asset-"+UUID.randomUUID()+"@example.test","password","AssetTesting!2026","displayName","파일 검증"));assertEquals(200,response.statusCode(),response.body());csrf();}
        HttpResponse<String> json(String method,String path,Object data)throws Exception{return http.send(HttpRequest.newBuilder(uri(path)).header(csrfHeader,csrf).header("Content-Type","application/json").header("Idempotency-Key",UUID.randomUUID().toString()).method(method,HttpRequest.BodyPublishers.ofString(json.write(data))).build(),HttpResponse.BodyHandlers.ofString());}
        HttpResponse<String> upload(byte[] data,boolean withCsrf,boolean chunked)throws Exception{
            String boundary="mango-"+UUID.randomUUID();byte[] before=("--"+boundary+"\r\nContent-Disposition: form-data; name=\"file\"; filename=\"picture.png\"\r\nContent-Type: image/png\r\n\r\n").getBytes(StandardCharsets.UTF_8),after=("\r\n--"+boundary+"--\r\n").getBytes(StandardCharsets.UTF_8);
            HttpRequest.BodyPublisher body=chunked?HttpRequest.BodyPublishers.ofInputStream(()->new SequenceInputStream(Collections.enumeration(List.of(new ByteArrayInputStream(before),new ByteArrayInputStream(data),new ByteArrayInputStream(after))))):HttpRequest.BodyPublishers.concat(HttpRequest.BodyPublishers.ofByteArray(before),HttpRequest.BodyPublishers.ofByteArray(data),HttpRequest.BodyPublishers.ofByteArray(after));
            var request=HttpRequest.newBuilder(uri("/author/assets")).timeout(Duration.ofSeconds(30)).header("Content-Type","multipart/form-data; boundary="+boundary).header("Idempotency-Key",UUID.randomUUID().toString());if(withCsrf)request.header(csrfHeader,csrf);
            return http.send(request.POST(body).build(),HttpResponse.BodyHandlers.ofString());
        }
        @Override public void close(){http.close();}
    }
    private static String inviteToken(){byte[] bytes=new byte[32];new java.security.SecureRandom().nextBytes(bytes);return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);}
    private static byte[] png()throws Exception{var output=new ByteArrayOutputStream();ImageIO.write(new BufferedImage(2,2,BufferedImage.TYPE_INT_RGB),"png",output);return output.toByteArray();}
}
