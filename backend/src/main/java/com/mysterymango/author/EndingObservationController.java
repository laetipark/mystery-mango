package com.mysterymango.author;

import com.mysterymango.auth.Actor;
import com.mysterymango.game.EndingObservationService;
import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/author/versions")
public class EndingObservationController {
    private final EndingObservationService service;
    public EndingObservationController(EndingObservationService service){this.service=service;}
    @GetMapping("/{versionId}/ending-observations")
    public Map<String,Object> get(@PathVariable UUID versionId){return service.get(Actor.id(),versionId);}
}
