package com.mysterymango.auth;

import com.mysterymango.common.*;
import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController @RequestMapping("/api/v1/auth")
public class AuthController {
    private final UserRepository users;private final PasswordEncoder encoder;private final Commands commands;private final Db db;
    public AuthController(UserRepository users,PasswordEncoder encoder,Commands commands,Db db){this.users=users;this.encoder=encoder;this.commands=commands;this.db=db;}
    public record Register(@Email @NotBlank @Size(max=254) String email,@Size(min=10,max=72) @NotNull String password,@NotBlank @Size(max=40) String displayName){}
    public record Login(@Email @NotBlank String email,@NotBlank @Size(max=72) String password){}
    public record UserView(UUID id,String email,String displayName,boolean admin){}
    @GetMapping("/csrf") public Map<String,String> csrf(@io.swagger.v3.oas.annotations.Parameter(hidden=true) CsrfToken token){return Map.of("token",token.getToken(),"headerName",token.getHeaderName());}
    @PostMapping("/register") public UserView register(@Valid @RequestBody Register req,HttpServletRequest request,HttpServletResponse response){
        String encoded=encoder.encode(req.password());
        var u=commands.transaction(()->{String email=req.email().strip().toLowerCase(Locale.ROOT);if(users.findByEmail(email).isPresent())throw new ApiException(409,"EMAIL_EXISTS","이미 가입된 이메일입니다.");var x=users.saveAndFlush(new UserEntity(email,req.displayName().strip(),encoded,false));db.update("insert into player_activity(user_id,kind) values(?,'IDLE')",x.id);return x;});
        authenticate(u,request,response);return view(u);
    }
    @PostMapping("/login") public UserView login(@Valid @RequestBody Login req,HttpServletRequest request,HttpServletResponse response){
        var u=users.findByEmail(req.email().strip().toLowerCase(Locale.ROOT)).orElse(null);
        if(u==null||!encoder.matches(req.password(),u.passwordHash))throw new ApiException(401,"INVALID_CREDENTIALS","이메일 또는 비밀번호가 올바르지 않습니다.");
        authenticate(u,request,response);return view(u);
    }
    @GetMapping("/me") public UserView me(){return view(users.findById(Actor.id()).orElseThrow(()->new ApiException(401,"LOGIN_REQUIRED","로그인이 필요합니다.")));}
    private void authenticate(UserEntity user,HttpServletRequest request,HttpServletResponse response){
        if(request.getSession(false)!=null)request.changeSessionId();
        var context=SecurityContextHolder.createEmptyContext();
        context.setAuthentication(UsernamePasswordAuthenticationToken.authenticated(user.id.toString(),null,AuthorityUtils.createAuthorityList(user.admin?new String[]{"ROLE_USER","ROLE_ADMIN"}:new String[]{"ROLE_USER"})));
        SecurityContextHolder.setContext(context);new HttpSessionSecurityContextRepository().saveContext(context,request,response);
    }
    private UserView view(UserEntity u){return new UserView(u.id,u.email,u.displayName,u.admin);}
}
