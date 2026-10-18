package com.mysterymango.game;

import com.mysterymango.auth.Actor;
import com.mysterymango.common.*;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1")
public class RuntimeController {
    private final Commands commands;private final BoardRuntimeService boards;private final SandboxService sandboxes;
    public RuntimeController(Commands commands,BoardRuntimeService boards,SandboxService sandboxes){this.commands=commands;this.boards=boards;this.sandboxes=sandboxes;}
    public record BoardCommand(String type,long expectedVersion,Map<String,Object> payload){}
    public record SandboxCreate(UUID versionId,int capacity){}
    public record SandboxCommand(int seat,String type,long expectedVersion,Map<String,Object> payload){}
    public record SceneChange(String sceneId){}
    @GetMapping("/games/{id}/kind") public Map<String,Object> kind(@PathVariable UUID id){return boards.kind(id,Actor.id());}
    @GetMapping("/games/{id}/board-snapshot") public Map<String,Object> board(@PathVariable UUID id){return boards.snapshot(id,Actor.id());}
    @PostMapping("/games/{id}/board-commands") public Map<String,Object> command(@PathVariable UUID id,@RequestHeader("Idempotency-Key")String key,@RequestBody BoardCommand r){return commands.run(Actor.id(),key,"board:"+id,r,()->boards.command(id,Actor.id(),r.type(),r.expectedVersion(),r.payload()==null?Map.of():r.payload()),response->{if(!"LEAVE".equals(r.type()))boards.authorize(id,Actor.id());});}
    @PostMapping("/games/{id}/scene") public Map<String,Object> scene(@PathVariable UUID id,@RequestHeader("Idempotency-Key")String key,@RequestBody SceneChange r){return commands.run(Actor.id(),key,"scene:"+id,r,()->boards.changeScene(id,Actor.id(),r.sceneId()),response->boards.authorize(id,Actor.id()));}
    @PostMapping("/author/sandboxes") public Map<String,Object> create(@RequestHeader("Idempotency-Key")String key,@RequestBody SandboxCreate r){return commands.run(Actor.id(),key,"sandbox.create",r,()->sandboxes.create(Actor.id(),r.versionId(),r.capacity()),response->sandboxes.authorize(UUID.fromString(response.get("id").toString()),Actor.id()));}
    @GetMapping("/author/sandboxes/{id}") public Map<String,Object> sandbox(@PathVariable UUID id,@RequestParam(defaultValue="0")int seat){return sandboxes.snapshot(id,Actor.id(),seat);}
    @PostMapping("/author/sandboxes/{id}/commands") public Map<String,Object> sandboxCommand(@PathVariable UUID id,@RequestHeader("Idempotency-Key")String key,@RequestBody SandboxCommand r){return commands.run(Actor.id(),key,"sandbox.command:"+id,r,()->sandboxes.command(id,Actor.id(),r.seat(),r.type(),r.expectedVersion(),r.payload()==null?Map.of():r.payload()),response->sandboxes.authorize(id,Actor.id()));}
}
