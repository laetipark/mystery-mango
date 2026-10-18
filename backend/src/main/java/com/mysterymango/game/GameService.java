package com.mysterymango.game;

import com.mysterymango.common.*;
import com.mysterymango.scenario.ScenarioService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.security.SecureRandom;
import java.time.*;
import java.util.*;
import static com.mysterymango.game.Definitions.*;

@Service
public class GameService {
    private final Commands commands; private final Db db; private final Json json; private final ScenarioService scenarios; private final Activities activities; private final Events events;
    private final int phaseSeconds,graceSeconds,absenceSeconds,emptyAbortSeconds;
    private final BoardEngine boardEngine=new BoardEngine();
    private final SceneService scenes;
    private final EndingObservationService endingObservations;
    public GameService(Commands commands,Db db,Json json,ScenarioService scenarios,Activities activities,Events events,
            @Value("${app.game-phase-seconds:0}") int phaseSeconds,@Value("${app.disconnect-grace-seconds:120}") int graceSeconds,
            @Value("${app.abandon-seconds:300}") int absenceSeconds,@Value("${app.empty-game-abort-seconds:1800}") int emptyAbortSeconds) {
        this.commands=commands;this.db=db;this.json=json;this.scenarios=scenarios;this.activities=activities;this.events=events;
        this.phaseSeconds=phaseSeconds;this.graceSeconds=graceSeconds;this.absenceSeconds=absenceSeconds;this.emptyAbortSeconds=emptyAbortSeconds;
        this.scenes=new SceneService(db,json,commands);
        this.endingObservations=new EndingObservationService(db,json,commands,scenarios);
    }

    @Transactional
    public Map<String,Object> start(UUID roomId,UUID actor) {
        commands.lock(); var room=db.one("select * from room where id=? for update",roomId);
        require(actor.equals(Db.uuid(room,"host_id")),403,"HOST_REQUIRED","방장만 시작할 수 있습니다.");
        if("PLAYING".equals(Db.str(room,"status"))) return obj("gameId",Db.uuid(room,"game_id"));
        require("WAITING".equals(Db.str(room,"status")),409,"ROOM_CLOSED","종료된 방입니다.");
        var players=db.list("select * from room_participant where room_id=? order by joined_at,user_id",roomId);
        var definition=scenarios.definition(Db.uuid(room,"scenario_version_id"));
        String gameType=definition.getOrDefault("gameType","MURDER_MYSTERY").toString();boolean mystery=gameType.equals("MURDER_MYSTERY");
        int capacity=room.get("capacity") instanceof Number n?n.intValue():integer(definition,"playerCount",4);
        require(mystery?capacity==integer(definition,"playerCount",4):BoardEngine.numbers(definition.get("supportedPlayerCounts")).contains(capacity),409,"ROOM_CAPACITY_MISMATCH","작품에서 지원하는 방 인원을 확인해 주세요.");
        require(players.size()==capacity&&players.stream().allMatch(p->Boolean.TRUE.equals(p.get("ready"))),409,"ROOM_NOT_READY","정확한 인원과 전원 준비가 필요합니다.");
        UUID gameId=UUID.randomUUID(); Instant now=Instant.now();
        db.update("insert into game_session(id,room_id,scenario_version_id,status,created_at,game_type,is_test) values(?,?,?,'ACTIVE',?,?,?)",gameId,roomId,Db.uuid(room,"scenario_version_id"),now,gameType,Boolean.TRUE.equals(room.get("is_test")));
        var roles=new ArrayList<>(objects(definition.get("roles"))); Collections.shuffle(roles,new SecureRandom());
        for(int i=0;i<players.size();i++) {
            UUID uid=Db.uuid(players.get(i),"user_id");
            var activity=db.one("select * from player_activity where user_id=?",uid);
            require("ROOM".equals(Db.str(activity,"kind"))&&roomId.equals(Db.uuid(activity,"reference_id")),409,"ACTIVITY_CHANGED","참가자의 활동이 변경되었습니다.");
            db.update("insert into player_role(game_id,user_id,role_id,last_seen_at) values(?,?,?,?)",gameId,uid,mystery?str(roles.get(i),"id"):"seat-"+i,now);
            activities.set(uid,"GAME",gameId);
        }
        db.update("update room set status='PLAYING',game_id=? where id=?",gameId,roomId);
        if(mystery)openPhase(gameId,definition,0,now);else db.update("update game_session set board_state=?::jsonb where id=?",json.write(boardEngine.initial(gameType,definition,capacity)),gameId);
        pauseIfDiscord(gameId); changed(gameId,"GAME_STARTED");
        return obj("gameId",gameId);
    }

