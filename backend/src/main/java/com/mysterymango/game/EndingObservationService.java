package com.mysterymango.game;

import com.mysterymango.common.*;
import com.mysterymango.scenario.ScenarioService;
import java.time.Instant;
import java.util.*;
import org.springframework.stereotype.Service;
import static com.mysterymango.game.Definitions.*;

/** 시험 결과의 관찰 기록. 구조 검증이나 모든 분기의 도달 가능성을 대신하지 않는다. */
@Service
public class EndingObservationService {
    private final Db db;
    private final Json json;
    private final Commands commands;
    private final ScenarioService scenarios;

    public EndingObservationService(Db db,Json json,Commands commands,ScenarioService scenarios){
        this.db=db;this.json=json;this.commands=commands;this.scenarios=scenarios;
    }

    // 호출자는 엔진 전이와 같은 Commands 트랜잭션 안에서 실행한다.
    void recordSandbox(UUID sandboxId,UUID actor,Instant reachedAt){
        var row=db.one("select r.state,r.version_id,r.game_type,s.owner_id from sandbox_run r join scenario_version v on v.id=r.version_id join scenario s on s.id=v.scenario_id where r.id=?",sandboxId);
        if(!"MURDER_MYSTERY".equals(row.get("game_type")))return;
        String endingId=Db.str(json.object(row.get("state").toString()),"endingId");
        if(endingId==null||endingId.isBlank())return;
        scenarios.requireAuthorAccess(actor,Db.uuid(row,"version_id"));
        String kind=actor.equals(row.get("owner_id"))?"AUTHOR":"REVIEWER";
        db.update("insert into sandbox_ending_observation(sandbox_id,ending_id,observer_kind,observed_by,reached_at) values(?,?,?,?,?) on conflict do nothing",sandboxId,endingId,kind,actor,reachedAt);
    }

    void recordInvitedTest(UUID gameId,Instant reachedAt){
        db.update("insert into invited_test_ending_observation(game_id,ending_id,reached_at) select id,ending_id,? from game_session where id=? and is_test=true and game_type='MURDER_MYSTERY' and ending_id is not null on conflict do nothing",reachedAt,gameId);
    }

    public Map<String,Object> get(UUID actor,UUID versionId){
        return commands.transaction(()->{
            scenarios.requireAuthorAccess(actor,versionId);
            var version=db.one("select scenario_id,author_revision,definition from scenario_version where id=?",versionId);
            var definition=json.object(version.get("definition").toString());
            var endings=new ArrayList<Map<String,Object>>();
            int reached=0;
            if("MURDER_MYSTERY".equals(definition.getOrDefault("gameType","MURDER_MYSTERY"))){
                // 엔딩 제목 역시 비공개 작품 자료이므로 DTO를 반환하기 전에 노출을 기록한다.
                db.update("insert into scenario_exposure(user_id,scenario_id) values(?,?) on conflict do nothing",actor,version.get("scenario_id"));
                db.update("insert into scenario_exposure_source(user_id,version_id,source) values(?,?,'AUTHOR_PREVIEW') on conflict do nothing",actor,versionId);
                var observed=new HashMap<String,Map<String,Object>>();
                for(var row:db.list("""
                    select ending_id,
                        min(reached_at) filter (where source='AUTHOR') author_at,
                        min(reached_at) filter (where source='REVIEWER') reviewer_at,
                        min(reached_at) filter (where source='INVITED_TEST') invited_at
                    from (
                        select o.ending_id,o.observer_kind source,o.reached_at
                        from sandbox_ending_observation o join sandbox_run r on r.id=o.sandbox_id where r.version_id=?
                        union all
                        select o.ending_id,'INVITED_TEST' source,o.reached_at
                        from invited_test_ending_observation o join game_session g on g.id=o.game_id where g.scenario_version_id=?
                    ) observations group by ending_id
                    """,versionId,versionId))observed.put(Db.str(row,"ending_id"),row);
                for(var ending:objects(definition.get("endings"))){
                    var times=observed.get(str(ending,"id"));
                    if(times!=null)reached++;
                    endings.add(obj("endingId",str(ending,"id"),"title",str(ending,"title"),"authorReachedAt",times==null?null:Db.instant(times,"author_at"),"reviewerReachedAt",times==null?null:Db.instant(times,"reviewer_at"),"invitedTestReachedAt",times==null?null:Db.instant(times,"invited_at")));
                }
            }
            return obj("versionId",versionId,"authorRevision",version.get("author_revision"),"totalEndings",endings.size(),"reachedEndings",reached,"endings",endings);
        });
    }
}
