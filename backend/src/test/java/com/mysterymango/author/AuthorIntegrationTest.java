package com.mysterymango.author;

import com.mysterymango.common.*;
import com.mysterymango.scenario.ScenarioService;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.*;
import java.util.concurrent.*;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties={"app.voice-provider=disabled","game.tick-ms=3600000"})
class AuthorIntegrationTest {
    private static PostgreSQLContainer postgres;
    private static final String STORAGE=System.getProperty("java.io.tmpdir")+"/mango-author-test-"+UUID.randomUUID();
    @DynamicPropertySource static void database(DynamicPropertyRegistry p){
        p.add("app.asset-storage-path",()->STORAGE);String external=System.getenv("TEST_DATABASE_URL");
        if(external!=null&&!external.isBlank()){p.add("spring.datasource.url",()->external);p.add("spring.datasource.username",()->System.getenv().getOrDefault("TEST_DATABASE_USER","mango"));p.add("spring.datasource.password",()->System.getenv().getOrDefault("TEST_DATABASE_PASSWORD","mango_local_only"));}
        else{postgres=new PostgreSQLContainer(DockerImageName.parse("postgres:17.11-alpine@sha256:b0f9560a2de083e2cc7382e75f808c7381a32852a7ec49117deedb300e552b24").asCompatibleSubstituteFor("postgres"));postgres.start();p.add("spring.datasource.url",postgres::getJdbcUrl);p.add("spring.datasource.username",postgres::getUsername);p.add("spring.datasource.password",postgres::getPassword);}
    }
    @Autowired AuthorService authors;@Autowired AssetService assets;@Autowired ScenarioService scenarios;@Autowired Commands commands;@Autowired Db db;@Autowired Json json;
    private UUID owner,other,admin;
    @BeforeEach void users(){commands.transaction(()->{owner=user(false);other=user(false);admin=user(true);return null;});}
    @AfterEach void hidePublishedFixtures(){if(owner!=null)commands.transaction(()->db.update("update scenario_version set status='DRAFT' where scenario_id in (select id from scenario where owner_id=?)",owner));}
    @Test void incompleteDraftIsSavedWithRevisionButCannotFreezeOrLeakToAnotherAuthor(){
        UUID work=create("MURDER_MYSTERY");var d=document(work);d.put("title","");d.put("internalSecret","must-never-return");
        var saved=commands.transaction(()->authors.save(owner,work,1,d));assertEquals(2L,((Number)saved.get("revision")).longValue());
        assertEquals("DRAFT_CONFLICT",assertThrows(ApiException.class,()->authors.validate(owner,work,1L)).code);assertEquals(false,authors.validate(owner,work,2L).get("valid"));
        assertFalse(document(work).containsKey("internalSecret"));var validation=authors.validate(owner,work);assertEquals(false,validation.get("valid"));assertEquals("title",((Map<?,?>)((List<?>)validation.get("issues")).getFirst()).get("path"));
        assertEquals(422,assertThrows(ApiException.class,()->commands.transaction(()->authors.freeze(owner,work,2))).status);
        assertEquals(403,assertThrows(ApiException.class,()->authors.get(other,work)).status);
        assertEquals(403,assertThrows(ApiException.class,()->commands.transaction(()->authors.save(other,work,2,d))).status);
    }
    @Test void simultaneousSavesHaveExactlyOneWinnerAndCannotOverwriteGameType()throws Exception{
        UUID work=create("TABLETOP");var first=document(work);first.put("title","첫 수정");var second=document(work);second.put("title","다른 수정");var start=new CountDownLatch(1);
        try(var pool=Executors.newFixedThreadPool(2)){var a=pool.submit(()->saveAfter(start,work,first));var b=pool.submit(()->saveAfter(start,work,second));start.countDown();assertEquals(Set.of("OK","DRAFT_CONFLICT"),Set.of(a.get(10,TimeUnit.SECONDS),b.get(10,TimeUnit.SECONDS)));}
        var changed=document(work);changed.put("gameType","YACHT");assertEquals("IMMUTABLE_WORK_KIND",assertThrows(ApiException.class,()->commands.transaction(()->authors.save(owner,work,2,changed))).code);
    }
    @Test void collectedValidationReportsExactRevisionAndAllIndependentErrorsWithoutChangingTheDraft(){
        UUID work=create("MURDER_MYSTERY");var complete=document(work);var broken=json.object(json.write(complete));
        broken.put("title","");broken.put("synopsis","");firstScene(broken).put("width",-1);firstScene(broken).put("background","invalid-color");
        commands.transaction(()->authors.save(owner,work,1,broken));String stored=json.write(document(work));
        var validation=authors.validate(owner,work,2L);assertEquals(Set.of("valid","issues","revision","truncated"),validation.keySet());
        assertEquals(false,validation.get("valid"));assertEquals(2L,validation.get("revision"));assertEquals(false,validation.get("truncated"));
        var issues=(List<Map<String,Object>>)validation.get("issues");assertEquals(List.of("title","synopsis","presentation.scenes[0].width","presentation.scenes[0].background"),issues.stream().map(i->i.get("path")).toList());
        for(var issue:issues){assertEquals(Set.of("path","code","message","severity"),issue.keySet());assertEquals("ERROR",issue.get("severity"));}
        assertEquals(validation,authors.validate(owner,work));assertEquals(stored,json.write(document(work)));assertEquals(2L,authors.get(owner,work).get("revision"));assertEquals(List.of(),authors.get(owner,work).get("versions"));
        assertEquals("DRAFT_CONFLICT",assertThrows(ApiException.class,()->authors.validate(owner,work,1L)).code);assertEquals(403,assertThrows(ApiException.class,()->authors.validate(other,work,2L)).status);
        assertEquals(422,assertThrows(ApiException.class,()->commands.transaction(()->authors.freeze(owner,work,2))).status);assertEquals(422,assertThrows(ApiException.class,()->commands.transaction(()->authors.submit(owner,work,2))).status);
        commands.transaction(()->authors.save(owner,work,2,complete));var fixed=authors.validate(owner,work,3L);assertEquals(true,fixed.get("valid"));assertEquals(3L,fixed.get("revision"));assertEquals(List.of(),fixed.get("issues"));assertEquals(false,fixed.get("truncated"));
    }
    @Test void collectedAssetErrorsKeepEverySemanticFieldAndNeverRevealForeignFileDetails()throws Exception{
        UUID own=uuid(assets.upload(owner,UUID.randomUUID().toString(),new MockMultipartFile("file","내 이미지.png","image/png",png())),"id");
        UUID foreign=uuid(assets.upload(other,UUID.randomUUID().toString(),new MockMultipartFile("file","비밀 파일명.png","image/png",png())),"id");
        UUID work=create("YACHT");var d=document(work);var first=firstScene(d);first.put("bgmAssetId",own.toString());
        var second=json.object(json.write(first));second.put("id","another-scene");((Map<String,Object>)d.get("presentation")).put("scenes",List.of(first,second));d.put("synopsis","");
        commands.transaction(()->authors.save(owner,work,1,d));var result=authors.validate(owner,work,2L);var issues=(List<Map<String,Object>>)result.get("issues");
        assertEquals(List.of("synopsis","presentation.scenes[0].bgmAssetId","presentation.scenes[1].bgmAssetId"),issues.stream().map(i->i.get("path")).toList());
        assertEquals(List.of("INVALID_SCENARIO","ASSET_KIND_MISMATCH","ASSET_KIND_MISMATCH"),issues.stream().map(i->i.get("code")).toList());
        d.put("synopsis","소개를 완성했습니다.");commands.transaction(()->authors.save(owner,work,2,d));assertEquals("ASSET_KIND_MISMATCH",assertThrows(ApiException.class,()->commands.transaction(()->authors.freeze(owner,work,3))).code);
        var refs=Json.map("assetId",foreign.toString(),"bgmAssetId",UUID.randomUUID().toString());var collected=ValidationContext.collecting();commands.transaction(()->{collected.run(()->assets.validateReferences(owner,refs,true,collected));return null;});
        assertEquals(List.of("assetId","bgmAssetId"),collected.issues().stream().map(ValidationIssue::path).toList());assertTrue(collected.issues().stream().allMatch(i->i.code().equals("ASSET_NOT_OWNED")));assertEquals(collected.issues().getFirst().message(),collected.issues().getLast().message());
        String wire=json.write(collected.issues());for(String secret:List.of(foreign.toString(),"비밀 파일명",other.toString(),"image/png"))assertFalse(wire.contains(secret));
    }
    @Test void allSixTemplatesFreezeAndContentRemainsImmutableAtDatabaseLevel(){
        for(String type:List.of("MURDER_MYSTERY","TABLETOP","YACHT","GOMOKU","REVERSI","CHECKERS")){
            UUID work=create(type);assertEquals(true,authors.validate(owner,work).get("valid"));UUID version=commands.transaction(()->authors.freeze(owner,work,1));
            assertEquals(version,commands.transaction(()->authors.freeze(owner,work,1)));assertEquals(type,scenarios.internalVersion(version).get("gameType"));
            assertEquals(404,assertThrows(ApiException.class,()->scenarios.publicVersion(version)).status);
            assertThrows(DataIntegrityViolationException.class,()->commands.transaction(()->db.update("update scenario_version set definition=jsonb_set(definition,'{title}','\"tampered\"') where id=?",version)));
            assertThrows(DataIntegrityViolationException.class,()->commands.transaction(()->db.update("update scenario_version set presentation='{}'::jsonb where id=?",version)));
        }
    }
    @Test void creatingTheSameTemplateTwiceMakesIndependentOwnedDocumentsAndRevisions(){
        for(var template:AuthorTemplates.catalog()){
            String templateId=template.get("id").toString();UUID first=uuid(commands.transaction(()->authors.create(owner,"첫 사본",null,templateId)),"id");UUID second=uuid(commands.transaction(()->authors.create(owner,"두 번째 사본",null,templateId)),"id");UUID foreign=uuid(commands.transaction(()->authors.create(other,"다른 작가 사본",null,templateId)),"id");
            assertNotEquals(first,second);assertNotEquals(document(first).get("slug"),document(second).get("slug"));assertEquals(template.get("gameType"),document(first).get("gameType"));
            assertEquals(owner,Db.uuid(authors.owned(owner,first),"owner_id"));assertEquals(other,Db.uuid(authors.owned(other,foreign),"owner_id"));assertEquals(403,assertThrows(ApiException.class,()->authors.get(owner,foreign)).status);
            var changed=document(first);changed.put("title","첫 사본만 수정");firstScene(changed).put("background","#123456");commands.transaction(()->authors.save(owner,first,1,changed));
            assertEquals(2L,((Number)authors.get(owner,first).get("revision")).longValue());assertEquals(1L,((Number)authors.get(owner,second).get("revision")).longValue());assertEquals(1L,((Number)authors.get(other,foreign).get("revision")).longValue());
            assertEquals("두 번째 사본",document(second).get("title"));assertNotEquals("#123456",firstScene(document(second)).get("background"));assertEquals("다른 작가 사본",((Map<?,?>)authors.get(other,foreign).get("document")).get("title"));
            if(Boolean.TRUE.equals(template.get("blank"))){
                assertEquals(422,assertThrows(ApiException.class,()->commands.transaction(()->authors.freeze(owner,first,2))).status);
                assertEquals(422,assertThrows(ApiException.class,()->commands.transaction(()->authors.freeze(owner,second,1))).status);
            }else{
                UUID firstVersion=commands.transaction(()->authors.freeze(owner,first,2));UUID secondVersion=commands.transaction(()->authors.freeze(owner,second,1));assertNotEquals(firstVersion,secondVersion);assertEquals("첫 사본만 수정",scenarios.internalVersion(firstVersion).get("title"));assertEquals("두 번째 사본",scenarios.internalVersion(secondVersion).get("title"));
            }
        }
        assertEquals("TEMPLATE_TYPE_MISMATCH",assertThrows(ApiException.class,()->commands.transaction(()->authors.create(owner,"불일치","YACHT","gomoku-starter"))).code);
        assertEquals("UNKNOWN_TEMPLATE",assertThrows(ApiException.class,()->commands.transaction(()->authors.create(owner,"알 수 없는 템플릿",null,"private-work-id"))).code);
    }
    @Test void everyBlankTemplateStartsWithoutAuthoredContentAndRetainsItsEngineSettings(){
        for(var template:AuthorTemplates.catalog().stream().filter(t->Boolean.TRUE.equals(t.get("blank"))).toList()){
            String type=template.get("gameType").toString();UUID work=uuid(commands.transaction(()->authors.create(owner,"빈 작품",null,template.get("id").toString())),"id");var d=document(work);
            assertEquals("",d.get("synopsis"));assertEquals(List.of(),firstScene(d).get("nodes"));assertEquals("SCENE",firstScene(d).get("kind"));assertEquals(List.of(),((Map<?,?>)d.get("presentation")).get("cardLayouts"));assertEquals(1,((List<?>)((Map<?,?>)d.get("presentation")).get("scenes")).size());
            for(String field:List.of("roles","phases","targets","clues","rules","endings"))assertEquals(List.of(),d.get(field));
            assertEquals(Map.of("objects",List.of(),"decks",List.of()),d.get("tabletop"));
            var starter=AuthorTemplates.create("기본 작품",type,"starter-fixture");for(String field:List.of("engineId","playerCount","supportedPlayerCounts","modes"))assertEquals(starter.get(field),d.get(field));
            for(String field:List.of("classic","yacht"))assertEquals(starter.get(field),d.get(field));
            assertEquals(false,authors.validate(owner,work).get("valid"));
            d.put("synopsis","작가가 직접 작성한 소개입니다.");commands.transaction(()->authors.save(owner,work,1,d));
            if(type.equals("MURDER_MYSTERY")){
                assertEquals(Map.of("culpritRoleId","","allowChange",true,"allowAbstain",true,"tiePolicy","NO_ACCUSATION"),d.get("ballot"));
                assertEquals(false,authors.validate(owner,work).get("valid"));
            }else{
                assertEquals(true,authors.validate(owner,work).get("valid"));UUID version=commands.transaction(()->authors.freeze(owner,work,2));assertEquals(type,scenarios.internalVersion(version).get("gameType"));
            }
        }
    }
    @Test void blankMysteryDraftSavesButCannotCreateExecutionOrReviewVersionsUntilCompleted(){
        UUID work=uuid(commands.transaction(()->authors.create(owner,"내 추리극",null,"mystery-blank")),"id");UUID scenario=Db.uuid(authors.get(owner,work),"scenarioId");var d=document(work);
        commands.transaction(()->authors.save(owner,work,1,d));assertEquals(2L,((Number)authors.get(owner,work).get("revision")).longValue());
        assertEquals(422,assertThrows(ApiException.class,()->commands.transaction(()->authors.freeze(owner,work,2))).status);
        assertEquals(422,assertThrows(ApiException.class,()->commands.transaction(()->authors.submit(owner,work,2))).status);
        d.put("synopsis","소개만 작성하고 역할은 아직 없습니다.");commands.transaction(()->authors.save(owner,work,2,d));
        assertEquals(false,authors.validate(owner,work).get("valid"));
        assertEquals(422,assertThrows(ApiException.class,()->commands.transaction(()->authors.freeze(owner,work,3))).status);
        assertEquals(422,assertThrows(ApiException.class,()->commands.transaction(()->authors.submit(owner,work,3))).status);
        assertEquals(0,Db.num(db.one("select count(*) n from scenario_version where scenario_id=?",scenario),"n"));assertEquals(0,Db.num(db.one("select count(*) n from scenario_review where author_id=?",owner),"n"));
        var complete=AuthorTemplates.create("완성한 추리극","MURDER_MYSTERY",d.get("slug").toString());complete.put("presentation",d.get("presentation"));commands.transaction(()->authors.save(owner,work,3,complete));
        var submission=commands.transaction(()->authors.submit(owner,work,4));UUID version=uuid(submission,"versionId"),review=uuid(submission,"reviewId");assertEquals(404,assertThrows(ApiException.class,()->scenarios.publicVersion(version)).status);
        commands.transaction(()->authors.decide(admin,review,"APPROVE","빈 초안에서 작성한 필수 내용을 확인했습니다."));assertEquals("완성한 추리극",scenarios.publicVersion(version).get("title"));
    }
    @Test void classicTemplatesFreezeTwoPlayerDesignsAndRejectOtherCapacities(){
        for(String type:List.of("GOMOKU","REVERSI","CHECKERS")){
            UUID work=create(type);var d=document(work);assertEquals(2,d.get("playerCount"));assertEquals(List.of(2),d.get("supportedPlayerCounts"));assertEquals(type.toLowerCase(Locale.ROOT)+"-v1",d.get("engineId"));
            var design=new LinkedHashMap<>((Map<String,Object>)d.get("classic"));design.put("firstPieceColor","#987654");design.put("script","never-allow");d.put("classic",design);d.put("winningLength",3);
            commands.transaction(()->authors.save(owner,work,1,d));UUID version=commands.transaction(()->authors.freeze(owner,work,2));var frozen=scenarios.authorizedVersion(owner,version);
            assertEquals("#987654",((Map<?,?>)frozen.get("classic")).get("firstPieceColor"));assertFalse(((Map<?,?>)frozen.get("classic")).containsKey("script"));assertFalse(frozen.containsKey("winningLength"));
            var solo=document(work);solo.put("playerCount",1);solo.put("supportedPlayerCounts",List.of(1));commands.transaction(()->authors.save(owner,work,2,solo));assertEquals(false,authors.validate(owner,work).get("valid"));assertEquals(422,assertThrows(ApiException.class,()->commands.transaction(()->authors.freeze(owner,work,3))).status);
            var extra=document(work);extra.put("playerCount",2);extra.put("supportedPlayerCounts",List.of(2,3));commands.transaction(()->authors.save(owner,work,3,extra));assertEquals(false,authors.validate(owner,work).get("valid"));
            var badColor=document(work);badColor.put("supportedPlayerCounts",List.of(2));((Map<String,Object>)badColor.get("classic")).put("boardColor","url(example)");commands.transaction(()->authors.save(owner,work,4,badColor));var issue=authors.validate(owner,work);assertEquals("classic.boardColor",((Map<?,?>)((List<?>)issue.get("issues")).getFirst()).get("path"));
        }
    }
    @Test void threeClassicSystemExamplesArePublishedWithoutUploadedAssetsAndKeepExistingStories(){
        for(String type:List.of("GOMOKU","REVERSI","CHECKERS")){
            var row=db.one("select v.id,s.owner_id from scenario s join scenario_version v on v.scenario_id=s.id where s.slug=? and v.status='PUBLISHED' order by v.version desc limit 1","classic-"+type.toLowerCase(Locale.ROOT));assertNull(row.get("owner_id"));
            UUID version=Db.uuid(row,"id");var card=scenarios.publicVersion(version);assertEquals(type,card.get("gameType"));assertEquals(List.of(2),card.get("supportedPlayerCounts"));assertEquals(List.of(),card.get("roles"));assertFalse(card.containsKey("classic"));assertFalse(card.containsKey("presentation"));
            var definition=scenarios.definition(version);scenarios.validate(definition);assertEquals(Set.of(),AuthorDocument.assetIds(definition));
            assertTrue(((List<Map<String,Object>>)scenarios.list(0,50,null,null,null,2,type).get("items")).stream().anyMatch(c->version.equals(c.get("versionId"))));
            assertEquals(0,((Number)scenarios.list(0,50,null,null,null,1,type).get("total")).intValue());
        }
        assertEquals(5,((Number)scenarios.list(0,50,null,null,null,null,"MURDER_MYSTERY").get("total")).intValue());
    }
    @Test void yachtAndTabletopSystemExamplesArePublicForOneThroughFourPlayers(){
        for(String type:List.of("YACHT","TABLETOP")){
            var row=db.one("select v.id,s.owner_id from scenario s join scenario_version v on v.scenario_id=s.id where s.slug=? and v.status='PUBLISHED' order by v.version desc limit 1","starter-"+type.toLowerCase(Locale.ROOT));assertNull(row.get("owner_id"));UUID version=Db.uuid(row,"id");
            var card=scenarios.publicVersion(version);assertEquals(type,card.get("gameType"));assertEquals(List.of(1,2,3,4),card.get("supportedPlayerCounts"));assertEquals(type.toLowerCase(Locale.ROOT)+"-v1",card.get("engineId"));assertEquals(List.of(),card.get("roles"));
            var definition=scenarios.definition(version);scenarios.validate(definition);assertTrue(AuthorDocument.assetIds(definition).isEmpty());if(type.equals("TABLETOP"))assertTrue(card.get("synopsis").toString().contains("자동 판정하지"));
            for(int count=1;count<=4;count++)assertTrue(((List<Map<String,Object>>)scenarios.list(0,50,null,null,null,count,type).get("items")).stream().anyMatch(c->version.equals(c.get("versionId"))));
        }
    }
    @Test void tabletopAndYachtCanFreezeSoloDefinitionsWhileAdvertisingAllTemplateCapacities(){
        for(String type:List.of("TABLETOP","YACHT")){
            UUID work=create(type);var d=document(work);assertEquals(List.of(1,2,3,4),d.get("supportedPlayerCounts"));d.put("playerCount",1);d.put("supportedPlayerCounts",List.of(1));
            commands.transaction(()->authors.save(owner,work,1,d));assertEquals(true,authors.validate(owner,work).get("valid"));UUID version=commands.transaction(()->authors.freeze(owner,work,2));assertEquals(1,scenarios.internalVersion(version).get("playerCount"));assertEquals(List.of(1),scenarios.internalVersion(version).get("supportedPlayerCounts"));
        }
    }
    @Test void yachtDesignAllowsOnlyValidatedColorsAndFreezesTheirExactValues(){
        UUID work=create("YACHT");var d=document(work);assertEquals(Map.of("diceColor","#fffaf0","pipColor","#242a27","scoreboardColor","#ffffff"),d.get("yacht"));
        d.put("yacht",Map.of("diceColor","#abc123","pipColor","#123456","scoreboardColor","#aabbcc","script","must-never-return"));commands.transaction(()->authors.save(owner,work,1,d));
        assertFalse(((Map<?,?>)document(work).get("yacht")).containsKey("script"));UUID version=commands.transaction(()->authors.freeze(owner,work,2));assertEquals("#abc123",((Map<?,?>)scenarios.authorizedVersion(owner,version).get("yacht")).get("diceColor"));
        var bad=document(work);bad.put("yacht",Map.of("diceColor","url(javascript:alert(1))","pipColor","#123456","scoreboardColor","#aabbcc"));commands.transaction(()->authors.save(owner,work,2,bad));
        var validation=authors.validate(owner,work);assertEquals(false,validation.get("valid"));assertEquals("yacht.diceColor",((Map<?,?>)((List<?>)validation.get("issues")).getFirst()).get("path"));assertEquals(422,assertThrows(ApiException.class,()->commands.transaction(()->authors.freeze(owner,work,3))).status);
    }
    @Test void reviewApprovalPublishesOnlyFrozenContentAndLegacyAdminCannotBypassReview(){
        UUID work=create("MURDER_MYSTERY");var submitted=commands.transaction(()->authors.submit(owner,work,1));UUID version=uuid(submitted,"versionId"),review=uuid(submitted,"reviewId");
        assertEquals(403,assertThrows(ApiException.class,()->commands.transaction(()->{scenarios.publishSystem(version);return null;})).status);
        assertEquals(403,assertThrows(ApiException.class,()->commands.transaction(()->scenarios.save(document(work),true))).status);
        assertEquals(403,assertThrows(ApiException.class,()->authors.review(other,review)).status);
        authors.review(admin,review);assertEquals(1,Db.num(db.one("select count(*) n from scenario_exposure_source where user_id=? and version_id=? and source='AUTHOR_PREVIEW'",admin,version),"n"));
        assertEquals(403,assertThrows(ApiException.class,()->commands.transaction(()->authors.decide(other,review,"APPROVE",""))).status);
        var next=document(work);next.put("title","제출 후 초안 수정");commands.transaction(()->authors.save(owner,work,1,next));
        commands.transaction(()->authors.decide(admin,review,"APPROVE","확인 완료"));var published=scenarios.publicVersion(version);
        assertNotEquals(next.get("title"),published.get("title"));String wire=json.write(published);assertFalse(wire.contains("secret"));assertFalse(wire.contains("presentation"));assertFalse(wire.contains("ballot"));
    }
    @Test void simultaneousApprovalsPublishExactlyOneVersionAndRejectTheSecondDecision()throws Exception{
        UUID work=create("YACHT");var submitted=commands.transaction(()->authors.submit(owner,work,1));UUID review=uuid(submitted,"reviewId"),version=uuid(submitted,"versionId");var barrier=new CyclicBarrier(2);
        Callable<String> approve=()->{barrier.await(10,TimeUnit.SECONDS);try{commands.transaction(()->authors.decide(admin,review,"APPROVE","동시 승인 검증"));return "APPROVED";}catch(ApiException ex){assertEquals(409,ex.status);return ex.code;}};
        try(var pool=Executors.newFixedThreadPool(2)){
            var first=pool.submit(approve);var second=pool.submit(approve);var results=List.of(first.get(15,TimeUnit.SECONDS),second.get(15,TimeUnit.SECONDS));
            assertEquals(1L,results.stream().filter("APPROVED"::equals).count());assertEquals(1L,results.stream().filter("REVIEW_ALREADY_DECIDED"::equals).count());
        }
        assertEquals("APPROVED",authors.review(admin,review).get("status"));assertEquals(version,scenarios.publicVersion(version).get("versionId"));
        assertEquals(1,Db.num(db.one("select count(*) n from scenario_version where scenario_id=(select scenario_id from scenario_version where id=?) and status='PUBLISHED'",version),"n"));
    }
    @Test void resubmissionSupersedesPendingReviewAndRejectionRequiresNewRevision(){
        UUID work=create("YACHT");UUID first=uuid(commands.transaction(()->authors.submit(owner,work,1)),"reviewId");var d=document(work);d.put("title","수정한 요트");commands.transaction(()->authors.save(owner,work,1,d));
        UUID second=uuid(commands.transaction(()->authors.submit(owner,work,2)),"reviewId");assertEquals("SUPERSEDED",authors.review(admin,first).get("status"));
        assertEquals("REVIEW_ALREADY_DECIDED",assertThrows(ApiException.class,()->commands.transaction(()->authors.decide(admin,first,"APPROVE",""))).code);
        commands.transaction(()->authors.decide(admin,second,"REQUEST_CHANGES","소개를 보완해 주세요."));
        assertEquals("REVISION_ALREADY_REVIEWED",assertThrows(ApiException.class,()->commands.transaction(()->authors.submit(owner,work,2))).code);
    }
    @Test void uploadedImageIsPrivateAndIdempotentAndAllHiddenReferencesPreventDeletion()throws Exception{
        String key=UUID.randomUUID().toString();byte[] png=png();var uploaded=assets.upload(owner,key,new MockMultipartFile("file","../../개인자료.png","image/png",png));UUID id=uuid(uploaded,"id");
        assertEquals(id,uuid(assets.upload(owner,key,new MockMultipartFile("file","../../개인자료.png","image/png",png)),"id"));assertEquals("개인자료.png",uploaded.get("name"));
        assertEquals(Set.of("id","name","mimeType","size"),uploaded.keySet());assertTrue(java.nio.file.Files.exists(assets.download(owner,id,false).path()));
        assertEquals(404,assertThrows(ApiException.class,()->assets.download(other,id,false)).status);
        UUID work=create("MURDER_MYSTERY");var d=document(work);imageNode(d,id,true);commands.transaction(()->authors.save(owner,work,1,d));
        assertEquals("ASSET_IN_USE",assertThrows(ApiException.class,()->commands.transaction(()->assets.delete(owner,id))).code);
        UUID version=commands.transaction(()->authors.freeze(owner,work,2));assertEquals(1,Db.num(db.one("select count(*) n from author_version_asset where version_id=? and asset_id=?",version,id),"n"));
        var noAsset=document(work);((Map<String,Object>)noAsset.get("presentation")).put("scenes",List.of());commands.transaction(()->authors.save(owner,work,2,noAsset));
        assertEquals("ASSET_IN_USE",assertThrows(ApiException.class,()->commands.transaction(()->assets.delete(owner,id))).code);
        assertEquals(404,assertThrows(ApiException.class,()->assets.download(admin,id,false)).status);
        commands.transaction(()->authors.submit(owner,work,3)); // Empty new presentation must not grant access to old assets.
        assertEquals(404,assertThrows(ApiException.class,()->assets.download(admin,id,false)).status);
    }
    @Test void foreignFilesAreRejectedThroughPrivatePresentationAndTabletopDecks()throws Exception{
        UUID id=uuid(assets.upload(other,UUID.randomUUID().toString(),new MockMultipartFile("file","x.png","image/png",png())),"id");
        UUID work=create("MURDER_MYSTERY");var d=document(work);imageNode(d,id,true);
        assertEquals("ASSET_NOT_OWNED",assertThrows(ApiException.class,()->commands.transaction(()->authors.save(owner,work,1,d))).code);
        UUID table=create("TABLETOP");var board=document(table);var tabletop=(Map<String,Object>)board.get("tabletop");var deck=(Map<String,Object>)((List<?>)tabletop.get("decks")).getFirst();deck.put("backAssetId",id.toString());
        assertEquals("ASSET_NOT_OWNED",assertThrows(ApiException.class,()->commands.transaction(()->authors.save(owner,table,1,board))).code);
    }
    @Test void cardDesignsRetainAllOwnedAssetsAndFrozenVersionSurvivesLaterDraftEdits()throws Exception{
        UUID front=uuid(assets.upload(owner,UUID.randomUUID().toString(),new MockMultipartFile("file","앞면.png","image/png",png())),"id");
        UUID back=uuid(assets.upload(owner,UUID.randomUUID().toString(),new MockMultipartFile("file","뒷면.png","image/png",png())),"id");
        UUID foreign=uuid(assets.upload(other,UUID.randomUUID().toString(),new MockMultipartFile("file","다른 작가.png","image/png",png())),"id");
        UUID work=create("TABLETOP");var d=document(work);var presentation=(Map<String,Object>)d.get("presentation");
        presentation.put("cardLayouts",List.of(Json.map("id","card-design","name","개인 카드","width",600,"height",850,"front",cardFace(front),"back",cardFace(back))));
        var deck=(Map<String,Object>)((List<?>)((Map<?,?>)d.get("tabletop")).get("decks")).getFirst();deck.put("backLayoutId","card-design");((Map<String,Object>)((List<?>)deck.get("cards")).getFirst()).put("layoutId","card-design");
        commands.transaction(()->authors.save(owner,work,1,d));assertEquals(true,authors.validate(owner,work).get("valid"));
        assertEquals("ASSET_IN_USE",assertThrows(ApiException.class,()->commands.transaction(()->assets.delete(owner,front))).code);
        UUID version=commands.transaction(()->authors.freeze(owner,work,2));assertEquals(2,Db.num(db.one("select count(*) n from author_version_asset where version_id=?",version),"n"));
        String frozen=json.write(scenarios.authorizedVersion(owner,version));assertTrue(frozen.contains(front.toString()));assertTrue(frozen.contains(back.toString()));
        var changed=document(work);var changedLayout=(Map<String,Object>)((List<?>)((Map<?,?>)changed.get("presentation")).get("cardLayouts")).getFirst();changedLayout.put("front",Json.map("background","#ffffff","nodes",List.of()));changedLayout.put("back",Json.map("background","#ffffff","nodes",List.of()));
        commands.transaction(()->authors.save(owner,work,2,changed));assertEquals(frozen,json.write(scenarios.authorizedVersion(owner,version)));assertEquals("ASSET_IN_USE",assertThrows(ApiException.class,()->commands.transaction(()->assets.delete(owner,front))).code);
        changedLayout.put("front",cardFace(foreign));assertEquals("ASSET_NOT_OWNED",assertThrows(ApiException.class,()->commands.transaction(()->authors.save(owner,work,3,changed))).code);
        assertThrows(DataIntegrityViolationException.class,()->commands.transaction(()->db.update("update scenario_version set presentation=jsonb_set(presentation,'{cardLayouts}','[]') where id=?",version)));
        var request=commands.transaction(()->authors.submit(owner,work,3));commands.transaction(()->authors.decide(admin,uuid(request,"reviewId"),"APPROVE","확인"));String publicCard=json.write(scenarios.publicVersion(uuid(request,"versionId")));assertFalse(publicCard.contains("cardLayouts"));assertFalse(publicCard.contains(front.toString()));
    }
    @Test void invalidUploadsAndImageAsBgmCannotBecomePublishedAssets()throws Exception{
        assertEquals("UNSUPPORTED_ASSET",assertThrows(ApiException.class,()->assets.upload(owner,UUID.randomUUID().toString(),new MockMultipartFile("file","bad.png","image/png","<html>bad</html>".getBytes()))).code);
        UUID id=uuid(assets.upload(owner,UUID.randomUUID().toString(),new MockMultipartFile("file","x.png","image/png",png())),"id");UUID work=create("YACHT");var d=document(work);firstScene(d).put("bgmAssetId",id.toString());commands.transaction(()->authors.save(owner,work,1,d));
        assertEquals(false,authors.validate(owner,work).get("valid"));assertEquals("ASSET_KIND_MISMATCH",assertThrows(ApiException.class,()->commands.transaction(()->authors.freeze(owner,work,2))).code);
    }
    @Test void unusedFileDeletionCommitsBeforePhysicalRemoval()throws Exception{
        UUID id=uuid(assets.upload(owner,UUID.randomUUID().toString(),new MockMultipartFile("file","x.png","image/png",png())),"id");var path=assets.download(owner,id,false).path();
        assertThrows(ApiException.class,()->commands.transaction(()->{assets.delete(owner,id);throw new ApiException(409,"ROLLBACK","되돌림");}));assertTrue(java.nio.file.Files.exists(path));assets.requireOwner(owner,id);
        commands.transaction(()->assets.delete(owner,id));assertFalse(java.nio.file.Files.exists(path));assertEquals(404,assertThrows(ApiException.class,()->assets.requireOwner(owner,id)).status);
    }
    @Test void malformedPresentationAndDuplicateTableIdsHaveValidationErrors(){
        UUID work=create("MURDER_MYSTERY");var d=document(work);firstScene(d).put("width",-1);commands.transaction(()->authors.save(owner,work,1,d));var result=authors.validate(owner,work);assertEquals("presentation.scenes[0].width",((Map<?,?>)((List<?>)result.get("issues")).getFirst()).get("path"));
        UUID table=create("TABLETOP");var board=document(table);var t=(Map<String,Object>)board.get("tabletop");var card=(Map<String,Object>)((List<?>)((Map<?,?>)((List<?>)t.get("decks")).getFirst()).get("cards")).getFirst();card.put("id","dice-1");commands.transaction(()->authors.save(owner,table,1,board));assertEquals(false,authors.validate(owner,table).get("valid"));
    }
    private String saveAfter(CountDownLatch latch,UUID work,Map<String,Object> d)throws Exception{latch.await();try{commands.transaction(()->authors.save(owner,work,1,d));return "OK";}catch(ApiException ex){return ex.code;}}
    private UUID user(boolean admin){UUID id=UUID.randomUUID();db.update("insert into app_user(id,email,display_name,password_hash,admin) values(?,?,?,'unused-author-test',?)",id,id+"@author.invalid","작가 검증",admin);db.update("insert into player_activity(user_id,kind) values(?,'IDLE')",id);return id;}
    private UUID create(String type){return uuid(commands.transaction(()->authors.create(owner,"새 작품",type)),"id");}
    @SuppressWarnings("unchecked") private Map<String,Object> document(UUID work){return (Map<String,Object>)authors.get(owner,work).get("document");}
    @SuppressWarnings("unchecked") private static Map<String,Object> firstScene(Map<String,Object> d){return (Map<String,Object>)((List<?>)((Map<?,?>)d.get("presentation")).get("scenes")).getFirst();}
    @SuppressWarnings("unchecked") private static void imageNode(Map<String,Object> d,UUID id,boolean hidden){var scene=firstScene(d);scene.put("kind","ROLE");scene.put("referenceId","role-1");var node=(Map<String,Object>)((List<?>)scene.get("nodes")).getFirst();node.put("kind","IMAGE");node.put("assetId",id.toString());node.put("hidden",hidden);}
    private static byte[] png()throws Exception{var output=new ByteArrayOutputStream();ImageIO.write(new BufferedImage(2,2,BufferedImage.TYPE_INT_RGB),"png",output);return output.toByteArray();}
    private static Map<String,Object> cardFace(UUID asset){return Json.map("background","#ffffff","nodes",List.of(Json.map("id","image","kind","IMAGE","x",0,"y",0,"width",600,"height",850,"rotation",0,"assetId",asset.toString(),"hidden",true,"locked",true)));}
    private static UUID uuid(Map<String,Object> m,String key){return UUID.fromString(m.get(key).toString());}
}
