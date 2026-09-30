package com.mysterymango.voice;

import com.mysterymango.common.*;
import com.mysterymango.game.GameService;
import java.util.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class VoiceStateTest {
    private final UUID gameId=UUID.randomUUID(),userId=UUID.randomUUID();
    private final Db db=mock(Db.class);
    private final GameService games=mock(GameService.class);
    private final VoiceSettings settings=mock(VoiceSettings.class);
    private final VoiceAccess access=mock(VoiceAccess.class);
    private final DiscordController controller=new DiscordController(mock(DiscordAccountService.class),db,mock(Commands.class),games,settings,access);

    @AfterEach void clearActor(){SecurityContextHolder.clearContext();}
    @Test void unavailableBotCannotExposeStaleReadyLinkOrConnection(){
        fixture("ACTIVE",false,"READY");when(access.ready()).thenReturn(false);
        var result=controller.voice(gameId);
        assertEquals("ERROR",result.get("status"));assertEquals(false,result.get("connected"));assertNull(result.get("channelUrl"));
    }
    @Test void endedGameWaitsForConfirmedCleanupInsteadOfReturningJoinLink(){
        fixture("COMPLETED",false,"READY");
        var result=controller.voice(gameId);
        assertEquals("PENDING",result.get("status"));assertEquals(false,result.get("connected"));assertNull(result.get("channelUrl"));
    }
    @Test void confirmedLiveSessionCanReturnItsOwnChannelLink(){
        fixture("ACTIVE",false,"READY");
        var result=controller.voice(gameId);
        assertEquals("READY",result.get("status"));assertEquals(true,result.get("connected"));
        assertEquals("https://discord.com/channels/123456789/234567890",result.get("channelUrl"));
    }
    @Test void transitionStillHidesPreviouslyReadyChannel(){
        fixture("PAUSED",true,"READY");
        var result=controller.voice(gameId);
        assertEquals("PENDING",result.get("status"));assertNull(result.get("channelUrl"));
    }
    private void fixture(String gameStatus,boolean paused,String voiceStatus){
        SecurityContextHolder.getContext().setAuthentication(UsernamePasswordAuthenticationToken.authenticated(userId.toString(),null,List.of()));
        when(games.isParticipant(gameId,userId)).thenReturn(true);
        when(settings.provider()).thenReturn("discord");when(settings.configured()).thenReturn(true);when(settings.guildId()).thenReturn("123456789");when(access.ready()).thenReturn(true);
        when(db.one(anyString(),eq(gameId))).thenReturn(Json.map("mode","DISCORD","status",gameStatus,"voice_pause",paused));
        when(db.optional("select * from discord_voice_session where game_id=?",gameId)).thenReturn(Map.of("status",voiceStatus));
        when(db.optional(startsWith("select m.*"),eq(gameId),eq(userId))).thenReturn(Json.map("channel_id","234567890","connected",true,"kind","MAIN"));
    }
}
