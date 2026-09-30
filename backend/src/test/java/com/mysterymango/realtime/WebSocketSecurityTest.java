package com.mysterymango.realtime;

import com.mysterymango.common.ApiException;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.*;
import org.springframework.messaging.simp.stomp.*;
import org.springframework.messaging.support.*;
import org.springframework.security.web.csrf.DefaultCsrfToken;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class WebSocketSecurityTest {
    private final SocketSessions sessions=mock(SocketSessions.class);
    private final ChannelInterceptor guard=new WebSocketConfig("http://localhost:5173",sessions).inboundGuard();
    @Test void connectRequiresHttpSessionTokenAndLiveSession(){
        when(sessions.active("socket")).thenReturn(true);
        var valid=headers(StompCommand.CONNECT);valid.setSessionAttributes(Map.of("org.springframework.security.web.csrf.HttpSessionCsrfTokenRepository.CSRF_TOKEN",new DefaultCsrfToken("X-CSRF-TOKEN","_csrf","session-token")));
        valid.addNativeHeader("X-CSRF-TOKEN","session-token");
        Message<?> message=message(valid);assertSame(message,guard.preSend(message,mock(MessageChannel.class)));
        var missing=headers(StompCommand.CONNECT);assertEquals("CSRF_INVALID",assertThrows(ApiException.class,()->send(missing)).code);
        var forged=headers(StompCommand.CONNECT);forged.setSessionAttributes(valid.getSessionAttributes());forged.addNativeHeader("X-CSRF-TOKEN","forged");
        assertEquals("CSRF_INVALID",assertThrows(ApiException.class,()->send(forged)).code);
        when(sessions.active("socket")).thenReturn(false);
        assertEquals("SESSION_EXPIRED",assertThrows(ApiException.class,()->guard.preSend(message,mock(MessageChannel.class))).code);
    }
    @Test void onlyOwnEventsSubscriptionIsAllowedAndClientPublishingIsDenied(){
        when(sessions.active("socket")).thenReturn(true);
        var own=headers(StompCommand.SUBSCRIBE);own.setDestination("/user/queue/events");assertNotNull(send(own));
        for(String path:new String[]{"/topic/game","/user/another/queue/events","/queue/events"}){
            var forbidden=headers(StompCommand.SUBSCRIBE);forbidden.setDestination(path);
            assertEquals("SUBSCRIPTION_FORBIDDEN",assertThrows(ApiException.class,()->send(forbidden)).code);
        }
        assertEquals("SUBSCRIPTION_FORBIDDEN",assertThrows(ApiException.class,()->send(headers(StompCommand.SEND))).code);
    }
    @Test void expiredTransportCanStillReleaseItsBrokerSubscriptions(){
        when(sessions.active("socket")).thenReturn(false);
        assertNotNull(send(headers(StompCommand.DISCONNECT)));
    }
    private Message<?> send(StompHeaderAccessor headers){return guard.preSend(message(headers),mock(MessageChannel.class));}
    private static StompHeaderAccessor headers(StompCommand command){var headers=StompHeaderAccessor.create(command);headers.setUser(()->"user-id");headers.setSessionId("socket");return headers;}
    private static Message<?> message(StompHeaderAccessor headers){return MessageBuilder.createMessage(new byte[0],headers.getMessageHeaders());}
}
