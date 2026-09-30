package com.mysterymango.voice;

import com.mysterymango.common.ApiException;
import java.util.*;

/** External I/O only. The caller persists its intent before entering this class. */
public final class VoiceReconciler {
    private final VoiceProvider provider;
    public VoiceReconciler(VoiceProvider provider) { this.provider=provider; }
    public record ChannelPlan(String channelId,Set<String> members) {}
    public record Observation(String channelId,boolean connected) {}

    public Map<String,Observation> synchronize(List<ChannelPlan> channels,Set<String> knownUsers,Set<String> joinRequested) {
        Map<String,String> desired=new TreeMap<>();
        Set<String> managed=new HashSet<>(), observed=new TreeSet<>(knownUsers);
        for (ChannelPlan channel:channels) {
            managed.add(channel.channelId());
            for (String user:channel.members()) {
                if (desired.put(user,channel.channelId())!=null) throw new IllegalArgumentException("A user cannot be assigned to two voice channels");
            }
        }
        // Revoke every old allow before movement. Unknown role/member allows are also removed.
        for (ChannelPlan channel:channels) provider.setMembers(channel.channelId(),channel.members());
        for (ChannelPlan channel:channels) observed.addAll(provider.occupants(channel.channelId()));
        for (String user:observed) {
            String current=provider.currentChannel(user),target=desired.get(user);
            if (current==null || current.equals(target)) continue;
            if (managed.contains(current) || (target!=null && joinRequested.contains(user))) {
                if (target==null) provider.disconnect(user); else provider.move(user,target);
            }
        }
        Map<String,Observation> result=new HashMap<>();
        // HTTP success is not our completion criterion: query each member's actual voice state.
        for (String user:observed) {
            String actual=provider.currentChannel(user),target=desired.get(user);
            if (actual!=null && managed.contains(actual) && !actual.equals(target))
                throw new ApiException(503,"DISCORD_MOVE_UNCONFIRMED","Discord 음성 이동을 확인하고 있습니다.");
            if (joinRequested.contains(user) && actual!=null && target!=null && !actual.equals(target))
                throw new ApiException(503,"DISCORD_MOVE_UNCONFIRMED","Discord 음성 이동을 확인하고 있습니다.");
            result.put(user,new Observation(actual,actual!=null && actual.equals(target)));
        }
        return result;
    }
}