    @Transactional
    public Map<String,Object> snapshot(UUID gameId,UUID actor) {
        commands.lock(); var game=authorized(gameId,actor); requireMystery(game);var d=definition(game); expose(game,actor);
        var phase=db.one("select * from phase_instance where id=?",Db.uuid(game,"current_phase_id"));
        var p=find(d,"phases",Db.str(phase,"definition_id")); var role=myRoleData(gameId,actor,d);
        var phaseDto=obj("id",phase.get("id"),"definitionId",phase.get("definition_id"),"kind",p.get("kind"),"endsAt",Db.instant(phase,"ends_at"),"publicText",p.get("publicText"),"actions",p.get("actions"),"ready",db.optional("select 1 from phase_ready where phase_id=? and user_id=?",phase.get("id"),actor)!=null);
        List<Map<String,Object>> people=new ArrayList<>();
        for(var player:db.list("select p.*,u.display_name from player_role p join app_user u on u.id=p.user_id where game_id=? order by role_id",gameId)) {
            people.add(obj("userId",player.get("user_id"),"displayName",player.get("display_name"),"roleId",player.get("role_id"),"roleName",find(d,"roles",Db.str(player,"role_id")).get("name"),"connected",Boolean.TRUE.equals(player.get("active"))&&connected(player),"active",player.get("active")));
        }
        Map<String,Boolean> grants=new LinkedHashMap<>();for(var c:db.list("select clue_id,owned from clue_grant where game_id=? and user_id=?",gameId,actor))grants.put(Db.str(c,"clue_id"),Boolean.TRUE.equals(c.get("owned")));
        Set<String> published=new HashSet<>();for(var c:db.list("select clue_id from public_clue where game_id=?",gameId))published.add(Db.str(c,"clue_id"));
        var clues=MysteryEngine.clues(d,grants,published);
        List<Map<String,Object>> targets=new ArrayList<>();
        for(var t:objects(d.get("targets"))) if(strings(t.get("phaseIds")).contains(Db.str(phase,"definition_id"))) targets.add(obj("id",t.get("id"),"name",t.get("name"),"investigated",db.optional("select 1 from game_investigation where game_id=? and user_id=? and target_id=?",gameId,actor,str(t,"id"))!=null));
        var ballot=db.optional("select * from ballot where phase_id=?",phase.get("id")); Object ballotDto=null;
        if(ballot!=null) { var vote=db.optional("select * from game_vote where ballot_id=? and user_id=?",ballot.get("id"),actor); var settings=map(d.get("ballot")); ballotDto=obj("id",ballot.get("id"),"allowChange",settings.get("allowChange"),"allowAbstain",settings.get("allowAbstain"),"myVote",vote==null?null:vote.get("role_id"),"submitted",vote!=null,"endsAt",Db.instant(phase,"ends_at")); }
        var whispers=db.list("select id,status,inviter_id,invitee_id from whisper_room where game_id=? and (inviter_id=? or invitee_id=?) order by created_at",gameId,actor,actor).stream().map(w->obj("id",w.get("id"),"status",w.get("status"),"inviterId",w.get("inviter_id"),"inviteeId",w.get("invitee_id"))).toList();
        Object ending=null;
        if(game.get("ending_id")!=null) { var e=find(d,"endings",Db.str(game,"ending_id")); var objective=map(find(d,"roles",str(role,"id")).get("objective")); ending=obj("title",e.get("title"),"text",e.get("text"),"objectiveAchieved",RuleConditions.evaluate(map(objective.get("condition")),facts(gameId,str(role,"id")))); }
        var result=obj("id",gameId,"status",game.get("status"),"stateVersion",game.get("state_version"),"serverTime",Instant.now(),"phase",phaseDto,"participants",people,"myRole",role,"clues",clues,"targets",targets,"investigationsRemaining",remaining(gameId,actor,phase,p),"ballot",ballotDto,"whispers",whispers,"materials",db.list("select id,text from game_material where game_id=? order by created_at,id",gameId),"ending",ending);
        result.putAll(abortStatus(gameId,actor));result.putAll(scenes.forGame(gameId,actor));return result;
    }

    @Transactional
    public Map<String,Object> role(UUID gameId,UUID actor) { commands.lock(); var game=authorized(gameId,actor);requireMystery(game); expose(game,actor); return myRoleData(gameId,actor,definition(game)); }

