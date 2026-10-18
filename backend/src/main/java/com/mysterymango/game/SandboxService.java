package com.mysterymango.game;

import com.mysterymango.common.*;
import com.mysterymango.scenario.ScenarioService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import static com.mysterymango.game.Definitions.*;

@Service
public class SandboxService {
    private final Db db;private final Json json;private final Commands commands;private final ScenarioService scenarios;private final SceneService scenes;private final EndingObservationService endingObservations;private final BoardEngine boards=new BoardEngine();private final MysterySandboxEngine mystery=new MysterySandboxEngine();
    public SandboxService(Db db,Json json,Commands commands,ScenarioService scenarios,SceneService scenes){this.db=db;this.json=json;this.commands=commands;this.scenarios=scenarios;this.scenes=scenes;this.endingObservations=new EndingObservationService(db,json,commands,scenarios);}
    public Map<String,Object> create(UUID actor,UUID version,int capacity){var d=scenarios.authorizedVersion(actor,version);String type=d.getOrDefault("gameType","MURDER_MYSTERY").toString();if(type.equals("MURDER_MYSTERY"))MysteryEngine.require(capacity==integer(d,"playerCount",0),422,"INVALID_CAPACITY","작품 인원과 같은 역할 수로 시험해 주세요.");else MysteryEngine.require(BoardEngine.numbers(d.get("supportedPlayerCounts")).contains(capacity),422,"INVALID_CAPACITY","지원하지 않는 시험 인원입니다.");var state=initial(type,d,capacity);UUID id=UUID.randomUUID();db.update("insert into sandbox_run(id,owner_id,version_id,game_type,capacity,state) values(?,?,?,?,?,?::jsonb)",id,actor,version,type,capacity,json.write(state));if(type.equals("MURDER_MYSTERY")){db.update("insert into scenario_exposure(user_id,scenario_id) select ?,scenario_id from scenario_version where id=? on conflict do nothing",actor,version);db.update("insert into scenario_exposure_source(user_id,version_id,source) values(?,?,'AUTHOR_PREVIEW') on conflict do nothing",actor,version);}return obj("id",id);}
    @Transactional
    public Map<String,Object> snapshot(UUID id,UUID actor,int seat){commands.lock();var run=authorized(id,actor);checkSeat(run,seat);var d=scenarios.definition(Db.uuid(run,"version_id"));var state=json.object(run.get("state").toString());var type=Db.str(run,"game_type");if(type.equals("MURDER_MYSTERY")){db.update("insert into scenario_exposure(user_id,scenario_id) select ?,scenario_id from scenario_version where id=? on conflict do nothing",actor,run.get("version_id"));db.update("insert into scenario_exposure_source(user_id,version_id,source) values(?,?,'AUTHOR_PREVIEW') on conflict do nothing",actor,run.get("version_id"));}var result=obj("id",id,"gameType",type,"stateVersion",run.get("state_version"),"seat",seat,"capacity",run.get("capacity"),"state",type.equals("MURDER_MYSTERY")?mystery.project(d,state,seat):boards.project(type,state,seat));result.putAll(scenes.forSandbox(run,seat));return result;}
    public Map<String,Object> command(UUID id,UUID actor,int seat,String type,long expected,Map<String,Object> p){var run=authorized(id,actor);checkSeat(run,seat);MysteryEngine.require(((Number)run.get("state_version")).longValue()==expected,409,"STALE_STATE","시험 상태가 변경되었습니다. 화면을 새로 받아 주세요.");var d=scenarios.definition(Db.uuid(run,"version_id"));String gameType=Db.str(run,"game_type");var state=json.object(run.get("state").toString());String scene=Db.str(run,"active_scene_id");
        Object previousEnding=state.get("endingId");
        MysteryEngine.require(type!=null&&!type.isBlank(),422,"INVALID_COMMAND","행동을 선택해 주세요.");
        if(type.equals("RESET")){state=initial(gameType,d,Db.num(run,"capacity"));scene=null;}
        else if(type.equals("SCENE")){var view=scenes.forSandbox(run,seat);String chosen=str(p,"sceneId");MysteryEngine.require(objects(view.get("availableScenes")).stream().anyMatch(s->str(s,"id").equals(chosen)),422,"SCENE_UNAVAILABLE","현재 사용할 수 없는 장면입니다.");scene=chosen;}
        else if(gameType.equals("MURDER_MYSTERY")){int before=integer(state,"phaseIndex",0);mystery.command(d,state,seat,type,p);if(integer(state,"phaseIndex",0)!=before)scene=null;}
        else boards.command(gameType,state,seat,true,type,p);
        db.update("update sandbox_run set state=?::jsonb,state_version=state_version+1,active_scene_id=? where id=?",json.write(state),scene,id);
        if(gameType.equals("MURDER_MYSTERY")&&previousEnding==null&&state.get("endingId")!=null)endingObservations.recordSandbox(id,actor,java.time.Instant.now());
        return obj("ok",true);
    }
    public void authorize(UUID id,UUID actor){authorized(id,actor);}
    private Map<String,Object> authorized(UUID id,UUID actor){var run=db.one("select * from sandbox_run where id=?",id);MysteryEngine.require(scenes.sandboxAuthorized(run,actor),403,"SANDBOX_ACCESS_DENIED","이 시험에 접근할 권한이 없습니다.");return run;}
    private void checkSeat(Map<String,Object> run,int seat){MysteryEngine.require(seat>=0&&seat<Db.num(run,"capacity"),422,"INVALID_SEAT","역할 또는 자리를 선택해 주세요.");}
    private Map<String,Object> initial(String type,Map<String,Object> d,int capacity){return type.equals("MURDER_MYSTERY")?mystery.initial(d):boards.initial(type,d,capacity);}
}
