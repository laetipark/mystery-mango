package com.mysterymango.voice;

import java.util.concurrent.TimeUnit;
import net.dv8tion.jda.api.JDA;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.Member;
import net.dv8tion.jda.api.entities.SelfMember;
import net.dv8tion.jda.api.entities.channel.concrete.Category;
import net.dv8tion.jda.api.requests.restaction.CacheRestAction;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.test.util.ReflectionTestUtils;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/** Exercises the real eligibility method while replacing only the external Discord boundary. */
class DiscordVoiceProviderEligibilityTest {
    private static final String GUILD_ID="111111111",CATEGORY_ID="222222222",MEMBER_ID="333333333";
    private final VoiceSettings settings=mock(VoiceSettings.class);
    private final JDA jda=mock(JDA.class);
    private final Guild guild=mock(Guild.class);
    private final SelfMember bot=mock(SelfMember.class);
    private final Member member=mock(Member.class);
    private final Category category=mock(Category.class);
    @SuppressWarnings("unchecked")
    private final CacheRestAction<Member> retrieve=mock(CacheRestAction.class,RETURNS_SELF);
    private final DiscordVoiceProvider provider=new DiscordVoiceProvider(settings);

    @BeforeEach void readyBotAndCurrentMember(){
        when(settings.configured()).thenReturn(true);when(settings.guildId()).thenReturn(GUILD_ID);when(settings.categoryId()).thenReturn(CATEGORY_ID);
        when(jda.getStatus()).thenReturn(JDA.Status.CONNECTED);when(jda.getGuildById(GUILD_ID)).thenReturn(guild);
        when(guild.getCategoryById(CATEGORY_ID)).thenReturn(category);when(guild.getSelfMember()).thenReturn(bot);
        when(bot.hasPermission(anyCollection())).thenReturn(true);when(bot.hasPermission(eq(category),anyCollection())).thenReturn(true);
        when(guild.retrieveMemberById(MEMBER_ID)).thenReturn(retrieve);when(retrieve.complete()).thenReturn(member);
        ReflectionTestUtils.setField(provider,"jda",jda);
    }

    @Test void currentGuildOwnerCanParticipateDespiteManagementPermissions(){
        when(member.isOwner()).thenReturn(true);
        when(member.hasPermission(any(Permission[].class))).thenReturn(true);
        assertEquals(new VoiceProvider.MemberEligibility(true,null),provider.eligibility(MEMBER_ID));
        verify(retrieve).useCache(false);verify(retrieve).timeout(12,TimeUnit.SECONDS);
    }

    @ParameterizedTest
    @EnumSource(value=Permission.class,names={"ADMINISTRATOR","MANAGE_CHANNEL","MANAGE_PERMISSIONS","VOICE_MOVE_OTHERS"})
    void nonOwnerWithAnyRestrictedPermissionRemainsExcluded(Permission permission){
        when(member.hasPermission(permission)).thenReturn(true);
        assertEquals(new VoiceProvider.MemberEligibility(false,"PRIVILEGED_ACCOUNT"),provider.eligibility(MEMBER_ID));
    }

    @ParameterizedTest @ValueSource(booleans={false,true})
    void membershipScreeningStillAppliesToOrdinaryMembersAndOwner(boolean owner){
        when(member.isOwner()).thenReturn(owner);when(member.isPending()).thenReturn(true);
        assertEquals(new VoiceProvider.MemberEligibility(false,"MEMBERSHIP_PENDING"),provider.eligibility(MEMBER_ID));
    }

    @Test void ordinaryMemberStillCanParticipate(){
        assertEquals(new VoiceProvider.MemberEligibility(true,null),provider.eligibility(MEMBER_ID));
    }

    @Test void ownerExceptionDoesNotBypassBotAvailability(){
        when(member.isOwner()).thenReturn(true);when(jda.getStatus()).thenReturn(JDA.Status.DISCONNECTED);
        assertEquals(new VoiceProvider.MemberEligibility(false,"BOT_UNAVAILABLE"),provider.eligibility(MEMBER_ID));
        verify(guild,never()).retrieveMemberById(anyString());
    }
}
