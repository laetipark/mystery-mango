package com.mysterymango.auth;

import com.mysterymango.common.*;
import java.net.URI;
import java.security.SecureRandom;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;

@Service
public class KakaoLoginService {
    private final Commands commands;private final Db db;private final UserRepository users;
    private final SecureRandom random=new SecureRandom();
    public KakaoLoginService(Commands commands,Db db,UserRepository users){this.commands=commands;this.db=db;this.users=users;}
    public String begin(String sessionId,String next){
        byte[] bytes=new byte[32];random.nextBytes(bytes);
        String state=Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        commands.transaction(()->{
            db.update("delete from kakao_login_state where state_hash in (select state_hash from kakao_login_state where expires_at<=now() order by expires_at limit 1000)");
            db.update("delete from kakao_login_state where session_hash=?",Commands.hash(sessionId));
            db.update("insert into kakao_login_state(state_hash,session_hash,next_path,expires_at) values(?,?,?,?)",Commands.hash(state),Commands.hash(sessionId),safeNext(next),Instant.now().plus(Duration.ofMinutes(10)));
            return null;
        });
        return state;
    }
    /** A database delete, not a per-request session attribute, makes concurrent replay fail. */
    public String consume(String sessionId,String state){
        if(sessionId==null||state==null||!state.matches("[A-Za-z0-9_-]{43}"))return null;
        return commands.transaction(()->{
            var row=db.optional("delete from kakao_login_state where state_hash=? and session_hash=? returning next_path,expires_at",Commands.hash(state),Commands.hash(sessionId));
            return row==null||!Db.instant(row,"expires_at").isAfter(Instant.now())?null:safeNext(Db.str(row,"next_path"));
        });
    }
    public UserEntity user(KakaoClient.Identity identity){
        if(identity==null||identity.id()==null||!identity.id().matches("[1-9][0-9]{0,18}")||identity.nickname()==null||identity.nickname().isBlank())throw new KakaoClient.Failure();
        try{Long.parseLong(identity.id());}catch(NumberFormatException e){throw new KakaoClient.Failure();}
        return commands.transaction(()->users.findByKakaoId(identity.id()).orElseGet(()->{
            var user=new UserEntity(null,identity.nickname(),null,false);user.kakaoId=identity.id();
            user=users.saveAndFlush(user);db.update("insert into player_activity(user_id,kind) values(?,'IDLE')",user.id);return user;
        }));
    }
    static String safeNext(String next){
        if(next==null||next.isBlank())return "/";
        if(next.length()>2048||!next.startsWith("/")||next.startsWith("//")||next.indexOf('\\')>=0
                ||next.chars().anyMatch(c->Character.isISOControl(c)||Character.isWhitespace(c))
                ||next.matches("(?is).*%(25|2f|5c|0[0-9a-f]|1[0-9a-f]|7f).*"))return "/";
        try{
            URI uri=URI.create(next);
            if(uri.isAbsolute()||uri.getRawAuthority()!=null||uri.getRawFragment()!=null||!uri.normalize().equals(uri))return "/";
            return uri.toASCIIString();
        }catch(IllegalArgumentException e){return "/";}
    }
}
