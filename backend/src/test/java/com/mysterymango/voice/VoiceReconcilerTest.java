package com.mysterymango.voice;

import static org.junit.jupiter.api.Assertions.*;
import com.mysterymango.common.ApiException;
import java.util.*;
import org.junit.jupiter.api.Test;

class VoiceReconcilerTest {
    @Test void revokesOldRoomBeforeMovingAndConfirmsActualState() {
        FakeProvider provider=new FakeProvider();provider.location.put("alice","main");provider.location.put("bob","main");provider.location.put("eve","whisper");
        var result=new VoiceReconciler(provider).synchronize(List.of(
                new VoiceReconciler.ChannelPlan("main",Set.of("bob")),
                new VoiceReconciler.ChannelPlan("whisper",Set.of("alice"))),Set.of("alice","bob"),Set.of());
        assertEquals(Set.of("bob"),provider.permissions.get("main"));
        assertEquals(Set.of("alice"),provider.permissions.get("whisper"));
        assertEquals("whisper",provider.location.get("alice"));assertFalse(provider.location.containsKey("eve"));
        assertTrue(result.get("alice").connected());
        assertTrue(provider.calls.indexOf("permissions:main")<provider.calls.indexOf("move:alice"));
        assertFalse(provider.tryJoin("alice","main"),"Removed membership must not admit reentry");
        assertFalse(provider.tryJoin("eve","whisper"),"An outsider must not gain whisper access");
    }
    @Test void successfulHttpCallWithoutActualMovementFailsConfirmation() {
        FakeProvider provider=new FakeProvider();provider.location.put("alice","main");provider.ignoreMoves=true;
        assertThrows(ApiException.class,()->new VoiceReconciler(provider).synchronize(List.of(
                new VoiceReconciler.ChannelPlan("main",Set.of()),new VoiceReconciler.ChannelPlan("whisper",Set.of("alice"))),Set.of("alice"),Set.of()));
    }
    @Test void permissionFailureStopsBeforeAnyMovementOrFalseSuccess() {
        FakeProvider provider=new FakeProvider();provider.failPermissions=true;provider.location.put("alice","main");
        assertThrows(IllegalStateException.class,()->new VoiceReconciler(provider).synchronize(List.of(new VoiceReconciler.ChannelPlan("main",Set.of())),Set.of("alice"),Set.of()));
        assertEquals("main",provider.location.get("alice"));assertFalse(provider.calls.contains("disconnect:alice"));
    }
    @Test void unconfirmedDisconnectDoesNotPassCleanup() {
        FakeProvider provider=new FakeProvider();provider.location.put("alice","main");provider.ignoreDisconnects=true;
        assertThrows(ApiException.class,()->new VoiceReconciler(provider).synchronize(
                List.of(new VoiceReconciler.ChannelPlan("main",Set.of())),Set.of("alice"),Set.of()));
    }
    @Test void disconnectedUsersAreNotReportedAsConnectedOrForceJoined() {
        FakeProvider provider=new FakeProvider();
        var result=new VoiceReconciler(provider).synchronize(List.of(new VoiceReconciler.ChannelPlan("main",Set.of("alice"))),Set.of("alice"),Set.of("alice"));
        assertFalse(result.get("alice").connected());assertFalse(provider.calls.contains("move:alice"));
    }
    @Test void cleanupDoesNotDisconnectUnrelatedVoiceChannel() {
        FakeProvider provider=new FakeProvider();provider.location.put("alice","other");provider.location.put("bob","main");
        new VoiceReconciler(provider).synchronize(List.of(new VoiceReconciler.ChannelPlan("main",Set.of())),Set.of("alice","bob"),Set.of());
        assertEquals("other",provider.location.get("alice"));assertNull(provider.location.get("bob"));
    }
    @Test void rejectsTwoSimultaneousWhisperMembershipsBeforeIo() {
        FakeProvider provider=new FakeProvider();
        assertThrows(IllegalArgumentException.class,()->new VoiceReconciler(provider).synchronize(List.of(
                new VoiceReconciler.ChannelPlan("one",Set.of("alice")),new VoiceReconciler.ChannelPlan("two",Set.of("alice"))),Set.of("alice"),Set.of()));
        assertTrue(provider.calls.isEmpty());
    }
    private static final class FakeProvider implements VoiceProvider {
        final Map<String,String> location=new HashMap<>();final Map<String,Set<String>> permissions=new HashMap<>();final List<String> calls=new ArrayList<>();
        boolean ignoreMoves,ignoreDisconnects,failPermissions;
        public boolean ready(){return true;}
        public MemberEligibility eligibility(String id){return new MemberEligibility(true,null);}
        public String findChannel(String name){return null;}
        public String ensureChannel(String name,String known,int capacity){return known==null?name:known;}
        public void setMembers(String id,Set<String> members){if(failPermissions)throw new IllegalStateException("provider rejected");calls.add("permissions:"+id);permissions.put(id,members);}
        public Set<String> occupants(String id){Set<String> out=new HashSet<>();location.forEach((user,channel)->{if(id.equals(channel))out.add(user);});return out;}
        public String currentChannel(String user){return location.get(user);}
        public void move(String user,String channel){calls.add("move:"+user);if(!ignoreMoves)location.put(user,channel);}
        public void disconnect(String user){calls.add("disconnect:"+user);if(!ignoreDisconnects)location.remove(user);}
        public void deleteChannel(String id){}
        boolean tryJoin(String user,String channel){if(!permissions.getOrDefault(channel,Set.of()).contains(user))return false;location.put(user,channel);return true;}
    }
}
