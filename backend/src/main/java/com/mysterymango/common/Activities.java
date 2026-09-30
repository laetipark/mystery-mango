package com.mysterymango.common;
import org.springframework.stereotype.Component;
import java.util.UUID;
@Component
public class Activities {
    private final Db db;
    public Activities(Db db){this.db=db;}
    public void requireIdle(UUID id){if(!"IDLE".equals(db.one("select kind from player_activity where user_id=? for update",id).get("kind")))throw new ApiException(409,"ACTIVITY_CONFLICT","이미 매칭 또는 게임에 참가하고 있습니다.");}
    public void set(UUID id,String kind,UUID ref){db.update("update player_activity set kind=?,reference_id=?,updated_at=now() where user_id=?",kind,ref,id);}
    public void release(UUID id){set(id,"IDLE",null);}
}

