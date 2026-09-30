package com.mysterymango.realtime;
import com.mysterymango.common.Db;
import org.springframework.stereotype.Component;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.WebSocketHandlerDecorator;
import org.springframework.web.socket.server.support.HttpSessionHandshakeInterceptor;
import org.springframework.messaging.*;
import org.springframework.messaging.simp.*;
import org.springframework.messaging.support.*;
import java.util.concurrent.ConcurrentHashMap;
@Component
public class SocketSessions {
    private final Db db;private final ConcurrentHashMap<String,WebSocketSession> sockets=new ConcurrentHashMap<>();
    public SocketSessions(Db db){this.db=db;}
    public WebSocketHandler decorate(WebSocketHandler handler){return new WebSocketHandlerDecorator(handler){
        @Override public void afterConnectionEstablished(WebSocketSession session)throws Exception{sockets.put(session.getId(),session);super.afterConnectionEstablished(session);}
        @Override public void afterConnectionClosed(WebSocketSession session,CloseStatus status)throws Exception{sockets.remove(session.getId());super.afterConnectionClosed(session,status);}
    };}
    public boolean active(String socketId){
        WebSocketSession socket=socketId==null?null:sockets.get(socketId);
        if(socket==null)return false;
        Object id=socket.getAttributes().get(HttpSessionHandshakeInterceptor.HTTP_SESSION_ID_ATTR_NAME);
        boolean valid=false;
        try{valid=socket.isOpen() && id!=null && db.optional("select 1 from spring_session where session_id=? and expiry_time>?",id,System.currentTimeMillis())!=null;}
        catch(RuntimeException ignored){/* A session store outage must not permit delivery. */}
        if(!valid)close(socket);
        return valid && sockets.get(socketId)==socket;
    }
    public void closeHttpSession(String httpSessionId){
        for(var socket:sockets.values())if(httpSessionId.equals(socket.getAttributes().get(HttpSessionHandshakeInterceptor.HTTP_SESSION_ID_ATTR_NAME)))close(socket);
    }
    private void close(WebSocketSession socket){
        // Remove before closing: even if closing the network socket fails, queued events are denied.
        sockets.remove(socket.getId(),socket);
        try{socket.close(CloseStatus.POLICY_VIOLATION);}catch(Exception ignored){}
    }
    public ChannelInterceptor outboundGuard(){return new ExecutorChannelInterceptor(){
        private Message<?> permitted(Message<?> message){
            if(SimpMessageHeaderAccessor.getMessageType(message.getHeaders())!=SimpMessageType.MESSAGE)return message;
            return active(SimpMessageHeaderAccessor.getSessionId(message.getHeaders()))?message:null;
        }
        @Override public Message<?> preSend(Message<?> message,MessageChannel channel){return permitted(message);}
        @Override public Message<?> beforeHandle(Message<?> message,MessageChannel channel,MessageHandler handler){return permitted(message);}
    };}
    @Scheduled(fixedDelay=1000) public void expire(){for(String id:sockets.keySet())active(id);}
}
