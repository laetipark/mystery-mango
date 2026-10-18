package com.mysterymango.room;
import com.mysterymango.auth.Actor;
import com.mysterymango.common.*;
import com.mysterymango.game.GameService;
import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController @RequestMapping("/api/v1/rooms")
public class RoomController {
    private final RoomService rooms;private final Commands commands;private final GameService games;
    public RoomController(RoomService rooms,Commands commands,GameService games){this.rooms=rooms;this.commands=commands;this.games=games;}
    public record Create(UUID scenarioVersionId,String visibility,String mode,String inviteToken,Integer capacity){public Create(UUID scenarioVersionId,String visibility,String mode,String inviteToken){this(scenarioVersionId,visibility,mode,inviteToken,null);}}
    public record Join(String inviteToken){}
    public record Invite(String inviteToken){}
    public record Ready(boolean ready){}
    @GetMapping public Map<String,Object> list(@RequestParam(defaultValue="0")int page,@RequestParam(defaultValue="20")int size,@RequestParam(required=false)UUID scenarioId){return rooms.list(page,size,scenarioId);}
    @PostMapping public Map<String,Object> create(@RequestHeader("Idempotency-Key")String key,@RequestBody Create req){return commands.run(Actor.id(),key,"room.create",req,()->rooms.create(Actor.id(),req.scenarioVersionId(),req.visibility(),req.mode(),req.inviteToken(),req.capacity()),result->{UUID id=UUID.fromString(result.get("roomId").toString());if("INVITE".equals(req.visibility()))rooms.authorizeInviteResponse(id,Actor.id(),req.inviteToken());else rooms.requireMember(id,Actor.id());});}
    @GetMapping("/{id}") public Map<String,Object> snapshot(@PathVariable UUID id){return rooms.snapshot(id,Actor.id());}
    @PostMapping("/{id}/join") public Map<String,Object> join(@PathVariable UUID id,@RequestHeader("Idempotency-Key")String key,@RequestBody(required=false)Join req){return commands.run(Actor.id(),key,"room.join:"+id,req,()->rooms.join(id,Actor.id(),req==null?null:req.inviteToken()),result->rooms.requireMember(id,Actor.id()));}
    @PutMapping("/{id}/ready") public Map<String,Object> ready(@PathVariable UUID id,@RequestHeader("Idempotency-Key")String key,@RequestBody Ready req){return commands.run(Actor.id(),key,"room.ready:"+id,req,()->rooms.ready(id,Actor.id(),req.ready()),result->rooms.requireMember(id,Actor.id()));}
    @PostMapping("/{id}/leave") public Map<String,Object> leave(@PathVariable UUID id,@RequestHeader("Idempotency-Key")String key){return commands.run(Actor.id(),key,"room.leave:"+id,Map.of(),()->rooms.leave(id,Actor.id()));}
    @PostMapping("/{id}/start") public Map<String,Object> start(@PathVariable UUID id,@RequestHeader("Idempotency-Key")String key){return commands.run(Actor.id(),key,"room.start:"+id,Map.of(),()->games.start(id,Actor.id()),result->{rooms.requireMember(id,Actor.id());if(!games.isParticipant(UUID.fromString(result.get("gameId").toString()),Actor.id()))throw new ApiException(403,"GAME_ACCESS_DENIED","이 게임에 접근할 권한이 없습니다.");});}
    @PostMapping("/{id}/invite") public Map<String,Object> invite(@PathVariable UUID id,@RequestHeader("Idempotency-Key")String key,@RequestBody Invite req){return commands.run(Actor.id(),key,"room.invite:"+id,req,()->rooms.invite(id,Actor.id(),req.inviteToken()),result->rooms.authorizeInviteResponse(id,Actor.id(),req.inviteToken()));}
    @DeleteMapping("/{id}/invite") public Map<String,Object> revoke(@PathVariable UUID id,@RequestHeader("Idempotency-Key")String key){return commands.run(Actor.id(),key,"room.invite.revoke:"+id,Map.of(),()->rooms.revokeInvite(id,Actor.id()),result->rooms.requireHost(id,Actor.id()));}
    @PostMapping("/{id}/heartbeat") public Map<String,Object> heartbeat(@PathVariable UUID id){return commands.transaction(()->{rooms.heartbeat(id,Actor.id());return Map.of("ok",true);});}
}