    public Map<String,Object> investigate(UUID gameId,UUID actor,String targetId) {
        var game=action(gameId,actor,"INVESTIGATE"); var d=definition(game); var phase=currentPhase(game); var pd=find(d,"phases",Db.str(phase,"definition_id")); var target=find(d,"targets",targetId);
        require(strings(target.get("phaseIds")).contains(Db.str(phase,"definition_id")),409,"TARGET_UNAVAILABLE","지금 조사할 수 없는 대상입니다.");
        var previous=db.optional("select id from game_investigation where game_id=? and user_id=? and target_id=?",gameId,actor,targetId);
        if(previous!=null) return obj("investigationId",previous.get("id"));
        MysteryEngine.investigation(target,Db.str(phase,"definition_id"),remaining(gameId,actor,phase,pd));
        UUID id=UUID.randomUUID(); db.update("insert into game_investigation(id,game_id,phase_id,user_id,target_id,created_at) values(?,?,?,?,?,?)",id,gameId,phase.get("id"),actor,targetId,Instant.now());
        for(String clueId:strings(target.get("clueIds"))) grant(gameId,clueId,actor,true);
        expose(game,actor); changed(gameId,"CLUES_CHANGED"); return obj("investigationId",id);
    }

    public Map<String,Object> share(UUID gameId,UUID actor,String clueId,String scope,UUID whisperId) {
        var game=action(gameId,actor,"SHARE"); var clue=find(definition(game),"clues",clueId);
        var own=db.optional("select 1 from clue_grant where game_id=? and clue_id=? and user_id=? and owned=true",gameId,clueId,actor);
        MysteryEngine.share(clue,own!=null,scope);
        String policy=str(clue,"sharePolicy");
        if("PUBLIC".equals(scope)) {
            require(!policy.equals("PRIVATE"),403,"CLUE_PRIVATE","공개할 수 없는 단서입니다.");
            int inserted=db.update("insert into public_clue(game_id,clue_id,created_at) values(?,?,?) on conflict do nothing",gameId,clueId,Instant.now());
            if(inserted>0) rules(gameId,"CLUE_PUBLISHED",clueId,"clue:"+clueId);
        } else {
            require("WHISPER".equals(scope)&&"PUBLIC_AND_WHISPER".equals(policy),403,"SHARE_NOT_ALLOWED","밀담 공유를 허용하지 않는 단서입니다.");
            var w=whisper(gameId,whisperId,actor,true); grant(gameId,clueId,actor.equals(Db.uuid(w,"inviter_id"))?Db.uuid(w,"invitee_id"):Db.uuid(w,"inviter_id"),false);
        }
        changed(gameId,"CLUES_CHANGED"); return obj("ok",true);
    }

    public Map<String,Object> vote(UUID gameId,UUID actor,UUID ballotId,String roleId) {
        var game=action(gameId,actor,"VOTE"); var d=definition(game); var settings=map(d.get("ballot"));
        var b=db.one("select * from ballot where id=? and game_id=?",ballotId,gameId);
        require(b.get("closed_at")==null&&Objects.equals(b.get("phase_id"),game.get("current_phase_id")),409,"BALLOT_CLOSED","투표가 마감되었습니다.");
        if(roleId==null) require(bool(settings,"allowAbstain"),422,"ABSTAIN_NOT_ALLOWED","이 작품에서는 기권할 수 없습니다."); else find(d,"roles",roleId);
        var prior=db.optional("select * from game_vote where ballot_id=? and user_id=?",ballotId,actor);
        MysteryEngine.vote(d,roleId,prior!=null,prior==null?null:Db.str(prior,"role_id"));
        if(prior!=null&&!bool(settings,"allowChange")) { require(Objects.equals(prior.get("role_id"),roleId),409,"VOTE_FINAL","이미 제출한 투표를 바꿀 수 없습니다."); return obj("ok",true); }
        db.update("insert into game_vote(ballot_id,user_id,role_id,updated_at) values(?,?,?,?) on conflict(ballot_id,user_id) do update set role_id=excluded.role_id,updated_at=excluded.updated_at",ballotId,actor,roleId,Instant.now());
        changed(gameId,"VOTE_CHANGED"); return obj("ok",true);
    }

    public Map<String,Object> message(UUID gameId,UUID actor,String text,UUID whisperId) {
        action(gameId,actor,whisperId==null?"CHAT":"WHISPER");
        require(text!=null&&!text.isBlank()&&text.length()<=2000,422,"MESSAGE_INVALID","메시지는 1~2000자여야 합니다.");
        int recent=Db.num(db.one("select count(*) n from chat_message where sender_id=? and created_at>?",actor,Instant.now().minusSeconds(10)),"n");
        require(recent<15,429,"MESSAGE_RATE_LIMIT","메시지를 잠시 후 다시 보내 주세요.");
        List<UUID> recipients;
        if(whisperId==null) recipients=participants(gameId); else { var w=whisper(gameId,whisperId,actor,true); recipients=List.of(Db.uuid(w,"inviter_id"),Db.uuid(w,"invitee_id")); }
        UUID id=UUID.randomUUID(); db.update("insert into chat_message(id,game_id,sender_id,whisper_id,text,created_at) values(?,?,?,?,?,?)",id,gameId,actor,whisperId,text.strip(),Instant.now());
        for(UUID uid:recipients) db.update("insert into message_recipient(message_id,user_id) values(?,?)",id,uid);
        long version=bump(gameId); events.emit(recipients,"MESSAGE_CREATED",gameId,version); return obj("messageId",id);
    }

