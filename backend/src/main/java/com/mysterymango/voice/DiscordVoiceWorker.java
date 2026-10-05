package com.mysterymango.voice;

import com.mysterymango.common.*;
import com.mysterymango.game.GameService;
import jakarta.annotation.PreDestroy;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@Component
public class DiscordVoiceWorker {
    private final Db db;
    private final Commands commands;
    private final GameService games;
    private final VoiceSettings settings;
    private final VoiceProvider provider;
    private final DiscordAccountService accounts;
    private final TransactionTemplate tx;
    private final ExecutorService executor=Executors.newSingleThreadExecutor(Thread.ofPlatform().name("discord-reconcile").daemon(true).factory());
    private final AtomicBoolean running=new AtomicBoolean();
    public DiscordVoiceWorker(Db db,Commands commands,GameService games,VoiceSettings settings,VoiceProvider provider,DiscordAccountService accounts,PlatformTransactionManager manager) {
        this.db=db;this.commands=commands;this.games=games;this.settings=settings;this.provider=provider;this.accounts=accounts;this.tx=new TransactionTemplate(manager);
    }
    @PreDestroy public void stop() { executor.shutdownNow(); }

    @Scheduled(fixedDelay=2500,initialDelay=4000)
    public void tick() {
        if (!running.compareAndSet(false,true)) return;
        executor.submit(()->{try { sweep(); } finally {running.set(false);} });
    }

    void sweep() {
        // Restart recovery is derived from committed game state, never from the browser.
        List<Map<String,Object>> candidates=db.list("select g.id from game_session g join room r on r.id=g.room_id left join discord_voice_session v on v.game_id=g.id where r.mode='DISCORD' and (g.status in ('ACTIVE','PAUSED') or (v.game_id is not null and v.status<>'CLEANED')) and (v.retry_at is null or v.retry_at<=now()) order by g.created_at limit 12");
        for (Map<String,Object> candidate:candidates) {
            UUID gameId=Db.uuid(candidate,"id");
            try { synchronize(gameId); }
            catch (RuntimeException ex) { fail(gameId,ex); }
        }
        if(settings.configured() && provider.ready()) {
            for(var account:db.list("select a.user_id,a.discord_user_id from discord_account a join player_activity p on p.user_id=a.user_id where p.kind<>'IDLE' and (a.verified_at is null or a.verified_at<now()-interval '30 seconds') order by a.verified_at nulls first limit 8"))
                accounts.refresh(Db.uuid(account,"user_id"),Db.str(account,"discord_user_id"));
        }
    }

    private record Plan(UUID gameId,String hash,boolean terminal,Map<UUID,String> users,Map<String,Set<String>> rooms,Set<String> requested) {}
    private Plan readPlan(UUID gameId) {
        Map<String,Object> game=db.one("select * from game_session where id=?",gameId);
        boolean terminal=Set.of("COMPLETED","ABORTED").contains(Db.str(game,"status"));
        Map<UUID,String> users=new LinkedHashMap<>();
        Map<String,Set<String>> rooms=new TreeMap<>();
        String main="mm-"+gameId+"-main";
        if (!terminal) rooms.put(main,new TreeSet<>());
        for (Map<String,Object> row:db.list("select p.user_id,p.active,a.discord_user_id from player_role p left join discord_account a on a.user_id=p.user_id where p.game_id=? order by p.user_id",gameId)) {
            UUID id=Db.uuid(row,"user_id");String discord=Db.str(row,"discord_user_id");
            if (discord!=null) users.put(id,discord);
            if (!terminal && Boolean.TRUE.equals(row.get("active"))) {
                if (discord==null) throw new ApiException(409,"DISCORD_LINK_REQUIRED","Discord 계정을 확인해야 합니다.");
                rooms.get(main).add(discord);
            }
        }
        if (!terminal) {
            for (Map<String,Object> whisper:db.list("select id,inviter_id,invitee_id from whisper_room where game_id=? and status='ACTIVE' order by id",gameId)) {
                String first=users.get(Db.uuid(whisper,"inviter_id")),second=users.get(Db.uuid(whisper,"invitee_id"));
                if (first==null || second==null || !rooms.get(main).remove(first) || !rooms.get(main).remove(second))
                    throw new ApiException(409,"DISCORD_MEMBERSHIP_CONFLICT","밀담 참가 상태를 확인해야 합니다.");
                rooms.put("mm-"+gameId+"-"+Db.uuid(whisper,"id"),new TreeSet<>(Set.of(first,second)));
            }
        }
        Set<String> requested=new HashSet<>();
        for (Map<String,Object> row:db.list("select m.user_id from discord_voice_member m where game_id=? and join_requested=true",gameId)) {
            String discord=users.get(Db.uuid(row,"user_id"));if(discord!=null)requested.add(discord);
        }
        String input=terminal+"|"+game.get("current_phase_id")+"|"+rooms+"|"+users;
        return new Plan(gameId,hash(input),terminal,users,rooms,requested);
    }

