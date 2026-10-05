package com.mysterymango.auth;

import com.mysterymango.common.ApiException;
import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/v1/auth")
public class KakaoAuthController {
    private final KakaoSettings settings;private final AuthPolicy policy;private final KakaoClient kakao;
    private final KakaoLoginService logins;private final SessionLogin sessions;
    public KakaoAuthController(KakaoSettings settings,AuthPolicy policy,KakaoClient kakao,KakaoLoginService logins,SessionLogin sessions){
        this.settings=settings;this.policy=policy;this.kakao=kakao;this.logins=logins;this.sessions=sessions;
    }
    public record AuthProviders(boolean kakaoConfigured,boolean localLoginEnabled){}
    public record KakaoStart(@Size(max=2048) String next){}
    public record KakaoAuthorize(String authorizeUrl){}
    @GetMapping("/providers") public AuthProviders providers(){return new AuthProviders(settings.configured(),policy.localLoginEnabled());}
    @PostMapping("/kakao") public KakaoAuthorize start(@Valid @RequestBody KakaoStart body,HttpServletRequest request){
        if(SessionLogin.authenticated())throw new ApiException(409,"ALREADY_AUTHENTICATED","계정을 변경하려면 먼저 로그아웃해 주세요.");
        if(!settings.configured())throw new ApiException(503,"KAKAO_UNAVAILABLE","카카오 로그인이 아직 준비되지 않았습니다.");
        return new KakaoAuthorize(kakao.authorizeUrl(logins.begin(request.getSession().getId(),body.next())));
    }
    @GetMapping("/kakao/callback") public void callback(@RequestParam(required=false) String code,@RequestParam(required=false) String state,
            @RequestParam(required=false) String error,HttpServletRequest request,HttpServletResponse response){
        String destination="/login?kakaoError=failed";
        try{
            var session=request.getSession(false);
            String next=logins.consume(session==null?null:session.getId(),state);
            if(!settings.configured())destination="/login?kakaoError=unavailable";
            else if(next==null)destination="/login?kakaoError=expired";
            else if(SessionLogin.authenticated())destination="/login?kakaoError=failed";
            else if(error!=null)destination="/login?kakaoError="+("access_denied".equals(error)?"cancelled":"failed");
            else{
                // Provider I/O deliberately runs after the consume transaction and before the user transaction.
                var identity=kakao.exchange(code);
                var user=logins.user(identity);
                sessions.authenticate(user,request,response);
                destination=next;
            }
        }catch(RuntimeException e){
            // Do not log provider response bodies, codes, tokens, state, or exception messages.
            org.slf4j.LoggerFactory.getLogger(KakaoAuthController.class).warn("Kakao login failed trace={} class={}",request.getAttribute("traceId"),e.getClass().getSimpleName());
        }
        response.setStatus(302);response.setHeader("Location",destination);
    }
}
