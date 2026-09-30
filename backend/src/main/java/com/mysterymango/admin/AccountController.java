package com.mysterymango.admin;
import com.mysterymango.auth.Actor;
import com.mysterymango.common.*;
import com.mysterymango.voice.VoiceAccess;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import static com.mysterymango.common.Json.map;
@RestController @RequestMapping("/api/v1")
public class AccountController {
    private final Db db;private final Commands commands;private final VoiceAccess voice;
    public AccountController(Db db,Commands commands,VoiceAccess voice){this.db=db;this.commands=commands;this.voice=voice;}
    public record Block(UUID userId){}
    public record Report(UUID targetUserId,UUID gameId,UUID messageId,String reason){}
    @GetMapping("/meta") public Map<String,Object> meta(){return map("voiceProvider",voice.provider(),"voiceConfigured",voice.configured());}
    @GetMapping("/me/activity") public Map<String,Object> activity(){var a=db.one("select kind,reference_id from player_activity where user_id=?",Actor.id());return map("kind",a.get("kind"),"referenceId",a.get("reference_id"));}
    @GetMapping("/me/blocks") public Map<String,Object> blocks(){return map("items",db.list("select u.id,u.display_name from user_block b join app_user u on u.id=b.blocked_id where b.user_id=? order by b.created_at",Actor.id()).stream().map(r->map("userId",r.get("id"),"displayName",r.get("display_name"))).toList());}
    @PostMapping("/me/blocks") public Map<String,Object> block(@RequestHeader("Idempotency-Key")String key,@RequestBody Block r){return commands.run(Actor.id(),key,"block.create",r,()->{if(r.userId()==null||r.userId().equals(Actor.id()))throw new ApiException(400,"INVALID_BLOCK","차단할 사용자를 확인해 주세요.");db.one("select id from app_user where id=?",r.userId());db.update("insert into user_block(user_id,blocked_id) values(?,?) on conflict do nothing",Actor.id(),r.userId());return map("ok",true);});}
    @DeleteMapping("/me/blocks/{id}") public Map<String,Object> unblock(@PathVariable UUID id,@RequestHeader("Idempotency-Key")String key){return commands.run(Actor.id(),key,"block.remove:"+id,Map.of(),()->{db.update("delete from user_block where user_id=? and blocked_id=?",Actor.id(),id);return map("ok",true);});}
    @PostMapping("/reports") public Map<String,Object> report(@RequestHeader("Idempotency-Key")String key,@RequestBody Report r){return commands.run(Actor.id(),key,"report.create",r,()->{
        if(r.reason()==null||r.reason().isBlank()||r.reason().length()>2000)throw new ApiException(400,"INVALID_REPORT","신고 사유를 1~2000자로 입력해 주세요.");
        if(r.gameId()!=null&&db.optional("select 1 from player_role where game_id=? and user_id=?",r.gameId(),Actor.id())==null)throw new ApiException(403,"FORBIDDEN","참가한 게임만 신고할 수 있습니다.");
        UUID id=UUID.randomUUID();db.update("insert into report(id,reporter_id,target_user_id,game_id,message_id,reason) values(?,?,?,?,?,?)",id,Actor.id(),r.targetUserId(),r.gameId(),r.messageId(),r.reason().strip());return map("reportId",id);
    });}
}

