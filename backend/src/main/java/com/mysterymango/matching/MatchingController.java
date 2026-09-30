package com.mysterymango.matching;
import com.mysterymango.auth.Actor;
import com.mysterymango.common.Commands;
import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController @RequestMapping("/api/v1")
public class MatchingController {
    private final MatchingService service;private final Commands commands;
    public MatchingController(MatchingService service,Commands commands){this.service=service;this.commands=commands;}
    public record Vote(UUID scenarioVersionId){}
    @PostMapping("/match-tickets") public Map<String,Object> enqueue(@RequestHeader("Idempotency-Key")String key,@RequestBody MatchingService.TicketRequest r){return commands.run(Actor.id(),key,"match.enqueue",r,()->service.enqueue(Actor.id(),r));}
    @GetMapping("/match-tickets/{id}") public Map<String,Object> ticket(@PathVariable UUID id){return service.ticket(id,Actor.id());}
    @DeleteMapping("/match-tickets/{id}") public Map<String,Object> cancel(@PathVariable UUID id,@RequestHeader("Idempotency-Key")String key){return commands.run(Actor.id(),key,"match.cancel:"+id,Map.of(),()->service.cancel(id,Actor.id()));}
    @GetMapping("/match-proposals/{id}") public Map<String,Object> proposal(@PathVariable UUID id){return service.proposal(id,Actor.id());}
    @PostMapping("/match-proposals/{id}/accept") public Map<String,Object> accept(@PathVariable UUID id,@RequestHeader("Idempotency-Key")String key){service.requireMember(id,Actor.id());return commands.run(Actor.id(),key,"match.accept:"+id,Map.of(),()->service.accept(id,Actor.id()));}
    @PostMapping("/match-proposals/{id}/reject") public Map<String,Object> reject(@PathVariable UUID id,@RequestHeader("Idempotency-Key")String key){service.requireMember(id,Actor.id());return commands.run(Actor.id(),key,"match.reject:"+id,Map.of(),()->service.reject(id,Actor.id()));}
    @PutMapping("/match-proposals/{id}/scenario-vote") public Map<String,Object> vote(@PathVariable UUID id,@RequestHeader("Idempotency-Key")String key,@RequestBody Vote r){service.requireMember(id,Actor.id());return commands.run(Actor.id(),key,"match.vote:"+id,r,()->service.vote(id,Actor.id(),r.scenarioVersionId()));}
}
