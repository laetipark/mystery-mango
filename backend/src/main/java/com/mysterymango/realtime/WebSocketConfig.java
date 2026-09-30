package com.mysterymango.realtime;

import com.mysterymango.common.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.*;
import org.springframework.messaging.simp.config.*;
import org.springframework.messaging.simp.stomp.*;
import org.springframework.messaging.support.*;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.socket.config.annotation.*;
import org.springframework.web.socket.server.support.HttpSessionHandshakeInterceptor;
import java.util.*;

@Configuration @EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    private final String[] origins;private final SocketSessions sessions;
    public WebSocketConfig(@Value("${app.origins}")String origins,SocketSessions sessions){this.origins=origins.split(",");this.sessions=sessions;}
    @Override public void configureMessageBroker(MessageBrokerRegistry registry){registry.enableSimpleBroker("/queue");registry.setUserDestinationPrefix("/user");}
    @Override public void registerStompEndpoints(StompEndpointRegistry registry){registry.addEndpoint("/ws").setAllowedOrigins(origins).addInterceptors(new HttpSessionHandshakeInterceptor());}
    @Override public void configureWebSocketTransport(WebSocketTransportRegistration registration){registration.addDecoratorFactory(sessions::decorate);registration.setMessageSizeLimit(8192);}
    @Override public void configureClientOutboundChannel(ChannelRegistration registration){registration.interceptors(sessions.outboundGuard());}
    @Override public void configureClientInboundChannel(ChannelRegistration registration){registration.interceptors(inboundGuard());}
    ChannelInterceptor inboundGuard(){return new ChannelInterceptor(){
        @Override public Message<?> preSend(Message<?> message,MessageChannel channel){
            var a=MessageHeaderAccessor.getAccessor(message,StompHeaderAccessor.class);if(a==null)return message;
            // Transport-generated disconnects must reach the broker after invalidation
            // so subscriptions and the user registry can release the closed socket.
            if(a.getCommand()==StompCommand.DISCONNECT)return message;
            if(a.getUser()==null)throw new ApiException(401,"LOGIN_REQUIRED","로그인이 필요합니다.");
            if(!sessions.active(a.getSessionId()))throw new ApiException(401,"SESSION_EXPIRED","로그인이 만료되었습니다.");
            if(a.getCommand()==StompCommand.CONNECT){
                var attrs=a.getSessionAttributes();Object token=attrs==null?null:attrs.get("org.springframework.security.web.csrf.HttpSessionCsrfTokenRepository.CSRF_TOKEN");
                if(!(token instanceof CsrfToken csrf)||!csrf.getToken().equals(a.getFirstNativeHeader(csrf.getHeaderName())))throw new ApiException(403,"CSRF_INVALID","연결 인증이 올바르지 않습니다.");
            }
            if(a.getCommand()==StompCommand.SEND||(a.getCommand()==StompCommand.SUBSCRIBE&&!"/user/queue/events".equals(a.getDestination())))throw new ApiException(403,"SUBSCRIPTION_FORBIDDEN","허용되지 않은 구독입니다.");
            return message;
        }
    };}
}