    private void synchronize(UUID gameId) {
        Plan plan=tx.execute(status->{commands.lock();Plan next=readPlan(gameId);
            Map<String,Object> previous=db.optional("select * from discord_voice_session where game_id=?",gameId);
            boolean changed=previous==null || !next.hash().equals(Db.str(previous,"desired_hash")) || !"READY".equals(Db.str(previous,"status"));
            db.update("insert into discord_voice_session(game_id,desired_hash,status) values(?,?,'PENDING') on conflict(game_id) do update set desired_hash=excluded.desired_hash,status='PENDING',updated_at=now()",gameId,next.hash());
            if(changed && !next.terminal())games.pauseForVoice(gameId,true);
            for(Map.Entry<String,Set<String>> room:next.rooms().entrySet()) {
                boolean main=room.getKey().endsWith("-main");
                db.update("insert into discord_voice_channel(id,game_id,room_key,kind) values(?,?,?,?) on conflict(room_key) do nothing",UUID.randomUUID(),gameId,room.getKey(),main?"MAIN":"WHISPER");
            }
            return next;});
        if (plan==null) return;
        if (!settings.configured() || !provider.ready()) throw new ApiException(503,"DISCORD_UNAVAILABLE","Discord 음성을 사용할 수 없습니다.");
        for(String user:plan.rooms().values().stream().flatMap(Set::stream).toList()) {
            VoiceProvider.MemberEligibility eligibility=provider.eligibility(user);
            if(!eligibility.eligible())throw new ApiException(409,"DISCORD_MEMBER_UNAVAILABLE","Discord 참가 권한을 확인해야 합니다.");
        }
        List<Map<String,Object>> persisted=db.list("select * from discord_voice_channel where game_id=? and closed_at is null order by room_key",gameId);
        List<VoiceReconciler.ChannelPlan> channelPlans=new ArrayList<>();
        Map<String,String> targetByUser=new HashMap<>();
        Map<UUID,String> resolvedChannels=new HashMap<>();
        for(Map<String,Object> row:persisted) {
            UUID recordId=Db.uuid(row,"id");String key=Db.str(row,"room_key"),channelId=Db.str(row,"channel_id");
            Set<String> desired=plan.rooms().getOrDefault(key,Set.of());
            if(plan.rooms().containsKey(key)) {
                channelId=provider.ensureChannel(key,channelId,key.endsWith("-main")?plan.users().size():2);
                String resolved=channelId;
                tx.executeWithoutResult(status->{commands.lock();db.update("update discord_voice_channel set channel_id=? where id=?",resolved,recordId);});
            }
            else if(channelId==null)channelId=provider.findChannel(key);
            if(channelId!=null) {
                resolvedChannels.put(recordId,channelId);
                channelPlans.add(new VoiceReconciler.ChannelPlan(channelId,desired));
                for(String member:desired)targetByUser.put(member,channelId);
            }
        }
        Map<String,VoiceReconciler.Observation> observed=new VoiceReconciler(provider).synchronize(channelPlans,new HashSet<>(plan.users().values()),plan.requested());
        for(Map<String,Object> row:persisted) {
            if(!plan.rooms().containsKey(Db.str(row,"room_key"))) {
                String channelId=resolvedChannels.get(Db.uuid(row,"id"));
                if(channelId!=null)provider.deleteChannel(channelId);
                tx.executeWithoutResult(status->{commands.lock();db.update("update discord_voice_channel set closed_at=now() where id=?",Db.uuid(row,"id"));});
            }
        }
        tx.executeWithoutResult(status->{commands.lock();Plan latest=readPlan(gameId);
            if(!plan.hash().equals(latest.hash()) || !plan.requested().equals(latest.requested())) {db.update("update discord_voice_session set status='PENDING',retry_at=now() where game_id=?",gameId);return;}
            for(Map.Entry<UUID,String> user:plan.users().entrySet()) {
                VoiceReconciler.Observation state=observed.get(user.getValue());
                boolean connected=state!=null && state.connected();
                db.update("insert into discord_voice_member(game_id,user_id,channel_id,connected,observed_at) values(?,?,?,?,now()) on conflict(game_id,user_id) do update set channel_id=excluded.channel_id,connected=excluded.connected,observed_at=now(),join_requested=false",gameId,user.getKey(),targetByUser.get(user.getValue()),connected);
            }
            db.update("update discord_voice_session set status=?,attempts=0,error_code=null,reconciled_at=now(),updated_at=now(),retry_at=now()+interval '10 seconds' where game_id=?",plan.terminal()?"CLEANED":"READY",gameId);
            if(!plan.terminal())games.pauseForVoice(gameId,false);
        });
    }
    private void fail(UUID gameId,RuntimeException error) {
        String code=error instanceof ApiException appError?appError.code:"DISCORD_SYNC_FAILED";
        tx.executeWithoutResult(status->{commands.lock();
            db.update("insert into discord_voice_session(game_id,status,error_code,attempts,retry_at) values(?,'ERROR',?,1,now()+interval '10 seconds') on conflict(game_id) do update set status='ERROR',error_code=excluded.error_code,attempts=discord_voice_session.attempts+1,retry_at=now()+interval '10 seconds',updated_at=now()",gameId,code);
            Map<String,Object> game=db.optional("select status from game_session where id=?",gameId);
            if(game!=null && Set.of("ACTIVE","PAUSED").contains(Db.str(game,"status")))games.pauseForVoice(gameId,true);
        });
    }
    private static String hash(String input) {
        try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(input.getBytes(StandardCharsets.UTF_8)));}
        catch(java.security.NoSuchAlgorithmException ex){throw new IllegalStateException(ex);}
    }
}
