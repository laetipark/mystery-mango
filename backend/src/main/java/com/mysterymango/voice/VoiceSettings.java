package com.mysterymango.voice;

import java.net.URI;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
public final class VoiceSettings {
    private final Environment env;
    public VoiceSettings(Environment env) { this.env = env; }
    private String value(String key) { return env.getProperty(key, "").trim(); }
    public String provider() { return value("VOICE_PROVIDER").equalsIgnoreCase("discord") ? "discord" : "disabled"; }
    public String botToken() { return value("DISCORD_BOT_TOKEN"); }
    public String guildId() { return value("DISCORD_GUILD_ID"); }
    public String categoryId() { return value("DISCORD_CATEGORY_ID"); }
    public String clientId() { return value("DISCORD_CLIENT_ID"); }
    public String clientSecret() { return value("DISCORD_CLIENT_SECRET"); }
    public String redirectUri() { return value("DISCORD_REDIRECT_URI"); }
    public boolean configured() {
        if (!provider().equals("discord") || botToken().isBlank() || clientSecret().isBlank()
                || !snowflake(guildId()) || !snowflake(categoryId()) || !snowflake(clientId())) return false;
        try {
            URI uri = URI.create(redirectUri());
            return uri.getHost() != null && ("https".equals(uri.getScheme())
                    || ("http".equals(uri.getScheme()) && ("localhost".equals(uri.getHost()) || "127.0.0.1".equals(uri.getHost()))));
        } catch (IllegalArgumentException ex) { return false; }
    }
    static boolean snowflake(String id) { return id != null && id.matches("[0-9]{5,20}"); }
}
