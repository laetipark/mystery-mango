package com.mysterymango.game;

import com.mysterymango.common.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.*;
import static com.mysterymango.game.Definitions.*;

@Service
public class BoardRuntimeService {
    private final Db db;private final Json json;private final Commands commands;private final GameService games;private final SceneService scenes;private final Events events;private final BoardEngine engine=new BoardEngine();
    public BoardRuntimeService(Db db,Json json,Commands commands,GameService games,SceneService scenes,Events events){this.db=db;this.json=json;this.commands=commands;this.games=games;this.scenes=scenes;this.events=events;}
    @Transactional(readOnly=true)
    public Map<String,Object> kind(UUID id,UUID actor){var game=authorized(id,actor);return obj("gameType",game.get("game_type"),"test",game.get("is_test"));}
    @Transactional
    public Map<String,Object> snapshot(UUID id,UUID actor){commands.lock();var g=authorized(id,actor);board(g);int seat=seat(id,actor);var result=obj("id",id,"gameType",g.get("game_type"),"resultKind","TABLETOP".equals(Db.str(g,"game_type"))?"MANUAL":"AUTOMATIC","status",g.get("status"),"stateVersion",g.get("state_version"),"serverTime",Instant.now(),"mySeat",seat,"hostId",g.get("host_id"),"participants",db.list("select p.user_id,u.display_name,p.role_id,p.active from player_role p join app_user u on u.id=p.user_id where p.game_id=? order by role_id",id).stream().map(p->obj("userId",p.get("user_id"),"displayName",p.get("display_name"),"seat",parseSeat(Db.str(p,"role_id")),"active",p.get("active"))).toList(),"state",engine.project(Db.str(g,"game_type"),json.object(g.get("board_state").toString()),seat));result.putAll(games.abortStatus(id,actor));result.putAll(scenes.forGame(id,actor));return result;}
    public Map<String,Object> command(UUID id,UUID actor,String type,long expected,Map<String,Object> payload){var g=authorized(id,actor);board(g);MysteryEngine.require(((Number)g.get("state_version")).longValue()==expected,409,"STALE_STATE","다른 변경이 먼저 반영되었습니다. 화면을 새로 받아 주세요.");MysteryEngine.require("ACTIVE".equals(Db.str(g,"status")),409,"GAME_NOT_ACTIVE","현재 행동할 수 없는 게임입니다.");
        MysteryEngine.require(type!=null&&!type.isBlank(),422,"INVALID_COMMAND","행동을 선택해 주세요.");
        if(type.equals("LEAVE"))return games.leaveGame(id,actor);
        var state=json.object(g.get("board_state").toString());engine.command(Db.str(g,"game_type"),state,seat(id,actor),actor.equals(Db.uuid(g,"host_id")),type,payload);db.update("update game_session set board_state=?::jsonb,state_version=state_version+1 where id=?",json.write(state),id);if(bool(state,"finished"))games.completeBoard(id);events.emit(games.participants(id),"BOARD_CHANGED",id,expected+1);return obj("ok",true);
    }
    public Map<String,Object> changeScene(UUID id,UUID actor,String sceneId){var g=authorized(id,actor);var view=scenes.forGame(id,actor);MysteryEngine.require(Boolean.TRUE.equals(view.get("canChangeScene")),403,"HOST_REQUIRED","게임 진행 중 방장만 장면을 바꿀 수 있습니다.");MysteryEngine.require(objects(view.get("availableScenes")).stream().anyMatch(s->str(s,"id").equals(sceneId)),422,"SCENE_UNAVAILABLE","현재 단계에서 사용할 수 없는 장면입니다.");db.update("update game_session set active_scene_id=?,state_version=state_version+1 where id=?",sceneId,id);events.emit(games.participants(id),"SCENE_CHANGED",id,((Number)g.get("state_version")).longValue()+1);return obj("ok",true);}
    public void authorize(UUID id,UUID actor){authorized(id,actor);}
    private Map<String,Object> authorized(UUID id,UUID actor){MysteryEngine.require(games.isParticipant(id,actor),403,"GAME_ACCESS_DENIED","이 게임에 접근할 권한이 없습니다.");return db.one("select g.*,r.host_id from game_session g join room r on r.id=g.room_id where g.id=?",id);}
    private void board(Map<String,Object> g){MysteryEngine.require(!"MURDER_MYSTERY".equals(Db.str(g,"game_type")),409,"NOT_BOARD_GAME","보드게임에서 사용할 수 있습니다.");}
    private int seat(UUID id,UUID actor){return parseSeat(Db.str(db.one("select role_id from player_role where game_id=? and user_id=?",id,actor),"role_id"));}
    private int parseSeat(String role){return Integer.parseInt(role.substring(5));}
}
