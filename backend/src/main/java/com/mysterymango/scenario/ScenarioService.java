package com.mysterymango.scenario;

import com.mysterymango.common.*;
import com.mysterymango.game.ScenarioValidator;
import org.springframework.stereotype.Service;
import java.util.*;
import static com.mysterymango.common.Json.map;

@Service
public class ScenarioService {
    private final Db db;private final Json json;private final ScenarioValidator validator;
    public ScenarioService(Db db,Json json,ScenarioValidator validator){this.db=db;this.json=json;this.validator=validator;}
    public Map<String,Object> definition(UUID versionId){return json.object(db.one("select definition from scenario_version where id=?",versionId).get("definition").toString());}
    @SuppressWarnings("unchecked") public Map<String,Object> publicVersion(UUID versionId){
        var row=db.one("select id,scenario_id,definition from scenario_version where id=? and status='PUBLISHED'",versionId);var def=json.object(row.get("definition").toString());
        var roles=((List<Map<String,Object>>)def.get("roles")).stream().map(r->map("id",r.get("id"),"name",r.get("name"),"publicIntro",r.get("publicIntro"))).toList();
        return map("id",row.get("scenario_id"),"versionId",row.get("id"),"title",def.get("title"),"synopsis",def.get("synopsis"),"playerCount",def.get("playerCount"),"estimatedMinutes",def.get("estimatedMinutes"),"durationEstimated",true,"genre",def.get("genre"),"difficulty",def.get("difficulty"),"language",def.get("language"),"modes",def.get("modes"),"roles",roles);
    }
    public Map<String,Object> list(int page,int size,String genre,String difficulty,Integer maxMinutes){
        return list(page,size,genre,difficulty,maxMinutes,null);
    }
    public Map<String,Object> list(int page,int size,String genre,String difficulty,Integer maxMinutes,Integer playerCount){
        if(playerCount!=null&&(playerCount<1||playerCount>4))throw new ApiException(422,"INVALID_PLAYER_COUNT","작품 인원은 1~4명 중에서 선택해 주세요.");
        page=Math.max(0,page);size=Math.clamp(size,1,50);
        List<Map<String,Object>> cards=db.list("select distinct on(scenario_id) id,scenario_id from scenario_version where status='PUBLISHED' order by scenario_id,version desc").stream().map(r->publicVersion(Db.uuid(r,"id"))).filter(r->genre==null||genre.isBlank()||genre.equals(r.get("genre"))).filter(r->difficulty==null||difficulty.isBlank()||difficulty.equals(r.get("difficulty"))).filter(r->maxMinutes==null||((Number)r.get("estimatedMinutes")).intValue()<=maxMinutes).filter(r->playerCount==null||((Number)r.get("playerCount")).intValue()==playerCount).sorted(Comparator.comparing(r->r.get("title").toString())).toList();
        return map("items",cards.stream().skip((long)page*size).limit(size).toList(),"total",cards.size(),"page",page,"size",size);
    }
    public UUID save(Map<String,Object> definition,boolean publish){
        validator.validate(definition);String slug=Objects.toString(definition.get("slug"),"");if(!slug.matches("[a-z0-9-]{3,80}"))throw new ApiException(400,"INVALID_SCENARIO","작품 slug를 확인해 주세요.");
        db.update("insert into scenario(id,slug) values(?,?) on conflict(slug) do nothing",UUID.randomUUID(),slug);
        UUID scenarioId=Db.uuid(db.one("select id from scenario where slug=?",slug),"id");
        int version=Db.num(db.one("select coalesce(max(version),0)+1 as n from scenario_version where scenario_id=?",scenarioId),"n");UUID id=UUID.randomUUID();
        db.update("insert into scenario_version(id,scenario_id,version,status,definition) values(?,?,?,?,cast(? as jsonb))",id,scenarioId,version,publish?"PUBLISHED":"DRAFT",json.write(definition));return id;
    }
    public void validate(Map<String,Object> definition){validator.validate(definition);}
}
