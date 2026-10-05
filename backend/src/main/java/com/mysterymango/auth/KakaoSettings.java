package com.mysterymango.auth;

import java.net.URI;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class KakaoSettings {
    private final String clientId,clientSecret,redirectUri;
    private final boolean configured;
    public KakaoSettings(@Value("${app.kakao.client-id:}") String clientId,
                         @Value("${app.kakao.client-secret:}") String clientSecret,
                         @Value("${app.kakao.redirect-uri:}") String redirectUri,AuthPolicy policy){
        this.clientId=clientId.strip();this.clientSecret=clientSecret.strip();this.redirectUri=redirectUri.strip();
        this.configured=!this.clientId.isEmpty()&&!this.clientSecret.isEmpty()&&validRedirect(this.redirectUri,policy.localLoginEnabled());
    }
    public boolean configured(){return configured;}
    String clientId(){return clientId;}
    String clientSecret(){return clientSecret;}
    String redirectUri(){return redirectUri;}
    static boolean validRedirect(String value,boolean development){
        try{
            URI uri=URI.create(value);
            if(uri.getHost()==null||uri.getUserInfo()!=null||uri.getRawQuery()!=null||uri.getRawFragment()!=null
                    ||!"/api/v1/auth/kakao/callback".equals(uri.getRawPath()))return false;
            return "https".equals(uri.getScheme())||development&&"http".equals(uri.getScheme())
                    &&Set.of("localhost","127.0.0.1","[::1]").contains(uri.getHost());
        }catch(IllegalArgumentException e){return false;}
    }
}
