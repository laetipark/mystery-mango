package com.mysterymango.voice;

import com.mysterymango.auth.Actor;
import com.mysterymango.common.*;
import com.mysterymango.game.GameService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class DiscordController {
    private final DiscordAccountService accounts;
    private final Db db;
    private final Commands commands;
    private final GameService games;
    private final VoiceSettings settings;
    private final VoiceAccess access;
    public DiscordController(DiscordAccountService accounts,Db db,Commands commands,GameService games,VoiceSettings settings,VoiceAccess access) {
        this.accounts=accounts;this.db=db;this.commands=commands;this.games=games;this.settings=settings;this.access=access;
    }
    @GetMapping("/me/discord") public Map<String,Object> account() { return accounts.state(Actor.id()); }
    @PostMapping("/me/discord/link") public Map<String,Object> link(HttpSession session) { return accounts.link(Actor.id(),session); }
    @GetMapping("/me/discord/callback") public void callback(@RequestParam(required=false) String code,@RequestParam(required=false) String state,HttpSession session,HttpServletResponse response) throws IOException {
        accounts.callback(Actor.id(),code,state,session);
        response.sendRedirect("/account?discord=linked");
    }
    @DeleteMapping("/me/discord") public Map<String,Object> unlink(@RequestHeader("Idempotency-Key") String key) { return accounts.unlink(Actor.id(),key); }

    @GetMapping("/games/{gameId}/voice-state") public Map<String,Object> voice(@PathVariable UUID gameId) {
        UUID actor=Actor.id();requireParticipant(gameId,actor);
        Map<String,Object> game=db.one("select g.*,r.mode from game_session g join room r on r.id=g.room_id where g.id=?",gameId);
        Map<String,Object> state=db.optional("select * from discord_voice_session where game_id=?",gameId);
        String status=!"DISCORD".equals(Db.str(game,"mode")) || !settings.configured()?"DISABLED":state==null?"PENDING":Db.str(state,"status");
        boolean ended=Set.of("COMPLETED","ABORTED").contains(Db.str(game,"status"));
        if(!"DISABLED".equals(status) && !"CLEANED".equals(status)) {
            if(!access.ready())status="ERROR";
            else if("READY".equals(status) && (Boolean.TRUE.equals(game.get("voice_pause")) || ended))status="PENDING";
        }
        Map<String,Object> member=db.optional("select m.*,c.kind from discord_voice_member m left join discord_voice_channel c on c.channel_id=m.channel_id and c.closed_at is null where m.game_id=? and m.user_id=?",gameId,actor);
        String channel=member==null?null:Db.str(member,"channel_id");
        String url="READY".equals(status) && channel!=null?"https://discord.com/channels/"+settings.guildId()+"/"+channel:null;
        Map<String,Object> result=new LinkedHashMap<>();
        result.put("provider",settings.provider());result.put("configured",settings.configured());result.put("status",status);
        result.put("connected","READY".equals(status) && member!=null && Boolean.TRUE.equals(member.get("connected")));
        result.put("channelUrl",url);result.put("channelKind",url==null?null:member.get("kind"));
        result.put("message",switch(status) {
            case "DISABLED" -> "DISCORD".equals(Db.str(game,"mode"))?"이 게임의 Discord 음성 설정을 복구해야 합니다.":"음성은 미설정입니다. 텍스트로 플레이할 수 있습니다.";
            case "READY" -> "처음에는 Discord에서 직접 입장해 주세요. 마이크와 기기는 Discord에서 설정합니다.";
            case "CLEANED" -> "게임 음성 채널 정리가 완료되었습니다.";
            case "ERROR" -> "Discord 권한·연결 확인이 필요합니다. 동기화 상태를 다시 확인해 주세요.";
            default -> ended?"게임의 음성 채널을 정리하고 있습니다.":"음성 채널 권한과 이동을 동기화하고 있습니다.";
        });return result;
    }
    @PostMapping("/games/{gameId}/voice-join") public Map<String,Object> join(@PathVariable UUID gameId,@RequestHeader("Idempotency-Key") String key) {
        UUID actor=Actor.id();
        return commands.run(actor,key,"voice.join",Map.of("gameId",gameId),()->{
            requireParticipant(gameId,actor);
            var game=db.one("select g.status,r.mode from game_session g join room r on r.id=g.room_id where g.id=?",gameId);
            if(!Set.of("ACTIVE","PAUSED").contains(Db.str(game,"status")))throw new ApiException(409,"GAME_ENDED","종료된 게임의 음성 채널에 참가할 수 없습니다.");
            if(!"DISCORD".equals(Db.str(game,"mode")))throw new ApiException(409,"TEXT_GAME","텍스트 게임입니다.");
            access.requireEligible(actor,"DISCORD");
            db.update("insert into discord_voice_member(game_id,user_id,join_requested) values(?,?,true) on conflict(game_id,user_id) do update set join_requested=true",gameId,actor);
            db.update("insert into discord_voice_session(game_id,status) values(?,'PENDING') on conflict(game_id) do update set status='PENDING',retry_at=now(),updated_at=now()",gameId);
            games.pauseForVoice(gameId,true);
            return Map.of("requested",true);
        },result->requireParticipant(gameId,actor));
    }
    private void requireParticipant(UUID gameId,UUID userId) {if(!games.isParticipant(gameId,userId))throw new ApiException(403,"GAME_ACCESS_DENIED","이 게임의 참가자가 아닙니다.");}
}
