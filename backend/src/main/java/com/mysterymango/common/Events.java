package com.mysterymango.common;
import org.springframework.stereotype.Component;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import java.util.*;
@Component
public class Events {
    private final Db db; private final SimpMessagingTemplate messaging;
    public Events(Db db,SimpMessagingTemplate messaging){this.db=db;this.messaging=messaging;}
    public void emit(Collection<UUID> users,String type,UUID gameId,long version){for(UUID user:users)db.update("insert into event_outbox(id,user_id,type,game_id,state_version) values(?,?,?,?,?)",UUID.randomUUID(),user,type,gameId,version);}
    @Scheduled(fixedDelay=500)
    public void dispatch(){
        for(var event:db.list("select * from event_outbox where sent_at is null order by created_at limit 100")){
            UUID gameId=Db.uuid(event,"game_id"),user=Db.uuid(event,"user_id");
            boolean allowed=gameId==null||db.optional("select 1 from player_role where game_id=? and user_id=? and active=true",gameId,user)!=null;
            if(allowed) messaging.convertAndSendToUser(user.toString(),"/queue/events",Json.map("eventId",event.get("id"),"type",event.get("type"),"gameId",gameId,"stateVersion",event.get("state_version"),"serverTime",Db.instant(event,"created_at")));
            db.update("update event_outbox set sent_at=now() where id=?",event.get("id"));
        }
    }
}