    @Transactional(readOnly=true)
    public Map<String,Object> messages(UUID gameId,UUID actor,UUID whisperId,UUID before,int size) {
        authorized(gameId,actor); if(whisperId!=null) whisper(gameId,whisperId,actor,false); size=Math.max(1,Math.min(size,100));
        List<Object> args=new ArrayList<>(List.of(gameId,actor));
        String sql="select m.id,m.sender_id,u.display_name,m.text,m.created_at,m.whisper_id from chat_message m join message_recipient r on r.message_id=m.id join app_user u on u.id=m.sender_id where m.game_id=? and r.user_id=?";
        if(whisperId==null) sql+=" and m.whisper_id is null"; else {sql+=" and m.whisper_id=?";args.add(whisperId);}
        if(before!=null) { var cursor=db.one("select m.created_at,m.id from chat_message m join message_recipient r on r.message_id=m.id where m.id=? and m.game_id=? and r.user_id=?",before,gameId,actor);sql+=" and (m.created_at,m.id)<(?,?)";args.add(Db.instant(cursor,"created_at"));args.add(before); }
        sql+=" order by m.created_at desc,m.id desc limit ?";args.add(size+1);
        var rows=db.list(sql,args.toArray()); boolean more=rows.size()>size;
        var items=rows.stream().limit(size).map(m->obj("id",m.get("id"),"senderId",m.get("sender_id"),"senderName",m.get("display_name"),"text",m.get("text"),"createdAt",Db.instant(m,"created_at"),"whisperId",m.get("whisper_id"))).toList();
        return obj("items",items,"hasMore",more);
    }

