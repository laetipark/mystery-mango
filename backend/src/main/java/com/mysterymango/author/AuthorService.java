package com.mysterymango.author;

import com.mysterymango.common.*;
import com.mysterymango.scenario.ScenarioService;
import java.nio.charset.StandardCharsets;
import java.util.*;
import org.springframework.stereotype.Service;
import static com.mysterymango.common.Json.map;

@Service
public class AuthorService {
    private final Db db;private final Json json;private final ScenarioService scenarios;private final AssetService assets;private final Commands commands;
    public AuthorService(Db db,Json json,ScenarioService scenarios,AssetService assets,Commands commands){this.db=db;this.json=json;this.scenarios=scenarios;this.assets=assets;this.commands=commands;}
    public Map<String,Object> list(UUID actor){
        var items=db.list("select w.id,w.revision,w.updated_at,w.document->>'title' title,w.document->>'gameType' game_type,coalesce((select r.status from scenario_review r join scenario_version v on v.id=r.version_id where v.scenario_id=w.scenario_id order by v.version desc limit 1),'DRAFT') review_status from author_work w where w.owner_id=? order by w.updated_at desc,w.id",actor).stream().map(r->map("id",r.get("id"),"title",r.get("title"),"gameType",r.get("game_type"),"revision",r.get("revision"),"status",r.get("review_status"),"updatedAt",Db.instant(r,"updated_at"))).toList();return map("items",items,"total",items.size());
    }
    public Map<String,Object> create(UUID actor,String title,String gameType){
        return create(actor,title,gameType,null);
    }
    public Map<String,Object> create(UUID actor,String title,String gameType,String templateId){
        if(title==null||title.isBlank()||title.length()>200)throw new ApiException(422,"INVALID_TITLE","작품 이름을 1~200자로 입력해 주세요.");
        UUID scenario=UUID.randomUUID(),work=UUID.randomUUID();String slug="author-"+scenario;var document=AuthorTemplates.create(title.strip(),gameType,slug,templateId);
        db.update("insert into scenario(id,slug,owner_id) values(?,?,?)",scenario,slug,actor);db.update("insert into author_work(id,scenario_id,owner_id,document) values(?,?,?,cast(? as jsonb))",work,scenario,actor,json.write(document));return map("id",work);
    }
    public Map<String,Object> owned(UUID actor,UUID id){var row=db.one("select * from author_work where id=?",id);if(!actor.equals(Db.uuid(row,"owner_id")))throw new ApiException(403,"AUTHOR_ACCESS_REQUIRED","본인의 작품만 편집할 수 있습니다.");return row;}
    public Map<String,Object> get(UUID actor,UUID id){
        return commands.transaction(()->getLocked(actor,id));
    }
    private Map<String,Object> getLocked(UUID actor,UUID id){
        var w=owned(actor,id);var versions=db.list("select v.id,v.version,v.status,r.status review_status,r.note review_note from scenario_version v left join scenario_review r on r.version_id=v.id where v.scenario_id=? order by v.version desc",w.get("scenario_id")).stream().map(v->map("id",v.get("id"),"version",v.get("version"),"status",v.get("status"),"reviewStatus",v.get("review_status"),"reviewNote",v.get("review_note"))).toList();
        var document=AuthorDocument.project(json.object(w.get("document").toString()));
        if("MURDER_MYSTERY".equals(document.get("gameType")))expose(actor,Db.uuid(w,"scenario_id"),versions.isEmpty()?null:Db.uuid(versions.getFirst(),"id"));
        return map("id",id,"scenarioId",w.get("scenario_id"),"revision",w.get("revision"),"document",document,"versions",versions,"updatedAt",Db.instant(w,"updated_at"));
    }
    public Map<String,Object> getVersion(UUID actor,UUID id,UUID versionId){
        return commands.transaction(()->{
            var version=db.one("select v.*,r.status review_status,r.note review_note from author_work w join scenario_version v on v.scenario_id=w.scenario_id left join scenario_review r on r.version_id=v.id where w.id=? and v.id=?",id,versionId);
            scenarios.requireAuthorAccess(actor,versionId);
            var document=AuthorDocument.project(json.object(version.get("definition").toString()));
            if("MURDER_MYSTERY".equals(document.getOrDefault("gameType","MURDER_MYSTERY")))expose(actor,Db.uuid(version,"scenario_id"),versionId);
            return map("workId",id,"versionId",versionId,"version",version.get("version"),"authorRevision",version.get("author_revision"),"status",version.get("status"),"reviewStatus",version.get("review_status"),"reviewNote",version.get("review_note"),"document",document);
        });
    }
    public Map<String,Object> save(UUID actor,UUID id,long revision,Map<String,Object> input){
        var row=owned(actor,id);checkRevision(row,revision);var document=AuthorDocument.project(input);var previous=json.object(row.get("document").toString());
        for(String immutable:List.of("slug","gameType","engineId"))if(!Objects.equals(previous.get(immutable),document.get(immutable)))throw new ApiException(422,"IMMUTABLE_WORK_KIND","작품 식별자와 게임 유형은 변경할 수 없습니다.");
        String encoded=json.write(document);if(encoded.getBytes(StandardCharsets.UTF_8).length>900000)throw new ApiException(413,"INPUT_TOO_LARGE","작품 문서가 너무 큽니다.");
        assets.validateReferences(actor,document,false);
        if(db.update("update author_work set document=cast(? as jsonb),revision=revision+1,updated_at=now() where id=? and owner_id=? and revision=?",encoded,id,actor,revision)!=1)throw conflict();
        var next=db.one("select revision,updated_at from author_work where id=?",id);return map("revision",next.get("revision"),"updatedAt",Db.instant(next,"updated_at"));
    }
    public Map<String,Object> validate(UUID actor,UUID id){
        return validate(actor,id,null);
    }
    public Map<String,Object> validate(UUID actor,UUID id,Long revision){
        return commands.transaction(()->validateLocked(actor,id,revision));
    }
    private Map<String,Object> validateLocked(UUID actor,UUID id,Long revision){
        var row=owned(actor,id);if(revision!=null)checkRevision(row,revision);var d=AuthorDocument.project(json.object(row.get("document").toString()));
        var validation=ValidationContext.collecting();
        validation.run(()->{scenarios.validate(d,validation);assets.validateReferences(actor,d,true,validation);});
        var issues=validation.issues().stream().map(issue->map("path",issue.path(),"code",issue.code(),"message",issue.message(),"severity",issue.severity())).toList();
        return map("valid",validation.valid(),"issues",issues,"revision",((Number)row.get("revision")).longValue(),"truncated",validation.truncated());
    }
    public UUID freeze(UUID actor,UUID id,long revision){
        var w=owned(actor,id);checkRevision(w,revision);var existing=db.optional("select id from scenario_version where scenario_id=? and author_revision=?",w.get("scenario_id"),revision);if(existing!=null)return Db.uuid(existing,"id");
        var document=AuthorDocument.project(json.object(w.get("document").toString()));validateDocument(actor,document);
        UUID versionId=UUID.randomUUID();int version=Db.num(db.one("select coalesce(max(version),0)+1 n from scenario_version where scenario_id=?",w.get("scenario_id")),"n");
        db.update("insert into scenario_version(id,scenario_id,version,status,definition,presentation,author_revision) values(?,?,?,'DRAFT',cast(? as jsonb),cast(? as jsonb),?)",versionId,w.get("scenario_id"),version,json.write(document),json.write(document.getOrDefault("presentation",map("scenes",List.of()))),revision);
        for(UUID asset:AuthorDocument.assetIds(document))db.update("insert into author_version_asset(version_id,asset_id) values(?,?)",versionId,asset);
        return versionId;
    }
    public Map<String,Object> submit(UUID actor,UUID id,long revision){
        UUID version=freeze(actor,id,revision);var review=db.optional("select id,status from scenario_review where version_id=?",version);
        if(review!=null){if(!"PENDING".equals(review.get("status")))throw new ApiException(409,"REVISION_ALREADY_REVIEWED","검수된 버전입니다. 수정한 새 버전을 제출해 주세요.");return map("versionId",version,"reviewId",review.get("id"));}
        db.update("update scenario_review set status='SUPERSEDED',note='작가가 새 버전을 제출했습니다.',decided_at=now() where author_id=? and status='PENDING' and version_id in (select id from scenario_version where scenario_id=(select scenario_id from scenario_version where id=?))",actor,version);
        UUID reviewId=UUID.randomUUID();db.update("insert into scenario_review(id,version_id,author_id,status) values(?,?,?,'PENDING')",reviewId,version,actor);return map("versionId",version,"reviewId",reviewId);
    }
    private void validateDocument(UUID actor,Map<String,Object> d){scenarios.validate(d);assets.validateReferences(actor,d,true);}
    private void checkRevision(Map<String,Object> row,long revision){if(((Number)row.get("revision")).longValue()!=revision)throw conflict();}
    private ApiException conflict(){return new ApiException(409,"DRAFT_CONFLICT","다른 창에서 작품을 수정했습니다. 최신 문서를 불러와 주세요.");}
    public void requireAdmin(UUID actor){if(db.optional("select 1 from app_user where id=? and admin=true",actor)==null)throw new ApiException(403,"ADMIN_REQUIRED","검수 권한이 필요합니다.");}
    public Map<String,Object> reviews(UUID actor){requireAdmin(actor);var items=db.list("select r.id,r.version_id,r.status,r.created_at,v.definition->>'title' title,u.display_name from scenario_review r join scenario_version v on v.id=r.version_id join app_user u on u.id=r.author_id order by r.created_at desc,r.id").stream().map(r->map("id",r.get("id"),"versionId",r.get("version_id"),"title",r.get("title"),"authorName",r.get("display_name"),"status",r.get("status"),"createdAt",Db.instant(r,"created_at"))).toList();return map("items",items,"total",items.size());}
    public Map<String,Object> review(UUID actor,UUID id){return commands.transaction(()->{requireAdmin(actor);var row=db.one("select r.*,v.scenario_id from scenario_review r join scenario_version v on v.id=r.version_id where r.id=?",id);var document=AuthorDocument.project(scenarios.definition(Db.uuid(row,"version_id")));if("MURDER_MYSTERY".equals(document.getOrDefault("gameType","MURDER_MYSTERY")))expose(actor,Db.uuid(row,"scenario_id"),Db.uuid(row,"version_id"));return map("id",id,"versionId",row.get("version_id"),"status",row.get("status"),"document",document,"note",row.get("note"));});}
    private void expose(UUID actor,UUID scenario,UUID version){db.update("insert into scenario_exposure(user_id,scenario_id) values(?,?) on conflict do nothing",actor,scenario);if(version!=null)db.update("insert into scenario_exposure_source(user_id,version_id,source) values(?,?,'AUTHOR_PREVIEW') on conflict do nothing",actor,version);}
    public Map<String,Object> decide(UUID actor,UUID id,String decision,String note){
        requireAdmin(actor);if(!Set.of("APPROVE","REQUEST_CHANGES").contains(Objects.toString(decision,""))||note!=null&&note.length()>4000)throw new ApiException(422,"INVALID_REVIEW","검수 결과와 4,000자 이하 의견을 입력해 주세요.");
        if("REQUEST_CHANGES".equals(decision)&&(note==null||note.isBlank()))throw new ApiException(422,"REVIEW_NOTE_REQUIRED","수정이 필요한 내용을 적어 주세요.");
        var row=db.one("select * from scenario_review where id=? for update",id);if(!"PENDING".equals(row.get("status")))throw new ApiException(409,"REVIEW_ALREADY_DECIDED","이미 처리한 검수입니다.");
        if(decision.equals("APPROVE")){validateDocument(Db.uuid(row,"author_id"),scenarios.definition(Db.uuid(row,"version_id")));db.update("update scenario_version set status='PUBLISHED' where id=?",row.get("version_id"));}
        db.update("update scenario_review set status=?,note=?,decided_at=now() where id=?",decision.equals("APPROVE")?"APPROVED":"CHANGES_REQUESTED",note==null?"":note.strip(),id);return map("ok",true);
    }
}
