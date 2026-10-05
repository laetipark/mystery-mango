package com.mysterymango.game;

import com.mysterymango.common.ApiException;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class ScenarioValidatorTest {
    private final ScenarioValidator validator=new ScenarioValidator();
    @SuppressWarnings("unchecked") private Map<String,Object> sample(String name)throws Exception {try(var in=getClass().getResourceAsStream("/scenarios/"+name+".json")){return new JsonMapper().readValue(in,Map.class);}}
    @Test void allOriginalStoriesHaveValidFinitePaths()throws Exception {for(String name:List.of("after-hours-gallery","midnight-last-passenger","rain-soaked-villa","locker-at-twelve","snowbound-last-parcel"))validator.validate(sample(name));}
    @Test void oneThroughFourPlayersRequireExactlyTheSameNumberOfRoles()throws Exception {
        for(int count=1;count<=4;count++) {
            var d=sample("after-hours-gallery");d.put("playerCount",count);
            var roles=new ArrayList<>(Definitions.objects(d.get("roles")).subList(0,count));
            for(var role:roles)role.put("objective",Map.of("text","조건 검증","condition",Map.of("type","ALWAYS")));
            d.put("roles",roles);d.put("rules",List.of());
            Definitions.map(d.get("ballot")).put("culpritRoleId",roles.getFirst().get("id"));
            for(var ending:Definitions.objects(d.get("endings")))ending.put("condition",Map.of("type","ALWAYS"));
            validator.validate(d);
            d.put("playerCount",count==4?3:count+1);
            assertThrows(ApiException.class,()->validator.validate(d));
        }
    }
    @Test void rejectsNonIntegralAndOutOfRangePlayerCounts()throws Exception {
        for(Object count:List.of(0,5,-1,1.5,"2")) {
            var d=sample("after-hours-gallery");d.put("playerCount",count);
            assertThrows(ApiException.class,()->validator.validate(d));
        }
    }
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