    public Map<String,Object> inviteWhisper(UUID gameId,UUID actor,UUID invitee) {
        action(gameId,actor,"WHISPER"); require(invitee!=null&&!actor.equals(invitee)&&isParticipant(gameId,invitee),422,"WHISPER_RECIPIENT_INVALID","현재 게임 참가자를 선택해 주세요.");
        require(db.optional("select 1 from user_block where (user_id=? and blocked_id=?) or (user_id=? and blocked_id=?)",actor,invitee,invitee,actor)==null,403,"BLOCKED_USER","차단한 참가자와 밀담할 수 없습니다.");
        require(Db.num(db.one("select count(*) n from whisper_room where game_id=? and inviter_id=? and status='INVITED'",gameId,actor),"n")<3,429,"WHISPER_LIMIT","진행 중인 초대를 먼저 정리해 주세요.");
        UUID id=UUID.randomUUID(); db.update("insert into whisper_room(id,game_id,status,inviter_id,invitee_id,created_at) values(?,?,'INVITED',?,?,?)",id,gameId,actor,invitee,Instant.now()); changed(gameId,"WHISPER_CHANGED"); return obj("whisperId",id);
    }
    public Map<String,Object> acceptWhisper(UUID gameId,UUID actor,UUID id) {
        action(gameId,actor,"WHISPER"); var w=whisper(gameId,id,actor,false);
        require(actor.equals(Db.uuid(w,"invitee_id")),403,"INVITEE_REQUIRED","초대받은 참가자만 수락할 수 있습니다.");
        if("ACTIVE".equals(Db.str(w,"status"))) return obj("ok",true);
        require("INVITED".equals(Db.str(w,"status")),409,"WHISPER_CLOSED","종료된 밀담 초대입니다.");
        UUID inviter=Db.uuid(w,"inviter_id"); require(isParticipant(gameId,inviter),409,"PARTICIPANT_LEFT","초대한 참가자가 떠났습니다.");
        require(db.optional("select 1 from whisper_room where game_id=? and status='ACTIVE' and (inviter_id in (?,?) or invitee_id in (?,?))",gameId,actor,inviter,actor,inviter)==null,409,"WHISPER_BUSY","참가자가 이미 다른 밀담 중입니다.");
        db.update("update whisper_room set status='ACTIVE' where id=?",id);pauseIfDiscord(gameId);changed(gameId,"WHISPER_CHANGED");return obj("ok",true);
    }
    public Map<String,Object> leaveWhisper(UUID gameId,UUID actor,UUID id) {
        var game=authorized(gameId,actor); require(Set.of("ACTIVE","PAUSED").contains(Db.str(game,"status")),409,"GAME_FINISHED","종료된 게임입니다.");var w=whisper(gameId,id,actor,false);
        db.update("update whisper_room set status='CLOSED' where id=?",id);if("ACTIVE".equals(Db.str(w,"status"))) pauseIfDiscord(gameId);changed(gameId,"WHISPER_CHANGED");return obj("ok",true);
    }
    public Map<String,Object> phaseReady(UUID gameId,UUID actor) {
        var g=authorized(gameId,actor);requireMystery(g); require("ACTIVE".equals(Db.str(g,"status")),409,"GAME_PAUSED","현재 게임이 일시정지 상태입니다.");var phase=currentPhase(g);
        require("READING".equals(str(find(definition(g),"phases",Db.str(phase,"definition_id")),"kind")),409,"NOT_READING","개인 자료 읽기 단계에서 사용할 수 있습니다.");
        db.update("insert into phase_ready(phase_id,user_id) values(?,?) on conflict do nothing",phase.get("id"),actor);
        if(Db.num(db.one("select count(*) n from phase_ready r join player_role p on p.user_id=r.user_id and p.game_id=? and p.active=true where r.phase_id=?",gameId,phase.get("id")),"n")==participants(gameId).size()) advance(gameId,Instant.now());
        changed(gameId,"PHASE_READY");return obj("ok",true);
    }
    @Transactional
    public Map<String,Object> heartbeat(UUID gameId,UUID actor) { commands.lock();authorized(gameId,actor);db.update("update player_role set last_seen_at=? where game_id=? and user_id=?",Instant.now(),gameId,actor);return obj("ok",true); }
    public Map<String,Object> abortVote(UUID gameId,UUID actor) {
        var g=authorized(gameId,actor); require(Set.of("ACTIVE","PAUSED").contains(Db.str(g,"status")),409,"GAME_FINISHED","종료된 게임입니다.");
        db.update("delete from abort_vote where game_id=? and created_at<?",gameId,Instant.now().minusSeconds(60));
        db.update("insert into abort_vote(game_id,user_id,created_at) values(?,?,?) on conflict(game_id,user_id) do update set created_at=excluded.created_at",gameId,actor,Instant.now());
        List<UUID> eligible=abortEligible(gameId);
        if(!eligible.isEmpty()&&eligible.stream().allMatch(uid->db.optional("select 1 from abort_vote where game_id=? and user_id=?",gameId,uid)!=null)) finish(gameId,"ABORTED");
        changed(gameId,"ABORT_VOTE_CHANGED");return obj("ok",true);
    }
    public Map<String,Object> abortStatus(UUID gameId,UUID actor){var game=authorized(gameId,actor);List<UUID> eligible=abortEligible(gameId);long count=eligible.stream().filter(uid->db.optional("select 1 from abort_vote where game_id=? and user_id=? and created_at>?",gameId,uid,Instant.now().minusSeconds(60))!=null).count();return obj("abortVotes",count,"abortRequired",eligible.size(),"canRequestAbort",Set.of("ACTIVE","PAUSED").contains(Db.str(game,"status")));}
    public Map<String,Object> leaveGame(UUID gameId,UUID actor) {
        var game=authorized(gameId,actor);require(Set.of("ACTIVE","PAUSED").contains(Db.str(game,"status")),409,"GAME_FINISHED","종료된 게임에서는 탈퇴할 수 없습니다.");
        if(!"MURDER_MYSTERY".equals(Db.str(game,"game_type"))){var board=json.object(game.get("board_state").toString());String role=Db.str(db.one("select role_id from player_role where game_id=? and user_id=?",gameId,actor),"role_id");boardEngine.command(Db.str(game,"game_type"),board,Integer.parseInt(role.substring(5)),false,"LEAVE",Map.of());db.update("update game_session set board_state=?::jsonb where id=?",json.write(board),gameId);}
        db.update("update player_role set active=false where game_id=? and user_id=?",gameId,actor);
        db.update("update whisper_room set status='CLOSED' where game_id=? and (inviter_id=? or invitee_id=?)",gameId,actor,actor);
        activities.release(actor);
        if(participants(gameId).isEmpty())finish(gameId,"ABORTED");else {
            var room=db.one("select host_id from room where id=?",game.get("room_id"));if(actor.equals(Db.uuid(room,"host_id")))db.update("update room set host_id=? where id=?",db.one("select p.user_id from player_role p join room_participant rp on rp.user_id=p.user_id and rp.room_id=? where p.game_id=? and p.active=true order by rp.joined_at,p.user_id limit 1",game.get("room_id"),gameId).get("user_id"),game.get("room_id"));
            if(!"MURDER_MYSTERY".equals(Db.str(game,"game_type"))){var state=json.object(db.one("select board_state from game_session where id=?",gameId).get("board_state").toString());if(bool(state,"finished"))finish(gameId,"COMPLETED");}
            pauseIfDiscord(gameId);
        }
        changed(gameId,"PARTICIPANT_LEFT");return obj("ok",true);
    }

