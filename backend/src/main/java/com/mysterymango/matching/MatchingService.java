package com.mysterymango.matching;

import com.mysterymango.common.*;
import com.mysterymango.scenario.ScenarioService;
import com.mysterymango.room.RoomService;
import com.mysterymango.voice.VoiceAccess;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.util.*;
import java.time.Instant;
import java.sql.Timestamp;
import static com.mysterymango.common.Json.map;

@Service
public class MatchingService {
    private final Db db;private final Activities activities;private final Commands commands;private final ScenarioService scenarios;private final RoomService rooms;private final Events events;private final VoiceAccess voice;private final int acceptSeconds,voteSeconds;
    public MatchingService(Db db,Activities activities,Commands commands,ScenarioService scenarios,RoomService rooms,Events events,VoiceAccess voice,@Value("${app.match-accept-seconds}")int acceptSeconds,@Value("${app.match-vote-seconds}")int voteSeconds){this.db=db;this.activities=activities;this.commands=commands;this.scenarios=scenarios;this.rooms=rooms;this.events=events;this.voice=voice;this.acceptSeconds=acceptSeconds;this.voteSeconds=voteSeconds;}
    public record TicketRequest(String language,int maxMinutes,String mode,String genre,String difficulty,boolean requeue){}
    public Map<String,Object> enqueue(UUID user,TicketRequest r){
        activities.requireIdle(user);if(!"ko".equals(r.language())||r.maxMinutes()<1||r.maxMinutes()>360||r.mode()==null||!Set.of("TEXT","DISCORD").contains(r.mode()))throw new ApiException(400,"INVALID_MATCH_CONDITIONS","언어·시간·모드 조건을 확인해 주세요.");
        if((r.genre()!=null&&r.genre().length()>50)||(r.difficulty()!=null&&r.difficulty().length()>20))throw new ApiException(400,"INVALID_MATCH_CONDITIONS","선호 조건이 너무 깁니다.");
        voice.requireEligible(user,r.mode());UUID id=UUID.randomUUID();db.update("insert into match_ticket(id,user_id,status,language,max_minutes,mode,genre,difficulty,requeue) values(?,?,'WAITING',?,?,?,?,?,?)",id,user,r.language(),r.maxMinutes(),r.mode(),r.genre(),r.difficulty(),r.requeue());activities.set(user,"QUEUED",id);return map("ticketId",id);
    }
    public Map<String,Object> ticket(UUID id,UUID user){var r=ownedTicket(id,user);return map("id",id,"status",r.get("status"),"queuedAt",Db.instant(r,"queued_at"),"proposalId",r.get("proposal_id"),"language",r.get("language"),"maxMinutes",r.get("max_minutes"),"mode",r.get("mode"),"genre",r.get("genre"),"difficulty",r.get("difficulty"),"requeue",r.get("requeue"));}
    public Map<String,Object> cancel(UUID id,UUID user){var r=ownedTicket(id,user);if("ROOM".equals(r.get("status")))throw new ApiException(409,"ACTIVITY_MOVED","모집방이 확정되었습니다. 현재 활동을 확인해 주세요.");if("CANCELLED".equals(r.get("status")))return map("ok",true);if("PROPOSED".equals(r.get("status")))end(Db.uuid(r,"proposal_id"),Set.of(user));else{db.update("update match_ticket set status='CANCELLED' where id=?",id);activities.release(user);}return map("ok",true);}
    public Map<String,Object> proposal(UUID id,UUID user){requireMember(id,user);var p=db.one("select * from match_proposal where id=?",id);var candidates=db.list("select * from match_candidate where proposal_id=? order by rank",id).stream().map(c->{var card=new LinkedHashMap<>(scenarios.publicVersion(Db.uuid(c,"scenario_version_id")));card.put("rank",c.get("rank"));return card;}).toList();
        var members=db.list("select m.*,u.display_name from match_member m join app_user u on u.id=m.user_id where proposal_id=? order by m.user_id",id).stream().map(m->map("userId",m.get("user_id"),"displayName",m.get("display_name"),"accepted",m.get("accepted"))).toList();
        return map("id",id,"status",p.get("status"),"expiresAt",Db.instant(p,"expires_at"),"roomId",p.get("room_id"),"members",members,"candidates",candidates,"myVote",db.one("select voted_version_id from match_member where proposal_id=? and user_id=?",id,user).get("voted_version_id"));
    }
    public Map<String,Object> accept(UUID id,UUID user){requireMember(id,user);var p=current(id,"ACCEPTING");db.update("update match_member set accepted=true where proposal_id=? and user_id=?",id,user);if(Db.num(db.one("select count(*) as n from match_member where proposal_id=? and accepted=false",id),"n")==0)db.update("update match_proposal set status='VOTING',expires_at=? where id=?",Timestamp.from(Instant.now().plusSeconds(voteSeconds)),id);notifyProposal(id);return map("ok",true);}
    public Map<String,Object> reject(UUID id,UUID user){requireMember(id,user);var p=db.one("select status from match_proposal where id=?",id);if("ROOM".equals(p.get("status")))throw new ApiException(409,"ACTIVITY_MOVED","이미 모집방이 확정되었습니다.");if(!"ENDED".equals(p.get("status")))end(id,Set.of(user));return map("ok",true);}
    public Map<String,Object> vote(UUID id,UUID user,UUID version){requireMember(id,user);current(id,"VOTING");if(db.optional("select 1 from match_candidate where proposal_id=? and scenario_version_id=?",id,version)==null)throw new ApiException(400,"INVALID_CANDIDATE","제시된 작품 중 선택해 주세요.");db.update("update match_member set voted_version_id=? where proposal_id=? and user_id=?",version,id,user);notifyProposal(id);return map("ok",true);}
    @Scheduled(fixedDelayString="${matching.tick-ms:1000}",initialDelayString="${matching.tick-ms:1000}") public void tick(){commands.transaction(()->{
        for(var p:db.list("select * from match_proposal where status in('ACCEPTING','VOTING') and expires_at<=now() order by created_at")){
            UUID id=Db.uuid(p,"id");if("ACCEPTING".equals(p.get("status"))){Set<UUID> excluded=new HashSet<>();for(var m:db.list("select user_id from match_member where proposal_id=? and accepted=false",id))excluded.add(Db.uuid(m,"user_id"));end(id,excluded);}else finalizeVote(id);
        }
        findGroup();return null;
    });}
    private void findGroup(){
        var tickets=db.list("select * from match_ticket where status='WAITING' order by queued_at,id limit 40");if(tickets.size()<4)return;
        var versions=db.list("select distinct on(scenario_id) id,scenario_id,definition from scenario_version where status='PUBLISHED' order by scenario_id,version desc");
        Map<UUID,Map<String,Object>> cards=new LinkedHashMap<>();for(var v:versions){var card=scenarios.publicVersion(Db.uuid(v,"id"));if(((Number)card.get("playerCount")).intValue()==4)cards.put(Db.uuid(v,"id"),card);}
        Map<UUID,Set<UUID>> eligible=new HashMap<>();for(var t:tickets){Set<UUID> ids=new LinkedHashSet<>();for(var entry:cards.entrySet())if(canPlay(t,entry.getValue()))ids.add(entry.getKey());eligible.put(Db.uuid(t,"id"),ids);}
        Set<String> blocks=new HashSet<>();for(var b:db.list("select user_id,blocked_id from user_block")){blocks.add(b.get("user_id")+":"+b.get("blocked_id"));blocks.add(b.get("blocked_id")+":"+b.get("user_id"));}
        List<Map<String,Object>> group=choose(tickets,eligible,blocks,0,new ArrayList<>(),null,new int[]{0});if(group==null)return;
        Set<UUID> common=new LinkedHashSet<>(eligible.get(Db.uuid(group.getFirst(),"id")));for(var t:group)common.retainAll(eligible.get(Db.uuid(t,"id")));
        var candidates=common.stream().sorted(Comparator.<UUID>comparingInt(v->-score(group,cards.get(v))).thenComparing(UUID::toString)).limit(3).toList();
        for(var t:group){var a=db.one("select * from player_activity where user_id=? for update",t.get("user_id"));if(!"QUEUED".equals(a.get("kind"))||!t.get("id").equals(a.get("reference_id")))return;try{voice.requireEligible(Db.uuid(t,"user_id"),Db.str(t,"mode"));}catch(ApiException e){db.update("update match_ticket set status='CANCELLED' where id=?",t.get("id"));activities.release(Db.uuid(t,"user_id"));return;}}
        UUID id=UUID.randomUUID();db.update("insert into match_proposal(id,status,expires_at) values(?,'ACCEPTING',?)",id,Timestamp.from(Instant.now().plusSeconds(acceptSeconds)));int rank=0;
        for(UUID v:candidates)db.update("insert into match_candidate(proposal_id,scenario_version_id,rank) values(?,?,?)",id,v,rank++);
        for(var t:group){db.update("insert into match_member(proposal_id,user_id,ticket_id) values(?,?,?)",id,t.get("user_id"),t.get("id"));db.update("update match_ticket set status='PROPOSED',proposal_id=? where id=?",id,t.get("id"));activities.set(Db.uuid(t,"user_id"),"PROPOSED",id);}notifyProposal(id);
    }
    private List<Map<String,Object>> choose(List<Map<String,Object>> tickets,Map<UUID,Set<UUID>> eligible,Set<String> blocks,int from,List<Map<String,Object>> selected,Set<UUID> common,int[] budget){
        if(selected.size()==4)return new ArrayList<>(selected);
        for(int i=from;i<tickets.size()&&++budget[0]<10000;i++){var t=tickets.get(i);if(!selected.isEmpty()&&(!Objects.equals(selected.getFirst().get("language"),t.get("language"))||!Objects.equals(selected.getFirst().get("mode"),t.get("mode"))))continue;
            if(selected.stream().anyMatch(s->blocks.contains(s.get("user_id")+":"+t.get("user_id"))))continue;
            Set<UUID> next=new LinkedHashSet<>(eligible.get(Db.uuid(t,"id")));if(common!=null)next.retainAll(common);if(next.isEmpty())continue;
            selected.add(t);var found=choose(tickets,eligible,blocks,i+1,selected,next,budget);selected.removeLast();if(found!=null)return found;
        }return null;
    }
    private boolean canPlay(Map<String,Object> ticket,Map<String,Object> card){return ((Number)card.get("playerCount")).intValue()==4&&Objects.equals(ticket.get("language"),card.get("language"))&&Db.num(ticket,"max_minutes")>=((Number)card.get("estimatedMinutes")).intValue()&&((List<?>)card.get("modes")).contains(ticket.get("mode"))&&db.optional("select 1 from scenario_exposure where user_id=? and scenario_id=?",ticket.get("user_id"),card.get("id"))==null;}
    private int score(List<Map<String,Object>> group,Map<String,Object> card){int score=0;for(var t:group){if(Objects.equals(t.get("genre"),card.get("genre")))score+=2;if(Objects.equals(t.get("difficulty"),card.get("difficulty")))score++;}return score;}
    private void finalizeVote(UUID id){
        var selected=db.optional("select c.scenario_version_id,count(m.user_id) as n,c.rank from match_candidate c left join match_member m on m.proposal_id=c.proposal_id and m.voted_version_id=c.scenario_version_id where c.proposal_id=? group by c.scenario_version_id,c.rank having count(m.user_id)>0 order by n desc,c.rank limit 1",id);
        if(selected==null){end(id,new HashSet<>(users(id)));return;}
        UUID version=Db.uuid(selected,"scenario_version_id");var members=db.list("select t.* from match_member m join match_ticket t on t.id=m.ticket_id where m.proposal_id=? order by t.queued_at,t.id",id);List<UUID> users=users(id);
        if(db.optional("select 1 from scenario_version where id=? and status='PUBLISHED'",version)==null){end(id,Set.of());return;}
        var card=scenarios.publicVersion(version);boolean valid=members.size()==4;
        for(var t:members){var activity=db.one("select * from player_activity where user_id=?",t.get("user_id"));valid&="PROPOSED".equals(activity.get("kind"))&&id.equals(activity.get("reference_id"))&&canPlay(t,card);try{voice.requireEligible(Db.uuid(t,"user_id"),Db.str(t,"mode"));}catch(ApiException e){valid=false;}}
        for(UUID a:users)for(UUID b:users)if(db.optional("select 1 from user_block where user_id=? and blocked_id=?",a,b)!=null)valid=false;
        if(!valid){end(id,Set.of());return;}
        for(UUID user:users)activities.release(user);
        UUID host=Db.uuid(members.getFirst(),"user_id");UUID room=(UUID)rooms.create(host,version,"PUBLIC",Db.str(members.getFirst(),"mode")).get("roomId");
        for(UUID user:users)if(!user.equals(host))rooms.join(room,user,null);
        db.update("update match_ticket set status='ROOM' where proposal_id=?",id);db.update("update match_proposal set status='ROOM',room_id=? where id=?",room,id);notifyProposal(id);
    }
    private void end(UUID id,Set<UUID> excluded){
        for(var m:db.list("select t.* from match_member m join match_ticket t on t.id=m.ticket_id where m.proposal_id=?",id)){
            UUID user=Db.uuid(m,"user_id");boolean requeue=Boolean.TRUE.equals(m.get("requeue"))&&!excluded.contains(user);
            db.update("update match_ticket set status=?,proposal_id=null where id=?",requeue?"WAITING":"CANCELLED",m.get("id"));if(requeue)activities.set(user,"QUEUED",Db.uuid(m,"id"));else activities.release(user);
        }db.update("update match_proposal set status='ENDED' where id=?",id);notifyProposal(id);
    }
    public void requireMember(UUID id,UUID user){if(db.optional("select 1 from match_member where proposal_id=? and user_id=?",id,user)==null)throw new ApiException(403,"MATCH_MEMBERSHIP_REQUIRED","이 매칭의 참가자가 아닙니다.");}
    private Map<String,Object> ownedTicket(UUID id,UUID user){return db.one("select * from match_ticket where id=? and user_id=?",id,user);}
    private Map<String,Object> current(UUID id,String state){var p=db.one("select * from match_proposal where id=? for update",id);if(!state.equals(p.get("status"))||!Db.instant(p,"expires_at").isAfter(Instant.now()))throw new ApiException(409,"MATCH_STATE_CHANGED","매칭 상태가 변경되었거나 시간이 만료되었습니다.");return p;}
    private List<UUID> users(UUID id){return db.list("select user_id from match_member where proposal_id=?",id).stream().map(m->Db.uuid(m,"user_id")).toList();}
    private void notifyProposal(UUID id){events.emit(users(id),"MATCH_CHANGED",null,0);}
}
