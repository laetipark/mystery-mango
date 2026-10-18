package com.mysterymango.author;

import com.mysterymango.common.ApiException;
import com.mysterymango.game.ScenarioValidator;
import org.junit.jupiter.api.Test;
import java.util.*;
import static com.mysterymango.common.Json.map;
import static org.junit.jupiter.api.Assertions.*;

class CardLayoutValidationTest {
    private final ScenarioValidator validator=new ScenarioValidator();

    @Test void authorProjectionKeepsCardDesignsAndReferencesButDropsScriptsAndBindings() {
        var d=document();var layout=layout(d);layout.put("script","hidden-script");node(d).put("bindingType","ROLE");node(d).put("bindingId","secret-role");node(d).put("unknown","removed");
        var projected=AuthorDocument.project(d);assertDoesNotThrow(()->validator.validate(projected));assertFalse(layout(projected).containsKey("script"));assertFalse(node(projected).containsKey("bindingId"));assertFalse(node(projected).containsKey("unknown"));
        assertEquals("design",deck(projected).get("backLayoutId"));assertEquals("design",card(projected).get("layoutId"));
        UUID image=UUID.randomUUID();node(projected).put("kind","IMAGE");node(projected).put("assetId",image.toString());assertEquals(Set.of(image),AuthorDocument.assetIds(projected));
    }
    @Test void missingDesignReferencesArePreciseErrorsEvenWithoutPresentation() {
        var d=document();deck(d).put("backLayoutId","missing");assertPath(d,"tabletop.decks[0].backLayoutId");
        d=document();card(d).put("layoutId","missing");assertPath(d,"tabletop.decks[0].cards[0].layoutId");
        d=document();d.remove("presentation");assertPath(d,"tabletop.decks[0].backLayoutId");
        d=document();var object=new LinkedHashMap<>(mapOf(((List<?>)mapOf(d.get("tabletop")).get("objects")).getFirst()));object.put("layoutId","design");mapOf(d.get("tabletop")).put("objects",List.of(object));assertPath(d,"tabletop.objects[0].layoutId");
    }
    @Test void layoutFacesHaveStrictVisualKindsDimensionsColorsAndUniqueIds() {
        var d=document();node(d).put("kind","MATERIAL");assertPath(d,"presentation.cardLayouts[0].front.nodes[0].kind");
        d=document();layout(d).put("width",0);assertPath(d,"presentation.cardLayouts[0].width");
        d=document();mapOf(layout(d).get("back")).put("background","url(script)");assertPath(d,"presentation.cardLayouts[0].back.background");
        d=document();layout(d).remove("front");assertPath(d,"presentation.cardLayouts[0].front");
        d=document();mapOf(layout(d).get("front")).put("nodes",List.of(node(d),node(d)));assertPath(d,"presentation.cardLayouts[0].front.nodes[1].id");
        d=document();mapOf(d.get("presentation")).put("cardLayouts",List.of(layout(d),layout(d)));assertPath(d,"presentation.cardLayouts[1].id");
    }
    @Test void designAndFaceAndCombinedNodeLimitsAreEnforced() {
        var d=document();var manyLayouts=new ArrayList<Map<String,Object>>();for(int i=0;i<101;i++){var l=new LinkedHashMap<>(layout(d));l.put("id","design-"+i);manyLayouts.add(l);}mapOf(d.get("presentation")).put("cardLayouts",manyLayouts);assertPath(d,"presentation.cardLayouts");
        d=document();mapOf(layout(d).get("front")).put("nodes",nodes(201));assertPath(d,"presentation.cardLayouts[0].front.nodes");
        d=document();manyLayouts=new ArrayList<>();for(int i=0;i<5;i++){var l=new LinkedHashMap<>(layout(d));l.put("id",i==0?"design":"design-"+i);l.put("front",map("background","#ffffff","nodes",nodes(200)));l.put("back",map("background","#ffffff","nodes",nodes(200)));manyLayouts.add(l);}mapOf(d.get("presentation")).put("cardLayouts",manyLayouts);assertPath(d,"presentation.scenes[0].nodes");
    }
    @Test void emptyFacesAndLegacyDocumentsRemainValid() {var d=document();for(String side:List.of("front","back"))mapOf(layout(d).get(side)).put("nodes",List.of());assertDoesNotThrow(()->validator.validate(d));var legacy=AuthorTemplates.create("기존 카드","TABLETOP","legacy-cards");assertDoesNotThrow(()->validator.validate(legacy));}

    private Map<String,Object> document(){var d=AuthorTemplates.create("카드 디자인","TABLETOP","card-design");mapOf(d.get("presentation")).put("cardLayouts",List.of(map("id","design","name","카드","width",600,"height",850,"front",map("background","#ffffff","nodes",nodes(1)),"back",map("background","#123456","nodes",List.of()))));deck(d).put("backLayoutId","design");card(d).put("layoutId","design");return d;}
    private List<Map<String,Object>> nodes(int count){var out=new ArrayList<Map<String,Object>>();for(int i=0;i<count;i++)out.add(map("id","node-"+i,"kind","TEXT","x",0,"y",0,"width",100,"height",100,"rotation",0,"text","카드 문구","fontSize",20,"fill","#242a27"));return out;}
    private void assertPath(Map<String,Object> d,String path){var error=assertThrows(ApiException.class,()->validator.validate(d));assertEquals("INVALID_PRESENTATION",error.code);assertTrue(error.getMessage().startsWith(path+":"),error.getMessage());}
    private Map<String,Object> layout(Map<String,Object> d){return mapOf(((List<?>)mapOf(d.get("presentation")).get("cardLayouts")).getFirst());}
    private Map<String,Object> node(Map<String,Object> d){return mapOf(((List<?>)mapOf(layout(d).get("front")).get("nodes")).getFirst());}
    private Map<String,Object> deck(Map<String,Object> d){return mapOf(((List<?>)mapOf(d.get("tabletop")).get("decks")).getFirst());}
    private Map<String,Object> card(Map<String,Object> d){return mapOf(((List<?>)deck(d).get("cards")).getFirst());}
    @SuppressWarnings("unchecked") private static Map<String,Object> mapOf(Object value){return (Map<String,Object>)value;}
}
