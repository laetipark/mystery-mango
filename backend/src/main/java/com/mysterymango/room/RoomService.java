package com.mysterymango.room;
import com.mysterymango.common.*;
import com.mysterymango.scenario.ScenarioService;
import com.mysterymango.voice.VoiceAccess;
import org.springframework.stereotype.Service;
import java.util.*;
import java.time.Instant;
import static com.mysterymango.common.Json.map;
@Service
public class RoomService {
    private final Db db;private final Activities activities;private final ScenarioService scenarios;private final Events events;private final VoiceAccess voice;
    public RoomService(Db db,Activities activities,ScenarioService scenarios,Events events,VoiceAccess voice){this.db=db;this.activities=activities;this.scenarios=scenarios;this.events=events;this.voice=voice;}
    public Map<String,Object> create(UUID user,UUID version,String visibility,String mode){
        return create(user,version,visibility,mode,null);
    }
    public Map<String,Object> create(UUID user,UUID version,String visibility,String mode,String inviteToken){
        if(version==null||visibility==null||mode==null||!Set.of("PUBLIC","INVITE").contains(visibility)||!Set.of("TEXT","DISCORD").contains(mode))throw new ApiException(400,"INVALID_ROOM","방 설정을 확인해 주세요.");
        activities.requireIdle(user);
        if("INVITE".equals(visibility))inviteTokenHash(inviteToken);
        var scenario=scenarios.publicVersion(version);if(!((List<?>)scenario.get("modes")).contains(mode))throw new ApiException(400,"MODE_UNSUPPORTED","이 작품에서 지원하지 않는 모드입니다.");voice.requireEligible(user,mode);
        UUID id=UUID.randomUUID();db.update("insert into room(id,scenario_version_id,host_id,visibility,mode) values(?,?,?,?,?)",id,version,user,visibility,mode);
        db.update("insert into room_participant(room_id,user_id) values(?,?)",id,user);activities.set(user,"ROOM",id);
        var response=map("roomId",id);if(visibility.equals("INVITE"))response.put("expiresAt",invite(id,user,inviteToken).get("expiresAt"));return response;
    }
    public Map<String,Object> snapshot(UUID id,UUID user){
        var room=db.one("select * from room where id=?",id);requireMember(id,user);var s=scenarios.publicVersion(Db.uuid(room,"scenario_version_id"));
        var members=db.list("select p.*,u.display_name from room_participant p join app_user u on u.id=p.user_id where room_id=? order by joined_at,user_id",id).stream().map(p->map("userId",p.get("user_id"),"displayName",p.get("display_name"),"ready",p.get("ready"),"connected",Db.instant(p,"last_seen_at").isAfter(Instant.now().minusSeconds(120)))).toList();
        return map("id",id,"title",s.get("title"),"scenarioVersionId",room.get("scenario_version_id"),"hostId",room.get("host_id"),"visibility",room.get("visibility"),"mode",room.get("mode"),"status",room.get("status"),"gameId",room.get("game_id"),"capacity",s.get("playerCount"),"participants",members,"rules","정확히 4명이 준비하면 방장이 시작합니다. 비밀 자료를 외부에 공유하지 마세요.");
    }
    public Map<String,Object> list(int page,int size,UUID scenarioId){
        page=Math.max(0,page);size=Math.clamp(size,1,50);
        var rows=db.list("select r.*,u.display_name,(select count(*) from room_participant p where p.room_id=r.id) as n from room r join app_user u on u.id=r.host_id join scenario_version v on v.id=r.scenario_version_id where r.visibility='PUBLIC' and r.status='WAITING' and (?::uuid is null or v.scenario_id=?::uuid) order by r.created_at desc limit ? offset ?",scenarioId,scenarioId,size,page*size);
        var result=rows.stream().map(r->{var s=scenarios.publicVersion(Db.uuid(r,"scenario_version_id"));return map("id",r.get("id"),"title",s.get("title"),"scenarioVersionId",r.get("scenario_version_id"),"hostName",r.get("display_name"),"count",r.get("n"),"capacity",s.get("playerCount"),"mode",r.get("mode"));}).toList();
        var total=db.one("select count(*) as n from room r join scenario_version v on v.id=r.scenario_version_id where r.visibility='PUBLIC' and r.status='WAITING' and (?::uuid is null or v.scenario_id=?::uuid)",scenarioId,scenarioId).get("n");
        return map("items",result,"total",total,"page",page,"size",size);
    }
    public Map<String,Object> join(UUID id,UUID user,String token){
        var r=waiting(id);if(db.optional("select 1 from room_participant where room_id=? and user_id=?",id,user)!=null)return map("roomId",id);
        activities.requireIdle(user);voice.requireEligible(user,Db.str(r,"mode"));
        if("INVITE".equals(r.get("visibility"))){
            String hash;try{hash=inviteTokenHash(token);}catch(ApiException ex){throw new ApiException(403,"INVALID_INVITE","초대 링크가 만료되었거나 올바르지 않습니다.");}
            if(r.get("invite_hash")==null||!hash.equals(r.get("invite_hash"))||r.get("invite_expires_at")==null||!Db.instant(r,"invite_expires_at").isAfter(Instant.now()))throw new ApiException(403,"INVALID_INVITE","초대 링크가 만료되었거나 올바르지 않습니다.");
        }
        if(db.optional("select 1 from room_participant p join user_block b on (b.user_id=p.user_id and b.blocked_id=?) or (b.blocked_id=p.user_id and b.user_id=?) where p.room_id=?",user,user,id)!=null)throw new ApiException(409,"BLOCKED_PARTICIPANT","차단 관계가 있는 참가자가 있어 입장할 수 없습니다.");
        var s=scenarios.publicVersion(Db.uuid(r,"scenario_version_id"));if(Db.num(db.one("select count(*) as n from room_participant where room_id=?",id),"n")>=((Number)s.get("playerCount")).intValue())throw new ApiException(409,"ROOM_FULL","모집 인원이 가득 찼습니다.");
        db.update("insert into room_participant(room_id,user_id) values(?,?)",id,user);activities.set(user,"ROOM",id);notifyRoom(id);return map("roomId",id);
    }
    public Map<String,Object> ready(UUID id,UUID user,boolean ready){waiting(id);requireMember(id,user);db.update("update room_participant set ready=?,last_seen_at=now() where room_id=? and user_id=?",ready,id,user);notifyRoom(id);return map("ok",true);}
    public Map<String,Object> leave(UUID id,UUID user){var r=waiting(id);requireMember(id,user);db.update("delete from room_participant where room_id=? and user_id=?",id,user);activities.release(user);var next=db.optional("select user_id from room_participant where room_id=? order by joined_at,user_id limit 1",id);if(next==null)db.update("update room set status='CLOSED',invite_hash=null where id=?",id);else if(user.equals(r.get("host_id")))db.update("update room set host_id=? where id=?",next.get("user_id"),id);notifyRoom(id);return map("ok",true);}
    public Map<String,Object> invite(UUID id,UUID user,String token){var r=waiting(id);requireHost(id,user);String hash=inviteTokenHash(token);if(hash.equals(r.get("invite_hash")))throw new ApiException(409,"INVITE_TOKEN_REUSED","새 초대 링크에는 새로운 토큰이 필요합니다.");Instant end=Instant.now().plusSeconds(86400);db.update("update room set invite_hash=?,invite_expires_at=? where id=?",hash,java.sql.Timestamp.from(end),id);return map("roomId",id,"expiresAt",end);}
    public Map<String,Object> revokeInvite(UUID id,UUID user){var r=waiting(id);if(!user.equals(r.get("host_id")))throw new ApiException(403,"HOST_REQUIRED","방장 권한이 필요합니다.");db.update("update room set invite_hash=null,invite_expires_at=null where id=?",id);return map("ok",true);}
    public void heartbeat(UUID id,UUID user){requireMember(id,user);db.update("update room_participant set last_seen_at=now() where room_id=? and user_id=?",id,user);}
    public void requireMember(UUID id,UUID user){if(db.optional("select 1 from room_participant where room_id=? and user_id=?",id,user)==null)throw new ApiException(403,"ROOM_MEMBERSHIP_REQUIRED","이 방의 참가자가 아닙니다.");}
    public void requireHost(UUID id,UUID user){requireMember(id,user);if(!user.equals(db.one("select host_id from room where id=?",id).get("host_id")))throw new ApiException(403,"HOST_REQUIRED","방장만 초대를 관리할 수 있습니다.");}
    /** The caller already has the token; acknowledgements never disclose or persist it. */
    public void authorizeInviteResponse(UUID id,UUID user,String token){
        requireHost(id,user);var r=waiting(id);String hash=inviteTokenHash(token);
        if(!hash.equals(r.get("invite_hash"))||r.get("invite_expires_at")==null||!Db.instant(r,"invite_expires_at").isAfter(Instant.now()))throw new ApiException(409,"INVITE_NO_LONGER_VALID","이 초대 링크는 만료되거나 폐기되었습니다. 새 링크를 만들어 주세요.");
    }
    private String inviteTokenHash(String token){
        try{if(token==null||!token.matches("[A-Za-z0-9_-]{43}"))throw new IllegalArgumentException();byte[] bytes=Base64.getUrlDecoder().decode(token);if(bytes.length!=32||!Base64.getUrlEncoder().withoutPadding().encodeToString(bytes).equals(token))throw new IllegalArgumentException();return Commands.hash(token);}
        catch(IllegalArgumentException ex){throw new ApiException(422,"INVALID_INVITE_TOKEN","초대 토큰은 안전하게 생성한 32바이트 base64url 값이어야 합니다.");}
    }
    private Map<String,Object> waiting(UUID id){var r=db.one("select * from room where id=? for update",id);if(!"WAITING".equals(r.get("status")))throw new ApiException(409,"ROOM_NOT_WAITING","대기 중인 방에서만 가능합니다.");return r;}
    private void notifyRoom(UUID id){events.emit(db.list("select user_id from room_participant where room_id=?",id).stream().map(r->Db.uuid(r,"user_id")).toList(),"ROOM_CHANGED",null,0);}
}
