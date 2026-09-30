package com.mysterymango.scenario;
import com.mysterymango.common.*;
import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController @RequestMapping("/api/v1/scenarios")
public class ScenarioController {
    private final ScenarioService scenarios;private final Db db;
    public ScenarioController(ScenarioService scenarios,Db db){this.scenarios=scenarios;this.db=db;}
    @GetMapping public Map<String,Object> list(@RequestParam(defaultValue="0")int page,@RequestParam(defaultValue="20")int size,@RequestParam(required=false)String genre,@RequestParam(required=false)String difficulty,@RequestParam(required=false)Integer maxMinutes){return scenarios.list(page,size,genre,difficulty,maxMinutes);}
    @GetMapping("/{id}") public Map<String,Object> detail(@PathVariable UUID id){return scenarios.publicVersion(Db.uuid(db.one("select id from scenario_version where scenario_id=? and status='PUBLISHED' order by version desc limit 1",id),"id"));}
}

