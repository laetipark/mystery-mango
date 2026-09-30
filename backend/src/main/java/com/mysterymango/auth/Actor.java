package com.mysterymango.auth;
import com.mysterymango.common.ApiException;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.UUID;
public final class Actor {
    private Actor(){}
    public static UUID id(){var auth=SecurityContextHolder.getContext().getAuthentication();try{return UUID.fromString(auth.getName());}catch(Exception e){throw new ApiException(401,"LOGIN_REQUIRED","로그인이 필요합니다.");}}
    public static boolean admin(){var a=SecurityContextHolder.getContext().getAuthentication();return a!=null&&a.getAuthorities().stream().anyMatch(r->r.getAuthority().equals("ROLE_ADMIN"));}
}

