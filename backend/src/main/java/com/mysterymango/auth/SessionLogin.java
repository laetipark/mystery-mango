package com.mysterymango.auth;

import com.mysterymango.realtime.SocketSessions;
import jakarta.servlet.http.*;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.csrf.HttpSessionCsrfTokenRepository;
import org.springframework.stereotype.Component;

@Component
public class SessionLogin {
    private final SocketSessions sockets;
    private final HttpSessionCsrfTokenRepository csrf;
    public SessionLogin(SocketSessions sockets,HttpSessionCsrfTokenRepository csrf){this.sockets=sockets;this.csrf=csrf;}
    public static boolean authenticated(){
        var auth=SecurityContextHolder.getContext().getAuthentication();
        return auth!=null&&auth.isAuthenticated()&&!(auth instanceof AnonymousAuthenticationToken);
    }
    public void authenticate(UserEntity user,HttpServletRequest request,HttpServletResponse response){
        var previous=request.getSession(false);
        // Replace the JDBC session row as well as the public ID: a concurrent anonymous
        // callback must not save its stale session row over the authenticated session.
        if(previous!=null){sockets.closeHttpSession(previous.getId());previous.invalidate();}
        request.getSession(true);
        var context=SecurityContextHolder.createEmptyContext();
        context.setAuthentication(UsernamePasswordAuthenticationToken.authenticated(user.id.toString(),null,
                AuthorityUtils.createAuthorityList(user.admin?new String[]{"ROLE_USER","ROLE_ADMIN"}:new String[]{"ROLE_USER"})));
        SecurityContextHolder.setContext(context);
        new HttpSessionSecurityContextRepository().saveContext(context,request,response);
        csrf.saveToken(csrf.generateToken(request),request,response);
    }
}
