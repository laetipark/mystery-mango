package com.mysterymango.author;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AuthorTemplateController {
    @GetMapping("/api/v1/author/templates")
    public Map<String,Object> list(){return Map.of("items",AuthorTemplates.catalog());}
}
