package com.mysterymango.voice;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import com.mysterymango.common.*;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.mock.web.MockHttpSession;

class DiscordSecurityTest {
    @Test void disabledNeedsNoCredentialsOrDiscordConnection() {
        VoiceSettings settings=new VoiceSettings(new MockEnvironment());
        DiscordVoiceProvider provider=new DiscordVoiceProvider(settings);provider.start();
        assertFalse(settings.configured());assertFalse(provider.ready());
        assertFalse(provider.eligibility("123456789").eligible());provider.stop();
    }
    @Test void textEligibilityDoesNotTouchDatabaseOrProvider() {
        Db db=mock(Db.class);VoiceProvider provider=mock(VoiceProvider.class);
        new VoiceAccess(db,new VoiceSettings(new MockEnvironment()),provider).requireEligible(UUID.randomUUID(),"TEXT");
        verifyNoInteractions(db,provider);
    }
    @Test void oauthStateIsOneUseAndBoundToAuthenticatedActor() {
        UUID user=UUID.randomUUID();MockHttpSession session=valid(user);
        DiscordAccountService.consumeState(user,"one-time-nonce",session);
        assertThrows(ApiException.class,()->DiscordAccountService.consumeState(user,"one-time-nonce",session));
        assertThrows(ApiException.class,()->DiscordAccountService.consumeState(UUID.randomUUID(),"one-time-nonce",valid(user)));
    }
    @Test void expiredAndMismatchedOAuthStateRejected() {
        UUID user=UUID.randomUUID();MockHttpSession session=valid(user);
        session.setAttribute(DiscordAccountService.EXPIRES,Instant.now().minusSeconds(1).getEpochSecond());
        assertThrows(ApiException.class,()->DiscordAccountService.consumeState(user,"one-time-nonce",session));
        assertThrows(ApiException.class,()->DiscordAccountService.consumeState(user,"forged",valid(user)));
    }
    private static MockHttpSession valid(UUID user) {
        MockHttpSession session=new MockHttpSession();session.setAttribute(DiscordAccountService.STATE,"one-time-nonce");
        session.setAttribute(DiscordAccountService.ACTOR,user.toString());session.setAttribute(DiscordAccountService.EXPIRES,Instant.now().plusSeconds(100).getEpochSecond());return session;
    }
}
