package com.mysterymango.author;

import com.mysterymango.auth.Actor;
import com.mysterymango.common.*;
import com.mysterymango.room.RoomService;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/author/works/{workId}/test-room")
public class AuthorTestRoomController {
    private final Commands commands;private final Db db;private final RoomService rooms;
    public AuthorTestRoomController(Commands commands,Db db,RoomService rooms){this.commands=commands;this.db=db;this.rooms=rooms;}
    public record Create(UUID versionId,Integer capacity,String mode,String inviteToken){}
    @PostMapping public Map<String,Object> create(@PathVariable UUID workId,@RequestHeader("Idempotency-Key")String key,@RequestBody Create request){
        UUID actor=Actor.id();
        return commands.run(actor,key,"author.test-room:"+workId,request,()->{
            requireVersion(workId,request.versionId(),actor);
            return rooms.createTest(actor,request.versionId(),request.capacity(),request.mode(),request.inviteToken());
        },result->{requireVersion(workId,request.versionId(),actor);rooms.authorizeInviteResponse(UUID.fromString(result.get("roomId").toString()),actor,request.inviteToken());});
    }
    private void requireVersion(UUID work,UUID version,UUID actor){
        if(db.optional("select 1 from author_work w join scenario_version v on v.scenario_id=w.scenario_id where w.id=? and w.owner_id=? and v.id=?",work,actor,version)==null)throw new ApiException(404,"WORK_VERSION_NOT_FOUND","내 작품의 시험 버전을 선택해 주세요.");
    }
}
