package com.mysterymango.author;

import com.mysterymango.auth.Actor;
import com.mysterymango.common.*;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController @RequestMapping("/api/v1/author/works")
public class AuthorController {
    private final AuthorService service;private final Commands commands;
    public AuthorController(AuthorService service,Commands commands){this.service=service;this.commands=commands;}
    public record Create(String title,String gameType,String templateId){}
    public record Save(long revision,Map<String,Object> document){}
    public record Revision(long revision){}
    public record Validate(Long revision){}
    @GetMapping public Map<String,Object> list(){return service.list(Actor.id());}
    @PostMapping public Map<String,Object> create(@RequestHeader("Idempotency-Key")String key,@RequestBody Create body){UUID actor=Actor.id();return commands.run(actor,key,"author.create",body,()->service.create(actor,body.title(),body.gameType(),body.templateId()),r->service.owned(actor,UUID.fromString(r.get("id").toString())));}
    @GetMapping("/{id}") public Map<String,Object> get(@PathVariable UUID id){return service.get(Actor.id(),id);}
    @GetMapping("/{id}/versions/{versionId}") public Map<String,Object> getVersion(@PathVariable UUID id,@PathVariable UUID versionId){return service.getVersion(Actor.id(),id,versionId);}
    @PutMapping("/{id}") public Map<String,Object> save(@PathVariable UUID id,@RequestHeader("Idempotency-Key")String key,@RequestBody Save body){UUID actor=Actor.id();return commands.run(actor,key,"author.save:"+id,body,()->service.save(actor,id,body.revision(),body.document()),r->service.owned(actor,id));}
    @PostMapping("/{id}/validate") public Map<String,Object> validate(@PathVariable UUID id,@RequestBody(required=false)Validate body){return service.validate(Actor.id(),id,body==null?null:body.revision());}
    @PostMapping("/{id}/freeze") public Map<String,Object> freeze(@PathVariable UUID id,@RequestHeader("Idempotency-Key")String key,@RequestBody Revision body){UUID actor=Actor.id();return commands.run(actor,key,"author.freeze:"+id,body,()->Json.map("versionId",service.freeze(actor,id,body.revision())),r->service.owned(actor,id));}
    @PostMapping("/{id}/submit") public Map<String,Object> submit(@PathVariable UUID id,@RequestHeader("Idempotency-Key")String key,@RequestBody Revision body){UUID actor=Actor.id();return commands.run(actor,key,"author.submit:"+id,body,()->service.submit(actor,id,body.revision()),r->service.owned(actor,id));}
}
