package com.mysterymango.author;

import com.mysterymango.common.*;
import com.mysterymango.game.ScenarioValidator;
import java.util.*;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;
import static org.junit.jupiter.api.Assertions.*;

class CollectedValidationTest {
    private final ScenarioValidator validator=new ScenarioValidator();
    private final JsonMapper json=new JsonMapper();
    @Test void systemGamesAndEveryTemplateShareStrictAndCollectedChecks()throws Exception{
        for(String slug:List.of("after-hours-gallery","midnight-last-passenger","rain-soaked-villa","locker-at-twelve","snowbound-last-parcel","starter-tabletop","starter-yacht","classic-gomoku","classic-reversi","classic-checkers")){
            try(var input=getClass().getResourceAsStream("/scenarios/"+slug+".json")){
                @SuppressWarnings("unchecked") var document=json.readValue(input,Map.class);
                assertTrue(validator.collect(document).valid(),slug);assertDoesNotThrow(()->validator.validate(document));
            }
        }
        for(var template:AuthorTemplates.catalog()){
            var document=AuthorTemplates.create("검증 작품",null,"validation-template",template.get("id").toString());
            assertEquals(!Boolean.TRUE.equals(template.get("blank")),validator.collect(document).valid(),template.get("id").toString());assertStrictParity(document);
        }
    }
    @Test void independentFieldsHaveStablePathsAndDoNotModifyTheDocument()throws Exception{
        var d=work("MURDER_MYSTERY");d.put("title","");row(d,"roles",1).put("secret","");
        object(row(d,"roles",0).get("objective")).put("condition",Json.map("type","HAS_CLUE","clueId","missing"));
        row(d,"phases",1).put("durationSeconds",0);row(d,"targets",0).put("clueIds",List.of("missing"));scene(d).put("width",-1);
        String before=json.writeValueAsString(d);var result=validator.collect(d);
        assertTrue(paths(result).containsAll(Set.of("title","roles[1].secret","roles[0].objective.condition.clueId","phases[1].durationSeconds","targets[0].clueIds[0]","presentation.scenes[0].width")),paths(result).toString());
        assertEquals(result.issues(),validator.collect(d).issues());assertEquals(before,json.writeValueAsString(d));assertFalse(result.truncated());assertStrictParity(d);
    }
    @Test void malformedSubtreesAndNullRootNeverCauseCastOrIndexFailures(){
        var d=work("MURDER_MYSTERY");d.put("roles",null);d.put("phases",List.of());d.put("clues","not-a-list");d.put("ballot",false);
        d.put("supportedPlayerCounts",Arrays.asList("two",null));d.put("rules",List.of(Json.map("id","rule","when","PHASE_STARTED","condition",null,"effects",false)));
        d.put("presentation",Json.map("scenes",List.of("not-a-scene"),"cardLayouts",false));
        var result=assertDoesNotThrow(()->validator.collect(d));assertFalse(result.valid());assertTrue(paths(result).containsAll(Set.of("roles","phases","clues","ballot","supportedPlayerCounts[0]","presentation.scenes[0]","presentation.cardLayouts")));
        assertStrictParity(d);assertEquals("$",validator.collect(null).issues().getFirst().path());assertThrows(ApiException.class,()->validator.validate(null));
    }
    @Test void malformedIdRegistryDoesNotProduceDependentMissingReferenceErrors(){
        var d=work("MURDER_MYSTERY");row(d,"roles",1).put("id",row(d,"roles",0).get("id"));
        var result=validator.collect(d);assertTrue(paths(result).contains("roles[1].id"));assertEquals(1,result.issues().stream().filter(i->i.path().equals("roles[1].id")).count());assertFalse(paths(result).contains("ballot.culpritRoleId"));assertStrictParity(d);
        d.put("roles",null);scene(d).put("kind","ROLE");scene(d).put("referenceId","role-1");var bound=node("bound");bound.put("bindingType","ROLE");bound.put("bindingId","role-1");scene(d).put("nodes",List.of(bound));
        result=validator.collect(d);assertTrue(paths(result).contains("roles"));assertFalse(paths(result).contains("presentation.scenes[0].referenceId"));assertFalse(paths(result).contains("presentation.scenes[0].nodes[0].bindingId"));assertStrictParity(d);
    }
    @Test void duplicateIdsDoNotShiftLaterSceneAndNodePaths(){
        var d=work("YACHT");var first=scene(d);var second=new LinkedHashMap<>(first);var third=new LinkedHashMap<>(first);
        second.put("id",first.get("id"));third.put("id","third");third.put("width",0);
        var a=node("duplicate");var b=node("duplicate");var bad=node("last");bad.put("height",0);first.put("nodes",List.of(a,b,bad));
        presentation(d).put("scenes",List.of(first,second,third));var result=validator.collect(d);
        assertTrue(paths(result).containsAll(Set.of("presentation.scenes[0].nodes[1].id","presentation.scenes[0].nodes[2].height","presentation.scenes[1].id","presentation.scenes[2].width")));assertStrictParity(d);
    }
    @Test void deepConditionsStopAtTheLimitAndOtherSectionsStillRun(){
        var d=work("MURDER_MYSTERY");Map<String,Object> condition=Json.map("type","ALWAYS");for(int i=0;i<20;i++)condition=Json.map("type","NOT","condition",condition);
        object(row(d,"roles",0).get("objective")).put("condition",condition);scene(d).put("background","bad");
        var result=assertDoesNotThrow(()->validator.collect(d));assertTrue(result.issues().stream().anyMatch(issue->issue.message().contains("8단계")));assertTrue(paths(result).contains("presentation.scenes[0].background"));assertStrictParity(d);
    }
    @Test void cardFacesAndDeckCardReferencesKeepExactPaths(){
        var d=work("TABLETOP");var back=node("back-node");back.put("rotation","bad");
        presentation(d).put("cardLayouts",List.of(Json.map("id","layout","name","카드","width",600,"height",850,"front",Json.map("background","bad","nodes",List.of()),"back",Json.map("background","#ffffff","nodes",List.of(back)))));
        var deck=row(object(d.get("tabletop")),"decks",0);row(deck,"cards",0).put("layoutId","missing");
        var result=validator.collect(d);assertTrue(paths(result).containsAll(Set.of("presentation.cardLayouts[0].front.background","presentation.cardLayouts[0].back.nodes[0].rotation","tabletop.decks[0].cards[0].layoutId")));assertStrictParity(d);
    }
    @Test void exactlyOneHundredIssuesIsNotTruncatedUntilAnotherIsFound(){
        var d=work("YACHT");var nodes=new ArrayList<Map<String,Object>>();
        for(int i=0;i<100;i++){var node=node("n"+i);node.put("width",0);nodes.add(node);}scene(d).put("nodes",nodes);
        var exact=validator.collect(d);assertEquals(100,exact.issues().size());assertFalse(exact.truncated());
        var extra=node("last");extra.put("width",0);nodes.add(extra);var limited=validator.collect(d);
        assertEquals(exact.issues(),limited.issues());assertTrue(limited.truncated());assertFalse(limited.valid());assertStrictParity(d);
    }
    @Test void duplicateIssuesDoNotConsumeTheLimit(){
        var context=ValidationContext.collecting();context.run(()->{for(int i=0;i<150;i++)context.check(false,"title","INVALID_SCENARIO","제목을 확인해 주세요.");});
        assertEquals(1,context.issues().size());assertFalse(context.truncated());
    }
    @Test void assetReferenceErrorsNeverEchoTheSuppliedValue(){
        var d=work("TABLETOP");row(object(d.get("tabletop")),"objects",0).put("assetId","private-value-must-not-echo");
        var result=validator.collect(d);assertTrue(paths(result).contains("tabletop.objects[0].assetId"));assertFalse(result.issues().toString().contains("private-value-must-not-echo"));assertStrictParity(d);
    }
    @Test void boardWithoutRoleRegistryCannotBindASecretRole(){
        var d=work("YACHT");d.remove("roles");var bound=node("bound");bound.put("bindingType","ROLE");bound.put("bindingId","missing");scene(d).put("nodes",List.of(bound));
        assertFalse(validator.collect(d).valid());assertStrictParity(d);
    }
    private void assertStrictParity(Map<String,Object> d){if(validator.collect(d).valid())assertDoesNotThrow(()->validator.validate(d));else assertThrows(ApiException.class,()->validator.validate(d));}
    private static Set<String> paths(ValidationContext c){var out=new LinkedHashSet<String>();for(var issue:c.issues())out.add(issue.path());return out;}
    private static Map<String,Object> work(String type){return AuthorTemplates.create("검증 작품",type,"validation-work");}
    @SuppressWarnings("unchecked") private static Map<String,Object> object(Object value){return (Map<String,Object>)value;}
    private static Map<String,Object> row(Map<String,Object> parent,String key,int index){return object(((List<?>)parent.get(key)).get(index));}
    private static Map<String,Object> presentation(Map<String,Object> d){return object(d.get("presentation"));}
    private static Map<String,Object> scene(Map<String,Object> d){return row(presentation(d),"scenes",0);}
    private static Map<String,Object> node(String id){return Json.map("id",id,"kind","RECT","x",0,"y",0,"width",100,"height",100,"rotation",0,"fill","#ffffff","locked",false,"hidden",false,"bindingType","NONE","bindingId","");}
}
