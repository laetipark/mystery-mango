package com.mysterymango.voice;

import com.mysterymango.common.ApiException;
import com.mysterymango.common.Json;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public final class DiscordOAuthClient {
    private final VoiceSettings settings;
    private final Json json;
    private final HttpClient client=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(8)).followRedirects(HttpClient.Redirect.NEVER).build();
    public DiscordOAuthClient(VoiceSettings settings,Json json) { this.settings=settings; this.json=json; }
    public Identity exchange(String code) {
        if (!settings.configured()) throw new ApiException(503,"VOICE_NOT_CONFIGURED","Discord 연동이 미설정입니다.");
        String body="grant_type=authorization_code&code="+encode(code)+"&client_id="+encode(settings.clientId())
                +"&client_secret="+encode(settings.clientSecret())+"&redirect_uri="+encode(settings.redirectUri());
        Map<String,Object> tokens=request(HttpRequest.newBuilder(URI.create("https://discord.com/api/v10/oauth2/token"))
                .timeout(Duration.ofSeconds(10)).header("Content-Type","application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(body)).build());
        String access=String.valueOf(tokens.get("access_token"));
        if (access.equals("null") || access.isBlank()) throw failed();
        Map<String,Object> user=request(HttpRequest.newBuilder(URI.create("https://discord.com/api/v10/users/@me"))
                .timeout(Duration.ofSeconds(10)).header("Authorization","Bearer "+access).GET().build());
        String id=String.valueOf(user.get("id"));
        if (!VoiceSettings.snowflake(id) || Boolean.TRUE.equals(user.get("bot"))) throw failed();
        String name=String.valueOf(user.getOrDefault("global_name",user.getOrDefault("username","Discord")));
        if (name.equals("null")) name=String.valueOf(user.getOrDefault("username","Discord"));
        return new Identity(id,name);
    }
    private Map<String,Object> request(HttpRequest request) {
        try {
            var response=client.send(request,HttpResponse.BodyHandlers.ofString());
            if (response.statusCode()!=200) throw failed();
            return json.object(response.body());
        } catch (InterruptedException ex) { Thread.currentThread().interrupt(); throw failed(); }
        catch (IOException | IllegalArgumentException ex) { throw failed(); }
    }
    private ApiException failed() { return new ApiException(502,"DISCORD_OAUTH_FAILED","Discord 계정 확인에 실패했습니다. 다시 연결해 주세요."); }
    static String encode(String value) { return URLEncoder.encode(value,StandardCharsets.UTF_8); }
    public record Identity(String id,String displayName) {}
}
