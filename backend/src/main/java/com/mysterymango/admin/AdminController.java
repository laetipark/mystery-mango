package com.mysterymango.admin;
import com.mysterymango.auth.Actor;
import com.mysterymango.common.*;
import com.mysterymango.scenario.ScenarioService;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import static com.mysterymango.common.Json.map;
@RestController @RequestMapping("/api/v1/admin")
public class AdminController {
    private final Db db;private final Json json;private final Commands commands;private final ScenarioService scenarios;
    public AdminController(Db db,Json json,Commands commands,ScenarioService scenarios){this.db=db;this.json=json;this.commands=commands;this.scenarios=scenarios;}
    public record Definition(Map<String,Object> definition){}
    @GetMapping("/scenarios") public Map<String,Object> scenarios(@RequestParam(defaultValue="0")int page,@RequestParam(defaultValue="20")int size){int limit=Math.clamp(size,1,50);return map("items",db.list("select id,version,status,definition->>'title' as title from scenario_version order by created_at desc limit ? offset ?",limit,Math.max(0,page)*limit).stream().map(r->map("id",r.get("id"),"versionId",r.get("id"),"title",r.get("title"),"status",r.get("status"),"version",r.get("version"))).toList(),"total",db.one("select count(*) as n from scenario_version").get("n"),"page",page,"size",limit);}
    @PostMapping("/scenarios/validate") public Map<String,Object> validate(@RequestBody Definition r){scenarios.validate(r.definition());return map("valid",true);}
    @PostMapping("/scenarios") public Map<String,Object> create(@RequestHeader("Idempotency-Key")String key,@RequestBody Definition r){return commands.run(Actor.id(),key,"scenario.create",r,()->map("versionId",scenarios.save(r.definition(),false)));}
    @PostMapping("/scenarios/{id}/publish") public Map<String,Object> publish(@PathVariable UUID id,@RequestHeader("Idempotency-Key")String key){return commands.run(Actor.id(),key,"scenario.publish:"+id,Map.of(),()->{scenarios.publishSystem(id);return map("ok",true);});}
    @GetMapping("/reports") public Map<String,Object> reports(@RequestParam(defaultValue="0")int page,@RequestParam(defaultValue="20")int size){int limit=Math.clamp(size,1,50);return map("items",db.list("select id,reporter_id,target_user_id,game_id,reason,status,created_at from report order by created_at desc limit ? offset ?",limit,Math.max(0,page)*limit).stream().map(r->map("id",r.get("id"),"reporterId",r.get("reporter_id"),"targetUserId",r.get("target_user_id"),"gameId",r.get("game_id"),"reason",r.get("reason"),"status",r.get("status"),"createdAt",Db.instant(r,"created_at"))).toList(),"total",db.one("select count(*) as n from report").get("n"),"page",page,"size",limit);}
}
