package com.mysterymango.game;

import com.mysterymango.auth.Actor;
import com.mysterymango.common.*;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.function.Supplier;

@RestController
@RequestMapping("/api/v1")
public class GameController {
    private final GameService games; private final Commands commands;
    public GameController(GameService games,Commands commands){this.games=games;this.commands=commands;}
    @GetMapping("/games/{id}/snapshot") public Map<String,Object> snapshot(@PathVariable UUID id){return games.snapshot(id,Actor.id());}
    @GetMapping("/games/{id}/me/role") public Map<String,Object> role(@PathVariable UUID id){return games.role(id,Actor.id());}
    @PostMapping("/games/{id}/investigations") public Map<String,Object> investigate(@PathVariable UUID id,@RequestHeader("Idempotency-Key") String key,@RequestBody Map<String,Object> body){return run(id,key,"investigate",body,()->games.investigate(id,Actor.id(),string(body,"targetId")));}
    @PostMapping("/games/{id}/clue-shares") public Map<String,Object> share(@PathVariable UUID id,@RequestHeader("Idempotency-Key") String key,@RequestBody Map<String,Object> body){return run(id,key,"share",body,()->games.share(id,Actor.id(),string(body,"clueId"),string(body,"scope"),uuid(body,"whisperId")));}
    @PutMapping("/games/{id}/ballots/{ballotId}/me") public Map<String,Object> vote(@PathVariable UUID id,@PathVariable UUID ballotId,@RequestHeader("Idempotency-Key") String key,@RequestBody Map<String,Object> body){return run(id,key,"vote/"+ballotId,body,()->games.vote(id,Actor.id(),ballotId,body.get("roleId")==null?null:string(body,"roleId")));}
    @GetMapping("/games/{id}/messages") public Map<String,Object> messages(@PathVariable UUID id,@RequestParam(required=false) UUID whisperId,@RequestParam(required=false) UUID before,@RequestParam(defaultValue="50") int size){return games.messages(id,Actor.id(),whisperId,before,size);}
    @PostMapping("/games/{id}/messages") public Map<String,Object> message(@PathVariable UUID id,@RequestHeader("Idempotency-Key") String key,@RequestBody Map<String,Object> body){return run(id,key,"message",body,()->games.message(id,Actor.id(),string(body,"text"),uuid(body,"whisperId")));}
    @PostMapping("/games/{id}/whispers") public Map<String,Object> invite(@PathVariable UUID id,@RequestHeader("Idempotency-Key") String key,@RequestBody Map<String,Object> body){return run(id,key,"whisper",body,()->games.inviteWhisper(id,Actor.id(),uuid(body,"inviteeId")));}
    @PostMapping("/games/{id}/whispers/{wid}/accept") public Map<String,Object> accept(@PathVariable UUID id,@PathVariable UUID wid,@RequestHeader("Idempotency-Key") String key){return run(id,key,"whisper/"+wid+"/accept",Map.of(),()->games.acceptWhisper(id,Actor.id(),wid));}
    @PostMapping("/games/{id}/whispers/{wid}/leave") public Map<String,Object> leave(@PathVariable UUID id,@PathVariable UUID wid,@RequestHeader("Idempotency-Key") String key){return run(id,key,"whisper/"+wid+"/leave",Map.of(),()->games.leaveWhisper(id,Actor.id(),wid));}
    @PostMapping("/games/{id}/heartbeat") public Map<String,Object> heartbeat(@PathVariable UUID id){return games.heartbeat(id,Actor.id());}
    @PostMapping("/games/{id}/phase-ready") public Map<String,Object> ready(@PathVariable UUID id,@RequestHeader("Idempotency-Key") String key){return run(id,key,"phase-ready",Map.of(),()->games.phaseReady(id,Actor.id()));}
    @PostMapping("/games/{id}/abort-vote") public Map<String,Object> abort(@PathVariable UUID id,@RequestHeader("Idempotency-Key") String key){return run(id,key,"abort-vote",Map.of(),()->games.abortVote(id,Actor.id()));}
    @PostMapping("/games/{id}/leave") public Map<String,Object> leaveGame(@PathVariable UUID id,@RequestHeader("Idempotency-Key") String key){return commands.run(Actor.id(),key,"games/"+id+"/leave",Map.of(),()->games.leaveGame(id,Actor.id()));}
    @GetMapping("/me/history") public Map<String,Object> history(@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size){return games.history(Actor.id(),page,size);}
    private Map<String,Object> run(UUID id,String key,String scope,Object body,Supplier<Map<String,Object>> action){return commands.run(Actor.id(),key,"games/"+id+"/"+scope,body,action,result->{if(!games.isParticipant(id,Actor.id()))throw new ApiException(403,"GAME_ACCESS_DENIED","이 게임에 접근할 권한이 없습니다.");});}
    private String string(Map<String,Object> body,String key){Object value=body.get(key);if(!(value instanceof String))throw new ApiException(422,"INVALID_INPUT","입력 값을 확인해 주세요: "+key);return (String)value;}
    private UUID uuid(Map<String,Object> body,String key){Object value=body.get(key);if(value==null)return null;try{return UUID.fromString(String.valueOf(value));}catch(IllegalArgumentException e){throw new ApiException(422,"INVALID_INPUT","식별자가 올바르지 않습니다.");}}
}
