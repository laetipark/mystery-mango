package com.mysterymango.voice;

import com.mysterymango.common.ApiException;
import jakarta.annotation.PreDestroy;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import net.dv8tion.jda.api.JDA;
import net.dv8tion.jda.api.JDABuilder;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.*;
import net.dv8tion.jda.api.entities.channel.concrete.*;
import net.dv8tion.jda.api.exceptions.ErrorResponseException;
import net.dv8tion.jda.api.requests.ErrorResponse;
import net.dv8tion.jda.api.requests.GatewayIntent;
import net.dv8tion.jda.api.requests.RestAction;
import net.dv8tion.jda.api.utils.MemberCachePolicy;
import net.dv8tion.jda.api.utils.cache.CacheFlag;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public final class DiscordVoiceProvider implements VoiceProvider {
    private static final EnumSet<Permission> JOIN = EnumSet.of(Permission.VIEW_CHANNEL, Permission.VOICE_CONNECT, Permission.VOICE_SPEAK, Permission.VOICE_USE_VAD);
    private static final EnumSet<Permission> HIDDEN = EnumSet.of(Permission.VIEW_CHANNEL, Permission.VOICE_CONNECT, Permission.MESSAGE_SEND);
    private static final EnumSet<Permission> NON_VOICE = EnumSet.of(Permission.MESSAGE_SEND, Permission.MESSAGE_HISTORY, Permission.VOICE_STREAM, Permission.CREATE_INSTANT_INVITE);
    private static final EnumSet<Permission> BOT = EnumSet.of(Permission.VIEW_CHANNEL, Permission.VOICE_CONNECT, Permission.VOICE_SPEAK,
            Permission.VOICE_USE_VAD, Permission.VOICE_MOVE_OTHERS, Permission.MANAGE_CHANNEL, Permission.MANAGE_PERMISSIONS,
            Permission.MESSAGE_SEND, Permission.MESSAGE_HISTORY, Permission.VOICE_STREAM, Permission.CREATE_INSTANT_INVITE);
    private static final long BOT_VISIBLE=Permission.getRaw(Permission.VIEW_CHANNEL,Permission.VOICE_CONNECT);
    private static final EnumSet<Permission> PRIVILEGED = EnumSet.of(Permission.ADMINISTRATOR, Permission.MANAGE_CHANNEL, Permission.MANAGE_PERMISSIONS, Permission.VOICE_MOVE_OTHERS);
    private final VoiceSettings settings;
    private volatile JDA jda;

    public DiscordVoiceProvider(VoiceSettings settings) { this.settings = settings; }

    @EventListener(ApplicationReadyEvent.class)
    public void start() {
        // No gateway, HTTP request, account creation or installation when disabled/unconfigured.
        if (!settings.configured()) return;
        try {
            jda = JDABuilder.createLight(settings.botToken(), GatewayIntent.GUILD_VOICE_STATES)
                    .enableCache(CacheFlag.VOICE_STATE).setMemberCachePolicy(MemberCachePolicy.VOICE).build();
        } catch (RuntimeException ignored) { jda = null; }
    }

    @PreDestroy public void stop() { if (jda != null) jda.shutdownNow(); }

    @Override public boolean ready() {
        JDA client = jda;
        if (!settings.configured() || client == null || client.getStatus() != JDA.Status.CONNECTED) return false;
        Guild guild = client.getGuildById(settings.guildId());
        if (guild == null) return false;
        Category category = guild.getCategoryById(settings.categoryId());
        return category != null && guild.getSelfMember().hasPermission(BOT) && guild.getSelfMember().hasPermission(category, BOT);
    }

    private Guild guild() {
        if (!ready()) throw new ApiException(503, "DISCORD_UNAVAILABLE", "Discord 봇 설정 또는 연결을 확인해 주세요.");
        return Objects.requireNonNull(jda.getGuildById(settings.guildId()));
    }

    @Override public MemberEligibility eligibility(String discordUserId) {
        if (!ready()) return new MemberEligibility(false, "BOT_UNAVAILABLE");
        try {
            Guild guild = guild();
            Member member = run(guild.retrieveMemberById(discordUserId).useCache(false));
            if (member.isOwner() || PRIVILEGED.stream().anyMatch(member::hasPermission))
                return new MemberEligibility(false, "PRIVILEGED_ACCOUNT");
            if (member.isPending()) return new MemberEligibility(false, "MEMBERSHIP_PENDING");
            return new MemberEligibility(true, null);
        } catch (ErrorResponseException ex) {
            if (ex.getErrorResponse() == ErrorResponse.UNKNOWN_MEMBER) return new MemberEligibility(false, "NOT_GUILD_MEMBER");
            return new MemberEligibility(false, "BOT_UNAVAILABLE");
        }
    }

    @Override public String ensureChannel(String stableName, String knownId, int capacity) {
        Guild guild = guild();
        if (knownId != null) {
            VoiceChannel known = guild.getVoiceChannelById(knownId);
            if (known != null) { requireOwned(known); return known.getId(); }
            // An invisible/deleted known channel needs operator review; never assume access was revoked.
            throw new ApiException(503, "DISCORD_CHANNEL_MISSING", "등록된 Discord 채널을 확인해야 합니다.");
        }
        String found=findChannel(stableName);
        if(found!=null)return found;
        var create = guild.createVoiceChannel(stableName, guild.getCategoryById(settings.categoryId()))
                .setUserlimit(capacity)
                .addPermissionOverride(guild.getPublicRole(), 0, Permission.getRaw(HIDDEN))
                .addPermissionOverride(guild.getSelfMember(), BOT_VISIBLE, 0);
        return run(create).getId();
    }

    @Override public String findChannel(String stableName) {
        Guild guild=guild();
        List<VoiceChannel> matches = guild.getVoiceChannelsByName(stableName, false).stream()
                .filter(c -> settings.categoryId().equals(c.getParentCategoryId())).toList();
        if (matches.size() > 1) throw new ApiException(503, "DISCORD_DUPLICATE_CHANNEL", "음성 채널 복구를 확인해야 합니다.");
        if (matches.size() == 1) return matches.getFirst().getId();
        return null;
    }

    private VoiceChannel channel(String id) {
        VoiceChannel channel = guild().getVoiceChannelById(id);
        if (channel == null) throw new ApiException(503, "DISCORD_CHANNEL_MISSING", "음성 채널을 다시 동기화하고 있습니다.");
        requireOwned(channel);
        return channel;
    }
    private void requireOwned(VoiceChannel channel) {
        if (!settings.categoryId().equals(channel.getParentCategoryId()) || !channel.getName().startsWith("mm-"))
            throw new ApiException(503, "DISCORD_CHANNEL_SCOPE", "관리 범위 밖의 음성 채널입니다.");
    }

    @Override public void setMembers(String channelId, Set<String> ids) {
        VoiceChannel channel = channel(channelId);
        Guild guild = channel.getGuild();
        var manager = channel.getManager();
        // Replace every override; role allows must not reopen a supposedly private channel.
        for (PermissionOverride overwrite : channel.getPermissionOverrides()) manager.removePermissionOverride(overwrite.getIdLong());
        manager.putRolePermissionOverride(guild.getIdLong(), 0, Permission.getRaw(HIDDEN));
        manager.putMemberPermissionOverride(guild.getSelfMember().getIdLong(), BOT_VISIBLE, 0);
        for (String id : ids) manager.putMemberPermissionOverride(Long.parseUnsignedLong(id), Permission.getRaw(JOIN), Permission.getRaw(NON_VOICE));
        run(manager);
    }

    @Override public Set<String> occupants(String channelId) {
        return channel(channelId).getMembers().stream().filter(m -> !m.getId().equals(jda.getSelfUser().getId())).map(Member::getId).collect(Collectors.toSet());
    }

    @Override public String currentChannel(String id) {
        try {
            GuildVoiceState state = run(guild().retrieveMemberVoiceStateById(Long.parseUnsignedLong(id)).useCache(false));
            return state.getChannel() == null ? null : state.getChannel().getId();
        } catch (ErrorResponseException ex) {
            if (ex.getErrorResponse() == ErrorResponse.UNKNOWN_VOICE_STATE || ex.getErrorResponse() == ErrorResponse.UNKNOWN_MEMBER) return null;
            throw ex;
        }
    }

    @Override public void move(String userId, String channelId) { run(guild().moveVoiceMember(UserSnowflake.fromId(userId), channel(channelId))); }
    @Override public void disconnect(String userId) { run(guild().moveVoiceMember(UserSnowflake.fromId(userId), null)); }
    @Override public void deleteChannel(String id) {
        VoiceChannel channel = guild().getVoiceChannelById(id);
        if (channel == null) throw new ApiException(503,"DISCORD_DELETE_UNCONFIRMED","음성 채널 삭제를 확인해야 합니다.");
        requireOwned(channel);
        run(channel.delete());
    }

    private static <T> T run(RestAction<T> action) {
        // JDA handles route/global rate limits; a deadline keeps the reconciliation worker bounded.
        return action.timeout(12, TimeUnit.SECONDS).complete();
    }
}
