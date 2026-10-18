package com.mysterymango.game;

import com.mysterymango.common.ApiException;
import org.junit.jupiter.api.Test;
import java.util.*;
import static com.mysterymango.game.Definitions.*;
import static org.junit.jupiter.api.Assertions.*;

class CardDesignTest {
    private final BoardEngine engine=new BoardEngine(new Random(1));
    private static final String FRONT=UUID.randomUUID().toString(),BACK=UUID.randomUUID().toString(),COMMON_BACK=UUID.randomUUID().toString();

    @Test void publicCardShowsOnlyItsCurrentFaceAndPrivateHandsRemainPrivate() {
        var state=engine.initial("TABLETOP",definition(true),2);
        var card=objects(state.get("objects")).getFirst();String id=str(card,"id");
        var back=visibleCard(state,0);assertEquals(BACK,image(back));assertVisualOnly(back);
        assertFalse(back.containsKey("assetId"));assertFalse(back.containsKey("backAssetId"));assertFalse(back.containsKey("name"));assertFalse(back.containsKey("text"));
        act(state,0,"FLIP",obj("objectId",id));assertEquals(FRONT,image(visibleCard(state,1)));
        act(state,0,"TRANSFER",obj("objectId",id,"toSeat",1));
        assertEquals(List.of(),engine.project("TABLETOP",state,0).get("objects"));assertEquals(FRONT,image(visibleCard(state,1)));assertFalse(bool(visibleCard(state,1),"faceUp"));
        assertEquals(1L,objects(engine.project("TABLETOP",state,0).get("hands")).get(1).get("count"));
    }

    @Test void drawnCardsKeepTheirFrontAndTheDecksCommonBackWithoutResizing() {
        var state=engine.initial("TABLETOP",definition(false),2);
        var deck=objects(engine.project("TABLETOP",state,0).get("decks")).getFirst();
        assertEquals(COMMON_BACK,str(objects(map(deck.get("backDesign")).get("nodes")).getFirst(),"assetId"));assertFalse(deck.containsKey("backAssetId"));assertFalse(deck.containsKey("cards"));assertFalse(deck.containsKey("backLayoutId"));
        act(state,0,"DRAW",obj("deckId","deck"));var card=visibleCard(state,0);String id=str(card,"id");
        assertEquals(FRONT,image(card));assertEquals(120,card.get("width"));assertEquals(170,card.get("height"));
        assertEquals("own",objects(state.get("objects")).getFirst().get("layoutId"));assertEquals("common",objects(state.get("objects")).getFirst().get("backLayoutId"));
        act(state,0,"TRANSFER",obj("objectId",id,"toSeat",null));assertEquals(COMMON_BACK,image(visibleCard(state,1)));
        act(state,1,"FLIP",obj("objectId",id));assertEquals(FRONT,image(visibleCard(state,0)));assertVisualOnly(visibleCard(state,0));
    }

    @Test void explicitEmptyDesignStaysBlankAndLegacyOnlyExposesTheVisibleImage() {
        var definition=definition(true);var layout=objects(map(definition.get("presentation")).get("cardLayouts")).getFirst();
        layout.put("front",obj("background","#ffffff","nodes",List.of()));layout.put("back",obj("background","#ffffff","nodes",List.of()));
        var state=engine.initial("TABLETOP",definition,2);var card=visibleCard(state,0);assertTrue(map(card.get("faceDesign")).containsKey("nodes"));assertEquals(List.of(),map(card.get("faceDesign")).get("nodes"));assertFalse(card.containsKey("backAssetId"));
        objects(state.get("objects")).getFirst().remove("layoutId");card=visibleCard(state,0);assertFalse(card.containsKey("faceDesign"));assertEquals("old-back",card.get("backAssetId"));assertFalse(card.containsKey("assetId"));
        act(state,0,"FLIP",obj("objectId",card.get("id")));card=visibleCard(state,0);assertEquals("old-front",card.get("assetId"));assertEquals("옛 문구",card.get("text"));assertFalse(card.containsKey("backAssetId"));
    }

    @Test void brokenInternalLayoutNeverFallsBackToLegacySensitiveContent() {
        var state=engine.initial("TABLETOP",definition(true),2);objects(state.get("objects")).getFirst().put("layoutId","missing");
        assertEquals("INVALID_CARD_LAYOUT",assertThrows(ApiException.class,()->engine.project("TABLETOP",state,0)).code);
    }

    private Map<String,Object> definition(boolean standalone) {
        var card=obj("id","original-card-id","kind","CARD","name","내부 카드 이름","text","옛 문구","assetId","old-front","backAssetId","old-back","layoutId","own","x",10,"y",20,"width",100,"height",160,"faceUp",false,"locked",false);
        return obj("presentation",obj("cardLayouts",List.of(layout("own",FRONT,BACK),layout("common",UUID.randomUUID().toString(),COMMON_BACK))),"tabletop",obj("objects",standalone?List.of(card):List.of(),"decks",standalone?List.of():List.of(obj("id","deck","name","덱","backAssetId","legacy-deck-back","backLayoutId","common","cards",List.of(card)))));
    }
    private Map<String,Object> layout(String id,String front,String back){return obj("id",id,"name","편집용 이름","width",600,"height",850,"front",face(front),"back",face(back));}
    private Map<String,Object> face(String asset){return obj("background","#ffffff","nodes",List.of(obj("id","editor-node-id","kind","IMAGE","x",0,"y",0,"width",600,"height",850,"rotation",0,"assetId",asset,"text","image-node-private-metadata","locked",true,"hidden",true,"bindingId","secret-role","metadata","editor-only")));}
    private Map<String,Object> visibleCard(Map<String,Object> state,int seat){return objects(engine.project("TABLETOP",state,seat).get("objects")).getFirst();}
    private String image(Map<String,Object> card){return str(objects(map(card.get("faceDesign")).get("nodes")).getFirst(),"assetId");}
    private void assertVisualOnly(Map<String,Object> card){assertFalse(card.containsKey("layoutId"));assertFalse(card.containsKey("definitionId"));var design=map(card.get("faceDesign"));assertEquals(Set.of("width","height","background","nodes"),design.keySet());assertEquals(Set.of("kind","x","y","width","height","rotation","assetId"),objects(design.get("nodes")).getFirst().keySet());}
    private void act(Map<String,Object> state,int seat,String type,Map<String,Object> payload){engine.command("TABLETOP",state,seat,seat==0,type,payload);}
}
