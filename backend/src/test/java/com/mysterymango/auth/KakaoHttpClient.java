package com.mysterymango.auth;

import com.mysterymango.common.Json;
import java.net.*;
import java.net.http.*;
import java.time.Duration;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

final class KakaoHttpClient implements AutoCloseable {
    final CookieManager cookies=new CookieManager(null,CookiePolicy.ACCEPT_ALL);
    final HttpClient http=HttpClient.newBuilder().cookieHandler(cookies).connectTimeout(Duration.ofSeconds(5)).followRedirects(HttpClient.Redirect.NEVER).build();
    final Json json;final String base;String token,header;
    KakaoHttpClient(int port,Json json){this.base="http://localhost:"+port;this.json=json;}
    HttpResponse<String> get(String path)throws Exception{return request("GET",path,null,false);}
    HttpResponse<String> request(String method,String path,Object body,boolean withCsrf)throws Exception{
        var builder=HttpRequest.newBuilder(URI.create(base+path)).timeout(Duration.ofSeconds(15)).header("Content-Type","application/json");
        if(withCsrf)builder.header(header,token);
        return http.send(builder.method(method,body==null?HttpRequest.BodyPublishers.noBody():HttpRequest.BodyPublishers.ofString(json.write(body))).build(),HttpResponse.BodyHandlers.ofString());
    }
    void csrf()throws Exception{var response=get("/api/v1/auth/csrf");assertEquals(200,response.statusCode());var body=json.object(response.body());token=body.get("token").toString();header=body.get("headerName").toString();}
    String begin(String next)throws Exception{
        var response=request("POST","/api/v1/auth/kakao",next==null?Map.of():Map.of("next",next),true);assertEquals(200,response.statusCode());
        var uri=URI.create(json.object(response.body()).get("authorizeUrl").toString());
        for(String part:uri.getRawQuery().split("&"))if(part.startsWith("state="))return URLDecoder.decode(part.substring(6),java.nio.charset.StandardCharsets.UTF_8);
        throw new AssertionError("Missing state");
    }
    HttpResponse<String> callback(String state)throws Exception{return get("/api/v1/auth/kakao/callback?state="+state+"&code=disposable-code");}
    String sessionCookie(){return cookies.getCookieStore().getCookies().stream().filter(c->c.getName().equals("SESSION")).findFirst().orElseThrow().getValue();}
    void copyCookiesTo(KakaoHttpClient target){for(var cookie:cookies.getCookieStore().getCookies())target.cookies.getCookieStore().add(URI.create(base),(HttpCookie)cookie.clone());}
    static void redirect(HttpResponse<String> response,String path){assertEquals(302,response.statusCode());assertEquals(path,response.headers().firstValue("Location").orElseThrow());}
    public void close(){http.close();}
}
