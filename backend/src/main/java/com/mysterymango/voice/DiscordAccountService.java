package com.mysterymango.voice;

import com.mysterymango.common.*;
import jakarta.servlet.http.HttpSession;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class DiscordAccountService {
    static final String STATE="discord.link.state", ACTOR="discord.link.actor", EXPIRES="discord.link.expires";
    private final Db db;
    private final Commands commands;
    private final TransactionTemplate tx;
    private final VoiceSettings settings;
    private final VoiceProvider provider;
    private final VoiceAccess access;
    private final DiscordOAuthClient oauth;
    public DiscordAccountService(Db db,Commands commands,PlatformTransactionManager manager,VoiceSettings settings,VoiceProvider provider,VoiceAccess access,DiscordOAuthClient oauth) {
        this.db=db;this.commands=commands;this.tx=new TransactionTemplate(manager);this.settings=settings;this.provider=provider;this.access=access;this.oauth=oauth;
    }
    public Map<String,Object> state(UUID userId) {
        Map<String,Object> account=db.optional("select * from discord_account where user_id=?",userId);
        if (account!=null && settings.configured()) {
            Instant checked=Db.instant(account,"verified_at");
            if (checked==null || checked.isBefore(Instant.now().minusSeconds(30))) {
                refresh(userId,Db.str(account,"discord_user_id"));
                account=db.optional("select * from discord_account where user_id=?",userId);
            }
        }
        Map<String,Object> out=new LinkedHashMap<>();
        out.put("provider",settings.provider());out.put("configured",settings.configured());out.put("botReady",provider.ready());
        out.put("linked",account!=null);out.put("discordUserId",account==null?null:account.get("discord_user_id"));
        out.put("displayName",account==null?null:account.get("display_name"));
        out.put("eligible",account!=null && Boolean.TRUE.equals(account.get("eligible")) && provider.ready());
        out.put("reason",account==null?"NOT_LINKED":account.get("eligibility_reason"));return out;
    }
    public Map<String,Object> link(UUID userId,HttpSession session) {
        if (!settings.configured()) throw new ApiException(503,"VOICE_NOT_CONFIGURED","Discord 연동이 미설정입니다.");
        access.requireCanUnlink(userId);
        byte[] bytes=new byte[32];new SecureRandom().nextBytes(bytes);
        String nonce=Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        session.setAttribute(STATE,nonce);session.setAttribute(ACTOR,userId.toString());session.setAttribute(EXPIRES,Instant.now().plusSeconds(600).getEpochSecond());
        return Map.of("authorizeUrl","https://discord.com/oauth2/authorize?response_type=code&scope=identify&client_id="
                +DiscordOAuthClient.encode(settings.clientId())+"&redirect_uri="+DiscordOAuthClient.encode(settings.redirectUri())+"&state="+nonce);
    }
    static void consumeState(UUID actor,String supplied,HttpSession session) {
        synchronized(session) {
            Object expected=session.getAttribute(STATE), expectedActor=session.getAttribute(ACTOR),expires=session.getAttribute(EXPIRES);
            session.removeAttribute(STATE);session.removeAttribute(ACTOR);session.removeAttribute(EXPIRES);
            boolean valid=expected instanceof String && supplied!=null && expectedActor!=null && expectedActor.equals(actor.toString())
                    && expires instanceof Number && ((Number)expires).longValue()>Instant.now().getEpochSecond()
                    && MessageDigest.isEqual(((String)expected).getBytes(StandardCharsets.UTF_8),supplied.getBytes(StandardCharsets.UTF_8));
            if (!valid) throw new ApiException(400,"DISCORD_INVALID_STATE","Discord 연결 요청이 만료되었거나 일치하지 않습니다.");
        }
    }
    public void callback(UUID actor,String code,String state,HttpSession session) {
        consumeState(actor,state,session);
        if (code==null || code.isBlank()) throw new ApiException(400,"DISCORD_AUTH_CANCELLED","Discord 연결이 취소되었습니다.");
        DiscordOAuthClient.Identity identity=oauth.exchange(code);
        VoiceProvider.MemberEligibility member=provider.eligibility(identity.id());
        try {
            tx.executeWithoutResult(status->{commands.lock();access.requireCanUnlink(actor);
                db.update("insert into discord_account(user_id,discord_user_id,display_name,eligible,eligibility_reason,verified_at) values(?,?,?,?,?,now()) on conflict(user_id) do update set discord_user_id=excluded.discord_user_id,display_name=excluded.display_name,eligible=excluded.eligible,eligibility_reason=excluded.eligibility_reason,verified_at=now(),linked_at=now()",
                        actor,identity.id(),identity.displayName(),member.eligible(),member.reason());});
        } catch (DataIntegrityViolationException ex) { throw new ApiException(409,"DISCORD_ALREADY_LINKED","이미 다른 서비스 계정에 연결된 Discord 계정입니다."); }
    }
    public void refresh(UUID actor,String discordId) {
        VoiceProvider.MemberEligibility member;
        try { member=provider.eligibility(discordId); }
        catch (RuntimeException ex) { member=new VoiceProvider.MemberEligibility(false,"BOT_UNAVAILABLE"); }
        VoiceProvider.MemberEligibility result=member;
        tx.executeWithoutResult(status->{commands.lock();db.update("update discord_account set eligible=?,eligibility_reason=?,verified_at=now() where user_id=? and discord_user_id=?",result.eligible(),result.reason(),actor,discordId);});
    }
    public Map<String,Object> unlink(UUID actor,String key) {
        return commands.run(actor,key,"discord.unlink",Map.of(),()->{access.requireCanUnlink(actor);db.update("delete from discord_account where user_id=?",actor);return Map.of("unlinked",true);});
    }
}
