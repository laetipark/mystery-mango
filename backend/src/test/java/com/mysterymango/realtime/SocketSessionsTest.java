package com.mysterymango.realtime;

import com.mysterymango.common.Db;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.*;
import org.springframework.messaging.simp.*;
import org.springframework.messaging.support.*;
import org.springframework.web.socket.*;
import org.springframework.web.socket.server.support.HttpSessionHandshakeInterceptor;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SocketSessionsTest {
    private final Db db=mock(Db.class);
    private final SocketSessions sessions=new SocketSessions(db);

    @Test void expiredSessionDropsOutboundEventBeforeScheduledSweep()throws Exception {
        WebSocketSession socket=register("expired","http-expired");
        when(db.optional(anyString(),eq("http-expired"),anyLong())).thenReturn(null);
        assertNull(sessions.outboundGuard().preSend(event("expired"),mock(MessageChannel.class)));
        verify(socket).close(CloseStatus.POLICY_VIOLATION);
    }
    @Test void validSessionCanReceiveButLogoutAlsoDropsAlreadyQueuedMessages()throws Exception {
        WebSocketSession socket=register("connected","http-connected");
        when(db.optional(anyString(),eq("http-connected"),anyLong())).thenReturn(Map.of("valid",1));
        Message<?> event=event("connected");ChannelInterceptor guard=sessions.outboundGuard();
        assertSame(event,guard.preSend(event,mock(MessageChannel.class)));
        sessions.closeHttpSession("http-connected");
        assertNull(((ExecutorChannelInterceptor)guard).beforeHandle(event,mock(MessageChannel.class),mock(MessageHandler.class)));
        verify(socket).close(CloseStatus.POLICY_VIOLATION);
    }
    @Test void logoutClosesEveryMatchingSocketAndKeepsOtherSession()throws Exception {
        WebSocketSession first=register("one","http-one"),second=register("two","http-one"),other=register("other","http-other");
        when(db.optional(anyString(),eq("http-other"),anyLong())).thenReturn(Map.of("valid",1));
        sessions.closeHttpSession("http-one");
        verify(first).close(CloseStatus.POLICY_VIOLATION);verify(second).close(CloseStatus.POLICY_VIOLATION);
        verify(other,never()).close(any());assertTrue(sessions.active("other"));
    }
    @Test void sessionStoreFailureAndUnknownSocketFailClosed()throws Exception {
        WebSocketSession socket=register("connected","http-connected");
        when(db.optional(anyString(),eq("http-connected"),anyLong())).thenThrow(new IllegalStateException("unavailable"));
        assertNull(sessions.outboundGuard().preSend(event("connected"),mock(MessageChannel.class)));
        assertNull(sessions.outboundGuard().preSend(event("unknown"),mock(MessageChannel.class)));
        verify(socket).close(CloseStatus.POLICY_VIOLATION);
    }
    private WebSocketSession register(String id,String httpSession)throws Exception {
        WebSocketSession socket=mock(WebSocketSession.class);
        when(socket.getId()).thenReturn(id);when(socket.isOpen()).thenReturn(true);
        when(socket.getAttributes()).thenReturn(Map.of(HttpSessionHandshakeInterceptor.HTTP_SESSION_ID_ATTR_NAME,httpSession));
        sessions.decorate(mock(WebSocketHandler.class)).afterConnectionEstablished(socket);return socket;
    }
    private static Message<?> event(String sessionId){
        var headers=SimpMessageHeaderAccessor.create(SimpMessageType.MESSAGE);headers.setSessionId(sessionId);
        return MessageBuilder.createMessage(new byte[0],headers.getMessageHeaders());
    }
}
