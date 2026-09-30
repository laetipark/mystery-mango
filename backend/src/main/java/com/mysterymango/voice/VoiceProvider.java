package com.mysterymango.voice;

import java.util.Set;

/** No participant audio or outgoing messages are handled by this interface. */
public interface VoiceProvider {
    boolean ready();
    MemberEligibility eligibility(String discordUserId);
    String findChannel(String stableName);
    String ensureChannel(String stableName, String knownId, int capacity);
    void setMembers(String channelId, Set<String> discordUserIds);
    Set<String> occupants(String channelId);
    String currentChannel(String discordUserId);
    void move(String discordUserId, String channelId);
    void disconnect(String discordUserId);
    void deleteChannel(String channelId);
    record MemberEligibility(boolean eligible, String reason) {}
}
