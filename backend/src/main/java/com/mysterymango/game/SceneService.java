package com.mysterymango.game;

import com.mysterymango.common.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.*;
import static com.mysterymango.game.Definitions.*;

@Service
public class SceneService {
    private final Db db;private final Json json;private final Commands commands;
    public SceneService(Db db,Json json){this(db,json,null);}
    @Autowired public SceneService(Db db,Json json,Commands commands){this.db=db;this.json=json;this.commands=commands;}
    public Map<String,Object> forGame(UUID gameId,UUID actor){
        var g=db.one("select g.*,r.host_id from game_session g join room r on r.id=g.room_id where g.id=?",gameId);
        var player=db.optional("select role_id from player_role where game_id=? and user_id=? and active=true",gameId,actor);MysteryEngine.require(player!=null,403,"GAME_ACCESS_DENIED","이 게임에 접근할 권한이 없습니다.");
        var version=version(Db.uuid(g,"scenario_version_id"));var d=json.object(version.get("definition").toString());String phase="";if(g.get("current_phase_id")!=null)phase=Db.str(db.one("select definition_id from phase_instance where id=?",g.get("current_phase_id")),"definition_id");
        Set<String> clues=new HashSet<>();for(var c:db.list("select clue_id from clue_grant where game_id=? and user_id=? union select clue_id from public_clue where game_id=?",gameId,actor,gameId))clues.add(Db.str(c,"clue_id"));
        boolean host=actor.equals(Db.uuid(g,"host_id"))&&"ACTIVE".equals(Db.str(g,"status"));return project(presentation(version,d),d,phase,Db.str(player,"role_id"),clues,Db.str(g,"active_scene_id"),host);
    }
    public Map<String,Object> forSandbox(Map<String,Object> run,int seat){
        var version=version(Db.uuid(run,"version_id"));var d=json.object(version.get("definition").toString());var state=json.object(run.get("state").toString());String phase="",role="seat-"+seat;Set<String> clues=new HashSet<>();
        if("MURDER_MYSTERY".equals(Db.str(run,"game_type"))){var roles=objects(d.get("roles"));MysteryEngine.require(seat>=0&&seat<roles.size(),422,"INVALID_SEAT","역할을 선택해 주세요.");role=str(roles.get(seat),"id");phase=str(MysterySandboxEngine.phase(d,state),"id");clues.addAll(strings(state.get("publicClues")));clues.addAll(map(map(state.get("grants")).get(role)).keySet());}
        return project(presentation(version,d),d,phase,role,clues,Db.str(run,"active_scene_id"),true);
    }
    public Map<String,Object> project(Map<String,Object> presentation,Map<String,Object> d,String phase,String role,Set<String> clues,String active,boolean host){
        var scenes=objects(presentation.get("scenes"));var available=scenes.stream().filter(s->kind(s).equals("SCENE")&&phaseAllowed(s,phase)).toList();var selected=available.stream().filter(s->str(s,"id").equals(active)).findFirst().orElse(available.isEmpty()?null:available.getFirst());
        var layouts=scenes.stream().filter(s->phaseAllowed(s,phase)&&(kind(s).equals("ROLE")&&str(s,"referenceId").equals(role)||kind(s).equals("CLUE")&&clues.contains(str(s,"referenceId")))).map(s->view(s,d,phase,role,clues)).toList();
        return obj("scene",selected==null?null:view(selected,d,phase,role,clues),"availableScenes",available.stream().map(s->obj("id",s.get("id"),"name",s.get("name"))).toList(),"canChangeScene",host&&!available.isEmpty(),"layouts",layouts);
    }
    private Map<String,Object> view(Map<String,Object> scene,Map<String,Object> d,String phase,String role,Set<String> clues){
        var nodes=objects(scene.get("nodes")).stream().filter(n->nodeAllowed(n,d,phase,role,clues)).map(n->{var v=new LinkedHashMap<String,Object>();for(String key:List.of("id","kind","x","y","width","height","rotation","fill","text","fontSize","assetId","locked","bindingType","bindingId"))if(n.containsKey(key))v.put(key,n.get(key));if("MATERIAL".equals(str(n,"kind"))){String binding=str(n,"bindingType"),id=str(n,"bindingId");if(binding.equals("CLUE")){var c=find(d,"clues",id);v.put("text",c.get("title")+"\n"+c.get("text"));}if(binding.equals("ROLE")){var r=find(d,"roles",id);v.put("text",r.get("name")+"\n"+r.get("secret"));}if(binding.equals("TARGET"))v.put("text",find(d,"targets",id).get("name"));}return v;}).toList();
        return obj("id",scene.get("id"),"name",scene.get("name"),"width",scene.get("width"),"height",scene.get("height"),"background",scene.get("background"),"bgmAssetId",scene.get("bgmAssetId"),"nodes",nodes);
    }
    private boolean nodeAllowed(Map<String,Object> n,Map<String,Object> d,String phase,String role,Set<String> clues){return switch(str(n,"bindingType")){case "ROLE"->str(n,"bindingId").equals(role);case "CLUE"->clues.contains(str(n,"bindingId"));case "TARGET"->objects(d.get("targets")).stream().anyMatch(t->str(t,"id").equals(str(n,"bindingId"))&&strings(t.get("phaseIds")).contains(phase));case "NONE",""->true;default->false;};}
    private static boolean phaseAllowed(Map<String,Object> scene,String phase){var phases=strings(scene.get("phaseIds"));return phases.isEmpty()||phases.contains(phase);}
    private static String kind(Map<String,Object> s){return s.containsKey("kind")?str(s,"kind"):"SCENE";}
    private Map<String,Object> version(UUID id){return db.one("select definition,presentation from scenario_version where id=?",id);}
    private Map<String,Object> presentation(Map<String,Object> version,Map<String,Object> d){return version.get("presentation")==null?map(d.get("presentation")):json.object(version.get("presentation").toString());}
    public boolean sandboxAuthorized(Map<String,Object> run,UUID actor){return actor.equals(Db.uuid(run,"owner_id"))||db.optional("select 1 from app_user u join scenario_review r on r.version_id=? where u.id=? and u.admin=true and r.status='PENDING'",run.get("version_id"),actor)!=null;}
    @Transactional
    public boolean canAccessAsset(UUID actor,UUID gameId,UUID sandboxId,UUID assetId){
        return commands.transaction(()->assetAllowed(actor,gameId,sandboxId,assetId));
    }
    private boolean assetAllowed(UUID actor,UUID gameId,UUID sandboxId,UUID assetId){
        try{
            if(gameId!=null){var g=db.one("select * from game_session where id=?",gameId);var view=forGame(gameId,actor);boolean allowed=hasAsset(view,assetId);
                if(!"MURDER_MYSTERY".equals(Db.str(g,"game_type"))){var p=db.one("select role_id from player_role where game_id=? and user_id=? and active=true",gameId,actor);int seat=Integer.parseInt(Db.str(p,"role_id").substring(5));allowed|=hasAsset(new BoardEngine().project(Db.str(g,"game_type"),json.object(g.get("board_state").toString()),seat),assetId);}
                if(allowed&&"MURDER_MYSTERY".equals(Db.str(g,"game_type"))){db.update("insert into scenario_exposure(user_id,scenario_id) select ?,scenario_id from scenario_version where id=? on conflict do nothing",actor,g.get("scenario_version_id"));db.update("insert into scenario_exposure_source(user_id,version_id,source) values(?,?,?) on conflict do nothing",actor,g.get("scenario_version_id"),Boolean.TRUE.equals(g.get("is_test"))?"TEST_PLAY":"REGULAR_PLAY");}return allowed;
            }
            if(sandboxId!=null){var run=db.one("select * from sandbox_run where id=?",sandboxId);if(!sandboxAuthorized(run,actor))return false;for(int seat=0;seat<Db.num(run,"capacity");seat++){if(hasAsset(forSandbox(run,seat),assetId))return true;if(!"MURDER_MYSTERY".equals(Db.str(run,"game_type"))&&hasAsset(new BoardEngine().project(Db.str(run,"game_type"),json.object(run.get("state").toString()),seat),assetId))return true;}return false;}
            return false;
        }catch(ApiException e){if(e.status==403||e.status==404)return false;throw e;}
    }
    private static boolean hasAsset(Object object,UUID id){if(object instanceof Map<?,?> m){for(var entry:m.entrySet()){if(Set.of("assetId","backAssetId","bgmAssetId").contains(String.valueOf(entry.getKey()))&&id.toString().equals(String.valueOf(entry.getValue())))return true;if(hasAsset(entry.getValue(),id))return true;}}else if(object instanceof Collection<?> c){for(var item:c)if(hasAsset(item,id))return true;}return false;}
}
