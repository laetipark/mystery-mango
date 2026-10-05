package com.mysterymango.auth;

import com.mysterymango.common.ApiException;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
public class AuthPolicy {
    private final Environment environment;
    public AuthPolicy(Environment environment){this.environment=environment;}
    public boolean localLoginEnabled(){return !environment.matchesProfiles("prod");}
    public void requireLocalLogin(){
        if(!localLoginEnabled())throw new ApiException(403,"LOCAL_LOGIN_DISABLED","카카오 로그인으로 계속해 주세요.");
    }
}
