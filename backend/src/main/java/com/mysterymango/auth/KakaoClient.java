package com.mysterymango.auth;

import com.mysterymango.common.Json;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import java.io.IOException;
import java.net.*;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.nio.ByteBuffer;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.Collectors;

/** Only this boundary handles provider tokens; none are returned to the browser or persisted. */
@Component
public class KakaoClient {
    static final URI AUTHORIZE=URI.create("https://kauth.kakao.com/oauth/authorize");
    private final KakaoSettings settings;
    private final Json json;
    private final HttpClient http;
    private final URI tokenEndpoint,userEndpoint;
    private final Duration timeout;
    public record Identity(String id,String nickname){}
    static final class Failure extends RuntimeException {Failure(){super("Kakao authentication failed");}}
    @Autowired public KakaoClient(KakaoSettings settings,Json json){
        this(settings,json,HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).followRedirects(HttpClient.Redirect.NEVER).build(),
                URI.create("https://kauth.kakao.com/oauth/token"),URI.create("https://kapi.kakao.com/v2/user/me"));
    }
    KakaoClient(KakaoSettings settings,Json json,HttpClient http,URI tokenEndpoint,URI userEndpoint){
        this(settings,json,http,tokenEndpoint,userEndpoint,Duration.ofSeconds(10));
    }
    KakaoClient(KakaoSettings settings,Json json,HttpClient http,URI tokenEndpoint,URI userEndpoint,Duration timeout){
        this.settings=settings;this.json=json;this.http=http;this.tokenEndpoint=tokenEndpoint;this.userEndpoint=userEndpoint;
        this.timeout=timeout;
    }
    public String authorizeUrl(String state){
        return AUTHORIZE+"?"+form(Map.of("response_type","code","client_id",settings.clientId(),"redirect_uri",settings.redirectUri(),
                "scope","profile_nickname","state",state));
    }
    public Identity exchange(String code){
        if(code==null||code.isBlank()||code.length()>4096)throw new Failure();
        Map<String,Object> tokens=post(tokenEndpoint,Map.of("grant_type","authorization_code","client_id",settings.clientId(),
                "client_secret",settings.clientSecret(),"redirect_uri",settings.redirectUri(),"code",code),null);
        Object raw=tokens.get("access_token");
        if(!(raw instanceof String token)||token.isBlank()||token.length()>4096||token.chars().anyMatch(c->c<=32||c>=127)
                ||!"bearer".equalsIgnoreCase(String.valueOf(tokens.get("token_type"))))throw new Failure();
        return identity(post(userEndpoint,Map.of("property_keys","[\"kakao_account.profile\"]","secure_resource","true"),token));
    }
    private Map<String,Object> post(URI uri,Map<String,String> fields,String token){
        var request=HttpRequest.newBuilder(uri).timeout(timeout)
                .header("Content-Type","application/x-www-form-urlencoded;charset=utf-8").header("Accept","application/json")
                .POST(HttpRequest.BodyPublishers.ofString(form(fields)));
        if(token!=null)request.header("Authorization","Bearer "+token);
        var pending=http.sendAsync(request.build(),info->new LimitedBody());
        try{
            // HttpRequest.timeout alone is not a deadline for a slowly streamed body.
            var response=pending.get(timeout.toMillis(),TimeUnit.MILLISECONDS);
            if(response.statusCode()!=200)throw new Failure();
            var result=json.object(new String(response.body(),StandardCharsets.UTF_8));
            if(result==null||result.containsKey("error")||result.containsKey("code"))throw new Failure();
            return result;
        }catch(InterruptedException e){pending.cancel(true);Thread.currentThread().interrupt();throw new Failure();}
        catch(ExecutionException|TimeoutException e){pending.cancel(true);throw new Failure();}
        catch(RuntimeException e){pending.cancel(true);throw new Failure();}
    }
    static Identity identity(Map<String,Object> body){
        Object raw=body.get("id");
        if(!(raw instanceof Integer||raw instanceof Long)||((Number)raw).longValue()<=0||Boolean.FALSE.equals(body.get("has_signed_up")))throw new Failure();
        String nickname="탐정";
        if(body.get("kakao_account") instanceof Map<?,?> account&&account.get("profile") instanceof Map<?,?> profile
                &&profile.get("nickname") instanceof String value){
            String clean=value.strip().replaceAll("[\\p{Cc}\\p{Cf}]","");
            if(!clean.isBlank())nickname=clean.substring(0,clean.offsetByCodePoints(0,Math.min(40,clean.codePointCount(0,clean.length()))));
        }
        return new Identity(Long.toString(((Number)raw).longValue()),nickname);
    }
    private static String form(Map<String,String> fields){
        return fields.entrySet().stream().map(e->URLEncoder.encode(e.getKey(),StandardCharsets.UTF_8)+"="+URLEncoder.encode(e.getValue(),StandardCharsets.UTF_8)).collect(Collectors.joining("&"));
    }
    /** Keep both the whole-response timeout and a small maximum provider response size. */
    private static final class LimitedBody implements HttpResponse.BodySubscriber<byte[]> {
        private final HttpResponse.BodySubscriber<byte[]> delegate=HttpResponse.BodySubscribers.ofByteArray();
        private Flow.Subscription subscription;private int size;private boolean failed;
        public CompletionStage<byte[]> getBody(){return delegate.getBody();}
        public void onSubscribe(Flow.Subscription subscription){this.subscription=subscription;delegate.onSubscribe(subscription);}
        public void onNext(List<ByteBuffer> buffers){
            if(failed)return;
            for(var buffer:buffers){size+=buffer.remaining();if(size>65536){failed=true;subscription.cancel();delegate.onError(new IOException("Provider response too large"));return;}}
            delegate.onNext(buffers);
        }
        public void onError(Throwable error){delegate.onError(error);}
        public void onComplete(){if(!failed)delegate.onComplete();}
    }
}
