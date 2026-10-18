package com.mysterymango.author;

import com.mysterymango.auth.Actor;
import com.mysterymango.common.Commands;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController @RequestMapping("/api/v1/admin/scenario-reviews")
public class ReviewController {
    private final AuthorService service;private final Commands commands;
    public ReviewController(AuthorService service,Commands commands){this.service=service;this.commands=commands;}
    public record Decision(String decision,String note){}
    @GetMapping public Map<String,Object> list(){return service.reviews(Actor.id());}
    @GetMapping("/{id}") public Map<String,Object> get(@PathVariable UUID id){return service.review(Actor.id(),id);}
    @PostMapping("/{id}/decision") public Map<String,Object> decide(@PathVariable UUID id,@RequestHeader("Idempotency-Key")String key,@RequestBody Decision body){UUID actor=Actor.id();return commands.run(actor,key,"author.review:"+id,body,()->service.decide(actor,id,body.decision(),body.note()),r->service.requireAdmin(actor));}
}
