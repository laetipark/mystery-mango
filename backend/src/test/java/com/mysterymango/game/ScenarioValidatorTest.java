package com.mysterymango.game;

import com.mysterymango.common.ApiException;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class ScenarioValidatorTest {
    private final ScenarioValidator validator=new ScenarioValidator();
    @SuppressWarnings("unchecked") private Map<String,Object> sample(String name)throws Exception {try(var in=getClass().getResourceAsStream("/scenarios/"+name+".json")){return new JsonMapper().readValue(in,Map.class);}}
    @Test void allOriginalStoriesHaveValidFinitePaths()throws Exception {for(String name:List.of("after-hours-gallery","midnight-last-passenger","rain-soaked-villa"))validator.validate(sample(name));}
    @Test void rejectsSecretReferencesAndExecutableEffects()throws Exception {
        var d=sample("after-hours-gallery");var rules=Definitions.objects(d.get("rules"));rules.getFirst().put("effects",List.of(Map.of("type","EXECUTE_SQL","text","delete from app_user")));
        assertThrows(ApiException.class,()->validator.validate(d));
        var other=sample("after-hours-gallery");Definitions.objects(other.get("targets")).getFirst().put("clueIds",List.of("unknown"));assertThrows(ApiException.class,()->validator.validate(other));
    }
    @Test void rejectsMissingFallbackAndRepeatedIds()throws Exception {
        var d=sample("after-hours-gallery");Definitions.objects(d.get("endings")).getLast().put("condition",Map.of("type","CULPRIT_IDENTIFIED"));assertThrows(ApiException.class,()->validator.validate(d));
        var other=sample("after-hours-gallery");Definitions.objects(other.get("roles")).get(1).put("id",Definitions.objects(other.get("roles")).getFirst().get("id"));assertThrows(ApiException.class,()->validator.validate(other));
    }
}
