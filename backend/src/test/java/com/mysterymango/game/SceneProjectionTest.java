package com.mysterymango.game;

import org.junit.jupiter.api.Test;
import java.util.*;
import static com.mysterymango.game.Definitions.*;
import static org.junit.jupiter.api.Assertions.*;

class SceneProjectionTest {
    @Test void phaseRoleAndClueBindingsFilterPayloadBeforeDelivery(){var service=new SceneService(null,null);var presentation=obj("scenes",List.of(
        obj("id","now","kind","SCENE","name","현재","phaseIds",List.of("investigation"),"nodes",List.of(obj("id","public","kind","TEXT","text","공용","bindingType","NONE","hidden",true),obj("id","other","kind","TEXT","text","다른 역할 비밀","bindingType","ROLE","bindingId","b"),obj("id","evidence","kind","IMAGE","assetId","private-art","bindingType","CLUE","bindingId","c"))),
        obj("id","later","kind","SCENE","name","이후","phaseIds",List.of("ending"),"nodes",List.of()),obj("id","role-b","kind","ROLE","referenceId","b","nodes",List.of()),obj("id","clue-c","kind","CLUE","referenceId","c","nodes",List.of())));
        var first=service.project(presentation,Map.of(),"investigation","a",Set.of(),"later",true);assertEquals("now",map(first.get("scene")).get("id"));assertEquals(1,objects(map(first.get("scene")).get("nodes")).size());assertFalse(objects(map(first.get("scene")).get("nodes")).getFirst().containsKey("hidden"));assertEquals(0,objects(first.get("layouts")).size());assertEquals(1,objects(first.get("availableScenes")).size());
        var granted=service.project(presentation,Map.of(),"investigation","a",Set.of("c"),null,false);assertEquals(2,objects(map(granted.get("scene")).get("nodes")).size());assertEquals(1,objects(granted.get("layouts")).size());assertEquals(false,granted.get("canChangeScene"));
    }
}
