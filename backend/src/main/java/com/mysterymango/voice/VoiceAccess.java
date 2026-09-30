package com.mysterymango.voice;

import com.mysterymango.common.ApiException;
import com.mysterymango.common.Db;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class VoiceAccess {
    private final Db db;
    private final VoiceSettings settings;
    private final VoiceProvider provider;
    public VoiceAccess(Db db, VoiceSettings settings, VoiceProvider provider) { this.db=db; this.settings=settings; this.provider=provider; }
    public boolean configured() { return settings.configured(); }
    public boolean ready() { return settings.configured() && provider.ready(); }
    public String provider() { return settings.provider(); }
    /** Local/DB check only: safe inside the application's serialized command transaction. */
    public void requireEligible(UUID userId, String mode) {
        if ("TEXT".equals(mode)) return;
        if (!"DISCORD".equals(mode)) throw new ApiException(400,"INVALID_MODE","지원하지 않는 대화 방식입니다.");
        if (!settings.configured() || !provider.ready()) throw new ApiException(503,"VOICE_NOT_CONFIGURED","Discord 음성이 미설정이거나 연결되지 않았습니다.");
        Map<String,Object> account = db.optional("select * from discord_account where user_id=?",userId);
        if (account==null) throw new ApiException(409,"DISCORD_LINK_REQUIRED","마이페이지에서 Discord 계정을 연결해 주세요.");
        Instant verified=Db.instant(account,"verified_at");
        if (!Boolean.TRUE.equals(account.get("eligible")) || verified==null || verified.isBefore(Instant.now().minusSeconds(120)))
            throw new ApiException(409,"DISCORD_NOT_ELIGIBLE","Discord 서버 참가와 일반 참가자 권한을 마이페이지에서 확인해 주세요.");
    }
    void requireCanUnlink(UUID userId) {
        Map<String,Object> activity=db.optional("select kind from player_activity where user_id=?",userId);
        if (activity!=null && !"IDLE".equals(Db.str(activity,"kind")))
            throw new ApiException(409,"DISCORD_ACTIVE_ACTIVITY","대기열·방·게임에서 나간 뒤 계정 연결을 변경할 수 있습니다.");
        if (db.optional("select s.game_id from discord_voice_session s join player_role p on p.game_id=s.game_id where p.user_id=? and s.status<>'CLEANED' limit 1",userId)!=null)
            throw new ApiException(409,"DISCORD_CLEANUP_PENDING","기존 음성 채널 정리가 끝난 뒤 연결을 해제할 수 있습니다.");
    }
}
