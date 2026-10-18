package com.mysterymango.scenario;

import com.mysterymango.common.*;
import com.mysterymango.game.ScenarioValidator;
import com.mysterymango.author.AuthorDocument;
import org.springframework.stereotype.Service;
import java.util.*;
import static com.mysterymango.common.Json.map;

@Service
public class ScenarioService {
    private final Db db;private final Json json;private final ScenarioValidator validator;
    public ScenarioService(Db db,Json json,ScenarioValidator validator){this.db=db;this.json=json;this.validator=validator;}
    public Map<String,Object> definition(UUID versionId){return json.object(db.one("select definition from scenario_version where id=?",versionId).get("definition").toString());}
    public Map<String,Object> publicVersion(UUID versionId){return card(db.one("select id,scenario_id,definition from scenario_version where id=? and status='PUBLISHED'",versionId));}
    /** Internal callers must establish room, test or game access before using an unpublished card. */
    public Map<String,Object> internalVersion(UUID versionId){return card(db.one("select id,scenario_id,definition from scenario_version where id=?",versionId));}
    @SuppressWarnings("unchecked") private Map<String,Object> card(Map<String,Object> row){
        var def=json.object(row.get("definition").toString());String type=Objects.toString(def.getOrDefault("gameType","MURDER_MYSTERY"));
        var roles=type.equals("MURDER_MYSTERY")?((List<Map<String,Object>>)def.getOrDefault("roles",List.of())).stream().map(r->map("id",r.get("id"),"name",r.get("name"),"publicIntro",r.get("publicIntro"))).toList():List.of();
        return map("id",row.get("scenario_id"),"versionId",row.get("id"),"title",def.get("title"),"synopsis",def.get("synopsis"),"playerCount",def.get("playerCount"),"supportedPlayerCounts",def.getOrDefault("supportedPlayerCounts",List.of(def.get("playerCount"))),"gameType",type,"engineId",def.getOrDefault("engineId",switch(type){case "TABLETOP"->"tabletop-v1";case "YACHT"->"yacht-v1";case "GOMOKU"->"gomoku-v1";case "REVERSI"->"reversi-v1";case "CHECKERS"->"checkers-v1";default->"mystery-v1";}),"estimatedMinutes",def.get("estimatedMinutes"),"durationEstimated",true,"genre",def.get("genre"),"difficulty",def.get("difficulty"),"language",def.get("language"),"modes",def.get("modes"),"roles",roles);
    }
    public void requireAuthorAccess(UUID actor,UUID versionId){
        if(db.optional("select 1 from scenario_version v join scenario s on s.id=v.scenario_id where v.id=? and (s.owner_id=? or (exists(select 1 from app_user u where u.id=? and u.admin=true) and exists(select 1 from scenario_review r where r.version_id=v.id)))",versionId,actor,actor)==null)throw new ApiException(403,"AUTHOR_ACCESS_REQUIRED","이 작품을 제작·검수할 권한이 없습니다.");
    }
    public Map<String,Object> authorizedVersion(UUID actor,UUID versionId){requireAuthorAccess(actor,versionId);return AuthorDocument.project(definition(versionId));}
    public Map<String,Object> list(int page,int size,String genre,String difficulty,Integer maxMinutes){
        return list(page,size,genre,difficulty,maxMinutes,null);
    }
    public Map<String,Object> list(int page,int size,String genre,String difficulty,Integer maxMinutes,Integer playerCount){
        return list(page,size,genre,difficulty,maxMinutes,playerCount,null);
    }
    public Map<String,Object> list(int page,int size,String genre,String difficulty,Integer maxMinutes,Integer playerCount,String gameType){
        if(playerCount!=null&&(playerCount<1||playerCount>4))throw new ApiException(422,"INVALID_PLAYER_COUNT","작품 인원은 1~4명 중에서 선택해 주세요.");
        page=Math.max(0,page);size=Math.clamp(size,1,50);
        List<Map<String,Object>> cards=db.list("select distinct on(scenario_id) id,scenario_id from scenario_version where status='PUBLISHED' order by scenario_id,version desc").stream().map(r->publicVersion(Db.uuid(r,"id"))).filter(r->genre==null||genre.isBlank()||genre.equals(r.get("genre"))).filter(r->difficulty==null||difficulty.isBlank()||difficulty.equals(r.get("difficulty"))).filter(r->maxMinutes==null||((Number)r.get("estimatedMinutes")).intValue()<=maxMinutes).filter(r->playerCount==null||((List<?>)r.get("supportedPlayerCounts")).stream().anyMatch(n->((Number)n).intValue()==playerCount)).filter(r->gameType==null||gameType.isBlank()||gameType.equals(r.get("gameType"))).sorted(Comparator.comparing(r->r.get("title").toString())).toList();
        return map("items",cards.stream().skip((long)page*size).limit(size).toList(),"total",cards.size(),"page",page,"size",size);
    }
    public UUID save(Map<String,Object> definition,boolean publish){
        definition=AuthorDocument.project(definition);
        validator.validate(definition);String slug=Objects.toString(definition.get("slug"),"");if(!slug.matches("[a-z0-9-]{3,80}"))throw new ApiException(400,"INVALID_SCENARIO","작품 slug를 확인해 주세요.");
        if(!AuthorDocument.assetIds(definition).isEmpty())throw new ApiException(422,"AUTHOR_ASSET_REQUIRED","파일이 있는 작품은 작가 제작·검수 흐름으로 등록해 주세요.");
        db.update("insert into scenario(id,slug) values(?,?) on conflict(slug) do nothing",UUID.randomUUID(),slug);
        var scenario=db.one("select id,owner_id from scenario where slug=?",slug);if(scenario.get("owner_id")!=null)throw new ApiException(403,"REVIEW_REQUIRED","작가 작품은 검수를 통해서만 공개할 수 있습니다.");UUID scenarioId=Db.uuid(scenario,"id");
        int version=Db.num(db.one("select coalesce(max(version),0)+1 as n from scenario_version where scenario_id=?",scenarioId),"n");UUID id=UUID.randomUUID();
        db.update("insert into scenario_version(id,scenario_id,version,status,definition,presentation) values(?,?,?,?,cast(? as jsonb),cast(? as jsonb))",id,scenarioId,version,publish?"PUBLISHED":"DRAFT",json.write(definition),json.write(definition.getOrDefault("presentation",map("scenes",List.of()))));return id;
    }
    public void publishSystem(UUID versionId){var row=db.one("select s.owner_id from scenario_version v join scenario s on s.id=v.scenario_id where v.id=?",versionId);if(row.get("owner_id")!=null)throw new ApiException(403,"REVIEW_REQUIRED","작가 작품은 검수를 통해서만 공개할 수 있습니다.");validate(definition(versionId));db.update("update scenario_version set status='PUBLISHED' where id=?",versionId);}
    public void validate(Map<String,Object> definition){validator.validate(definition);}
    public void validate(Map<String,Object> definition,ValidationContext context){validator.validate(definition,context);}
}