    @Transactional(readOnly=true)
    public Map<String,Object> history(UUID actor,int page,int size) {
        page=Math.max(page,0);size=Math.max(1,Math.min(size,100));
        var rows=db.list("select g.id,g.status,g.completed_at,s.definition->>'title' title from game_session g join player_role p on p.game_id=g.id join scenario_version s on s.id=g.scenario_version_id where p.user_id=? and g.is_test=false and g.status in ('COMPLETED','ABORTED') order by g.completed_at desc,g.id limit ? offset ?",actor,size,page*size);
        return obj("items",rows.stream().map(r->obj("gameId",r.get("id"),"title",r.get("title"),"status",r.get("status"),"completedAt",Db.instant(r,"completed_at"))).toList(),"total",Db.num(db.one("select count(*) n from game_session g join player_role p on p.game_id=g.id where p.user_id=? and g.is_test=false and g.status in ('COMPLETED','ABORTED')",actor),"n"),"page",page,"size",size);
    }

    @Scheduled(fixedDelayString="${game.tick-ms:1000}") @Transactional
    public void tick() {
        commands.lock();Instant now=Instant.now();
        for(var row:db.list("select g.id from game_session g where g.status in ('ACTIVE','PAUSED') and not exists(select 1 from player_role p where p.game_id=g.id and p.active=true and p.last_seen_at>?)",now.minusSeconds(emptyAbortSeconds))) {UUID id=Db.uuid(row,"id");finish(id,"ABORTED");changed(id,"GAME_ABANDONED");}
        for(var row:db.list("select g.id from game_session g join phase_instance p on p.id=g.current_phase_id where g.status='ACTIVE' and p.ends_at<=? order by g.id",now)) {UUID id=Db.uuid(row,"id");advance(id,now);changed(id,"PHASE_CHANGED");}
        db.update("delete from abort_vote where created_at<?",now.minusSeconds(60));
    }
    public List<UUID> participants(UUID gameId) { return db.list("select user_id from player_role where game_id=? and active=true order by user_id",gameId).stream().map(p->Db.uuid(p,"user_id")).toList(); }
    public boolean isParticipant(UUID gameId,UUID actor) { return db.optional("select 1 from player_role where game_id=? and user_id=? and active=true",gameId,actor)!=null; }
    @Transactional
    public void pauseForVoice(UUID gameId,boolean pause) {
        commands.lock();var g=db.one("select * from game_session where id=?",gameId);Instant now=Instant.now();
        if(pause&&"ACTIVE".equals(Db.str(g,"status"))) {db.update("update game_session set status='PAUSED',voice_pause=true,paused_at=? where id=?",now,gameId);changed(gameId,"VOICE_SYNC_PENDING");}
        if(!pause&&"PAUSED".equals(Db.str(g,"status"))&&Boolean.TRUE.equals(g.get("voice_pause"))) {
            if(g.get("current_phase_id")!=null){var p=currentPhase(g);long millis=Math.max(0,Duration.between(Db.instant(g,"paused_at"),now).toMillis());
            db.update("update phase_instance set ends_at=? where id=?",Db.instant(p,"ends_at").plusMillis(millis),p.get("id"));}
            db.update("update game_session set status='ACTIVE',voice_pause=false,paused_at=null where id=?",gameId);changed(gameId,"VOICE_SYNC_READY");
        }
    }

    private Map<String,Object> authorized(UUID gameId,UUID actor) { require(isParticipant(gameId,actor),403,"GAME_ACCESS_DENIED","이 게임에 접근할 권한이 없습니다.");return db.one("select * from game_session where id=?",gameId); }
    private Map<String,Object> action(UUID gameId,UUID actor,String action) {
        var g=authorized(gameId,actor);require("ACTIVE".equals(Db.str(g,"status")),409,"GAME_NOT_ACTIVE","현재 게임에서 행동할 수 없습니다.");
        if(!"MURDER_MYSTERY".equals(Db.str(g,"game_type"))){require(Set.of("CHAT","WHISPER").contains(action),409,"ACTION_NOT_ALLOWED","해당 보드게임 명령을 사용해 주세요.");return g;}
        var p=currentPhase(g);
        require(Instant.now().isBefore(Db.instant(p,"ends_at")),409,"PHASE_EXPIRED","현재 단계가 종료되었습니다. 상태를 새로 받아 주세요.");
        MysteryEngine.action(find(definition(g),"phases",Db.str(p,"definition_id")),action);return g;
    }
    private Map<String,Object> definition(Map<String,Object> g) { return scenarios.definition(Db.uuid(g,"scenario_version_id")); }
    private Map<String,Object> currentPhase(Map<String,Object> g) { return db.one("select * from phase_instance where id=?",g.get("current_phase_id")); }
    private Map<String,Object> myRoleData(UUID id,UUID actor,Map<String,Object> d) {var p=db.one("select role_id from player_role where game_id=? and user_id=?",id,actor);return MysteryEngine.role(d,Db.str(p,"role_id"));}
    private void expose(Map<String,Object> game,UUID actor) {db.update("insert into scenario_exposure(user_id,scenario_id,first_seen_at) select ?,scenario_id,? from scenario_version where id=? on conflict do nothing",actor,Instant.now(),game.get("scenario_version_id"));db.update("insert into scenario_exposure_source(user_id,version_id,source) values(?,?,?) on conflict do nothing",actor,game.get("scenario_version_id"),Boolean.TRUE.equals(game.get("is_test"))?"TEST_PLAY":"REGULAR_PLAY");}
    private int remaining(UUID gameId,UUID actor,Map<String,Object> phase,Map<String,Object> pd) {return Math.max(0,integer(pd,"investigationLimit",0)-Db.num(db.one("select count(*) n from game_investigation where game_id=? and user_id=? and phase_id=?",gameId,actor,phase.get("id")),"n"));}
    private boolean connected(Map<String,Object> p) {return Db.instant(p,"last_seen_at").isAfter(Instant.now().minusSeconds(graceSeconds));}
    private List<UUID> abortEligible(UUID gameId) {var players=db.list("select * from player_role where game_id=? and active=true",gameId);boolean absent=players.stream().anyMatch(p->Db.instant(p,"last_seen_at").isBefore(Instant.now().minusSeconds(absenceSeconds)));return players.stream().filter(p->!absent||connected(p)).map(p->Db.uuid(p,"user_id")).toList();}
    private Map<String,Object> whisper(UUID gameId,UUID id,UUID actor,boolean active) {
        require(id!=null,422,"WHISPER_REQUIRED","밀담방을 선택해 주세요.");var w=db.optional("select * from whisper_room where id=? and game_id=? and (inviter_id=? or invitee_id=?)",id,gameId,actor,actor);
        require(w!=null,403,"WHISPER_ACCESS_DENIED","이 밀담에 접근할 수 없습니다.");if(active) require("ACTIVE".equals(Db.str(w,"status")),409,"WHISPER_NOT_ACTIVE","밀담이 활성 상태가 아닙니다.");return w;
    }
    private void grant(UUID gameId,String clueId,UUID actor,boolean owned) {db.update("insert into clue_grant(game_id,clue_id,user_id,owned,created_at) values(?,?,?,?,?) on conflict(game_id,clue_id,user_id) do update set owned=clue_grant.owned or excluded.owned",gameId,clueId,actor,owned,Instant.now());}
    private long bump(UUID id) {db.update("update game_session set state_version=state_version+1 where id=?",id);return ((Number)db.one("select state_version from game_session where id=?",id).get("state_version")).longValue();}
    private void changed(UUID id,String type) {events.emit(participants(id),type,id,bump(id));}
    private void pauseIfDiscord(UUID id) {if(db.optional("select 1 from game_session g join room r on r.id=g.room_id where g.id=? and r.mode='DISCORD'",id)!=null) pauseForVoice(id,true);}
    private void openPhase(UUID id,Map<String,Object> d,int ordinal,Instant now) {
        var p=objects(d.get("phases")).get(ordinal);UUID pid=UUID.randomUUID();int duration=phaseSeconds>0?phaseSeconds:integer(p,"durationSeconds",60);
        db.update("insert into phase_instance(id,game_id,definition_id,ordinal,started_at,ends_at) values(?,?,?,?,?,?)",pid,id,str(p,"id"),ordinal,now,now.plusSeconds(duration));
        db.update("update game_session set current_phase_id=?,active_scene_id=null where id=?",pid,id);
        if("VOTE".equals(str(p,"kind"))) db.update("insert into ballot(id,game_id,phase_id) values(?,?,?)",UUID.randomUUID(),id,pid);
        rules(id,"PHASE_STARTED",str(p,"id"),"phase:"+pid);
        if("ENDING".equals(str(p,"kind"))) {var e=MysteryEngine.ending(d,facts(id,""));db.update("update game_session set ending_id=? where id=?",str(e,"id"),id);endingObservations.recordInvitedTest(id,now);}
    }
    private void advance(UUID id,Instant now) {
        var g=db.one("select * from game_session where id=? for update",id);if(!"ACTIVE".equals(Db.str(g,"status"))) return;var d=definition(g);var phase=currentPhase(g);if(phase.get("closed_at")!=null)return;
        db.update("update phase_instance set closed_at=? where id=? and closed_at is null",now,phase.get("id"));var p=find(d,"phases",Db.str(phase,"definition_id"));
        if("VOTE".equals(str(p,"kind"))) {
            var b=db.one("select * from ballot where phase_id=?",phase.get("id"));String accused=RuleConditions.accusation(db.list("select role_id from game_vote where ballot_id=?",b.get("id")).stream().map(v->(String)v.get("role_id")).toList());
            db.update("update ballot set closed_at=?,accused_role_id=? where id=?",now,accused,b.get("id"));
            db.update("update game_session set accused_role_id=?,culprit_identified=? where id=?",accused,Objects.equals(accused,str(map(d.get("ballot")),"culpritRoleId")),id);rules(id,"BALLOT_CLOSED","","ballot:"+b.get("id"));
        }
        db.update("update whisper_room set status='CLOSED' where game_id=? and status<>'CLOSED'",id);
        int next=Db.num(phase,"ordinal")+1;
        if(next>=objects(d.get("phases")).size()) finish(id,"COMPLETED"); else {openPhase(id,d,next,now);pauseIfDiscord(id);}
    }
    private void finish(UUID id,String status) {
        db.update("update game_session set status=?,completed_at=?,voice_pause=false,paused_at=null,board_state=case when game_type<>'MURDER_MYSTERY' then board_state||jsonb_build_object('finished',true,'aborted',?::boolean) else board_state end where id=? and status in ('ACTIVE','PAUSED')",status,Instant.now(),status.equals("ABORTED"),id);
        db.update("update phase_instance set closed_at=coalesce(closed_at,?) where game_id=?",Instant.now(),id);
        db.update("update whisper_room set status='CLOSED' where game_id=?",id);db.update("update room set status='CLOSED' where game_id=?",id);
        for(UUID uid:participants(id)) {var a=db.one("select * from player_activity where user_id=?",uid);if("GAME".equals(Db.str(a,"kind"))&&id.equals(Db.uuid(a,"reference_id")))activities.release(uid);}
    }
    public void completeBoard(UUID id){var g=db.one("select game_type from game_session where id=?",id);require(!"MURDER_MYSTERY".equals(Db.str(g,"game_type")),409,"NOT_BOARD_GAME","보드게임에서 사용할 수 있습니다.");finish(id,"COMPLETED");}
    private void requireMystery(Map<String,Object> game){require("MURDER_MYSTERY".equals(Db.str(game,"game_type")),409,"NOT_MYSTERY_GAME","머더미스터리에서 사용할 수 있습니다.");}
    private RuleConditions.Facts facts(UUID id,String ownRole) {
        var g=db.one("select * from game_session where id=?",id);Set<String> pub=new HashSet<>();for(var c:db.list("select clue_id from public_clue where game_id=?",id))pub.add(Db.str(c,"clue_id"));
        Map<String,Set<String>> roleClues=new HashMap<>();for(var p:db.list("select role_id from player_role where game_id=?",id))roleClues.put(Db.str(p,"role_id"),new HashSet<>(pub));
        for(var c:db.list("select p.role_id,c.clue_id from clue_grant c join player_role p on p.game_id=c.game_id and p.user_id=c.user_id where c.game_id=?",id))roleClues.computeIfAbsent(Db.str(c,"role_id"),x->new HashSet<>()).add(Db.str(c,"clue_id"));
        return new RuleConditions.Facts(Boolean.TRUE.equals(g.get("culprit_identified")),pub,roleClues,json.object(String.valueOf(g.get("flags"))),ownRole);
    }
    private void rules(UUID id,String when,String reference,String cause) {
        var d=definition(db.one("select * from game_session where id=?",id));
        MysteryEngine.rules(d,when,reference,cause,()->facts(id,""),(rule,why)->db.update("insert into rule_execution(game_id,rule_id,cause) values(?,?,?) on conflict do nothing",id,rule,why)>0,effect->{
                switch(str(effect,"type")) {
                    case "GRANT_CLUE" -> {var player=db.one("select user_id from player_role where game_id=? and role_id=?",id,str(effect,"roleId"));grant(id,str(effect,"clueId"),Db.uuid(player,"user_id"),true);}
                    case "PUBLISH_MATERIAL" -> db.update("insert into game_material(id,game_id,text,created_at) values(?,?,?,?)",UUID.randomUUID(),id,str(effect,"text"),Instant.now());
                    case "SET_FLAG" -> {var flags=new LinkedHashMap<>(facts(id,"").flags());flags.put(str(effect,"flag"),effect.get("value"));db.update("update game_session set flags=?::jsonb where id=?",json.write(flags),id);}
                    default -> throw new ApiException(422,"INVALID_RULE","허용되지 않는 작품 규칙입니다.");
                }
        });
    }
    private void require(boolean condition,int status,String code,String message) {if(!condition)throw new ApiException(status,code,message);}
}
