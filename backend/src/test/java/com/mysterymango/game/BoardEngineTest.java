package com.mysterymango.game;

import com.mysterymango.common.ApiException;
import org.junit.jupiter.api.Test;
import java.util.*;
import static com.mysterymango.game.Definitions.*;
import static org.junit.jupiter.api.Assertions.*;

class BoardEngineTest {
    private final BoardEngine engine=new BoardEngine(new Random(123));
    @Test void yachtUsesFrozenPresentationWithoutAcceptingExtraAppearanceProperties(){var d=obj("yacht",obj("diceColor","#123456","pipColor","#654321","scoreboardColor","#abcdef","script","do-not-copy"));var state=engine.initial("YACHT",d,2);assertEquals(obj("diceColor","#123456","pipColor","#654321","scoreboardColor","#abcdef"),engine.project("YACHT",state,0).get("appearance"));}
    @Test void privateHandsDeckOrderAndFaceDownArtworkNeverLeak(){
        var d=obj("tabletop",obj("objects",List.of(obj("id","public","kind","CARD","name","비밀 이름","text","비밀 본문","assetId","front","backAssetId","back","faceUp",false,"locked",false)),"decks",List.of(obj("id","deck","name","카드","cards",List.of(obj("id","one","name","첫 카드","text","첫 비밀","assetId","one-front"),obj("id","two","name","둘째 카드","text","둘째 비밀","assetId","two-front"))))));
        var state=engine.initial("TABLETOP",d,2);var before=engine.project("TABLETOP",state,0);assertFalse(objects(before.get("objects")).getFirst().containsKey("text"));assertFalse(objects(before.get("objects")).getFirst().containsKey("definitionId"));assertNotEquals("public",objects(before.get("objects")).getFirst().get("id"));assertFalse(objects(before.get("decks")).getFirst().containsKey("cards"));assertEquals(2,objects(before.get("hands")).size());
        engine.command("TABLETOP",state,0,true,"DRAW",obj("deckId","deck"));var mine=engine.project("TABLETOP",state,0);var other=engine.project("TABLETOP",state,1);assertEquals(2,objects(mine.get("objects")).size());assertEquals(1,objects(other.get("objects")).size());
        String card=str(objects(mine.get("objects")).get(1),"id");assertThrows(ApiException.class,()->engine.command("TABLETOP",state,1,false,"MOVE",obj("objectId",card,"x",1,"y",2)));
        engine.command("TABLETOP",state,0,true,"TRANSFER",obj("objectId",card,"toSeat",null));assertFalse(objects(engine.project("TABLETOP",state,1).get("objects")).get(1).containsKey("assetId"));
        engine.command("TABLETOP",state,1,false,"FLIP",obj("objectId",card));assertTrue(objects(engine.project("TABLETOP",state,1).get("objects")).get(1).containsKey("assetId"));
        assertThrows(ApiException.class,()->engine.command("TABLETOP",state,1,false,"FINISH",Map.of()));engine.command("TABLETOP",state,0,true,"FINISH",Map.of());assertTrue(bool(state,"finished"));
    }
    @Test void yachtRulesScoreAllCategoriesAndRejectInvalidActions(){
        var s=engine.initial("YACHT",Map.of(),2);assertThrows(ApiException.class,()->engine.command("YACHT",s,1,false,"ROLL",Map.of()));assertThrows(ApiException.class,()->engine.command("YACHT",s,0,true,"SCORE",obj("category","YACHT")));
        engine.command("YACHT",s,0,true,"ROLL",Map.of());engine.command("YACHT",s,0,true,"HOLD",obj("indices",List.of(0,2)));var original=BoardEngine.numbers(s.get("dice"));engine.command("YACHT",s,0,true,"ROLL",Map.of());assertEquals(original.get(0),BoardEngine.numbers(s.get("dice")).get(0));assertEquals(original.get(2),BoardEngine.numbers(s.get("dice")).get(2));
        engine.command("YACHT",s,0,true,"ROLL",Map.of());assertThrows(ApiException.class,()->engine.command("YACHT",s,0,true,"ROLL",Map.of()));
        assertEquals(50,BoardEngine.score("YACHT",List.of(6,6,6,6,6)));assertEquals(28,BoardEngine.score("FOUR_KIND",List.of(6,6,6,6,4)));assertEquals(16,BoardEngine.score("FULL_HOUSE",List.of(2,2,4,4,4)));assertEquals(0,BoardEngine.score("FULL_HOUSE",List.of(4,4,4,4,4)));assertEquals(15,BoardEngine.score("SMALL_STRAIGHT",List.of(1,2,2,3,4)));assertEquals(30,BoardEngine.score("LARGE_STRAIGHT",List.of(2,3,4,5,6)));
        engine.command("YACHT",s,0,true,"SCORE",obj("category","CHOICE"));assertEquals(1,integer(s,"turnSeat",-1));assertEquals(3,integer(s,"rollsRemaining",0));assertTrue(map(engine.project("YACHT",s,0).get("availableScores")).isEmpty());
    }
    @Test void otherSeatLeavingPreservesCurrentDiceAndForfeitureIsVisible(){var s=engine.initial("YACHT",Map.of(),3);engine.command("YACHT",s,0,true,"ROLL",Map.of());var dice=List.copyOf(BoardEngine.numbers(s.get("dice")));engine.command("YACHT",s,2,false,"LEAVE",Map.of());assertEquals(dice,BoardEngine.numbers(s.get("dice")));assertEquals(2,integer(s,"rollsRemaining",0));assertEquals(true,objects(engine.project("YACHT",s,0).get("scores")).get(2).get("forfeited"));}
    @Test void completeYachtUsesServerBonusAndSharedRanks(){
        var s=engine.initial("YACHT",Map.of(),2);for(int round=0;round<12;round++)for(int seat=0;seat<2;seat++){engine.command("YACHT",s,seat,seat==0,"ROLL",Map.of());s.put("dice",List.of(6,6,6,6,6));engine.command("YACHT",s,seat,seat==0,"SCORE",obj("category",BoardEngine.CATEGORIES.get(round)));}assertTrue(bool(s,"finished"));assertEquals(List.of(0,1),s.get("winners"));var scores=objects(engine.project("YACHT",s,0).get("scores"));assertEquals(1L,scores.getFirst().get("rank"));assertEquals(1L,scores.getLast().get("rank"));
        var bonus=engine.initial("YACHT",Map.of(),1);var categories=map(objects(bonus.get("scores")).getFirst().get("categories"));for(int i=0;i<6;i++)categories.put(BoardEngine.CATEGORIES.get(i),(i+1)*3);assertEquals(35,objects(engine.project("YACHT",bonus,0).get("scores")).getFirst().get("bonus"));
    }
    @Test void yachtBonusBoundaryZeroScoreDuplicateCategoryAndSoloCompletion(){
        var boundary=engine.initial("YACHT",Map.of(),1);var categories=map(objects(boundary.get("scores")).getFirst().get("categories"));for(int i=0;i<6;i++)categories.put(BoardEngine.CATEGORIES.get(i),(i+1)*3);categories.put("ONES",2);var score=objects(engine.project("YACHT",boundary,0).get("scores")).getFirst();assertEquals(62,score.get("upperTotal"));assertEquals(0,score.get("bonus"));categories.put("ONES",3);assertEquals(35,objects(engine.project("YACHT",boundary,0).get("scores")).getFirst().get("bonus"));
        var solo=engine.initial("YACHT",Map.of(),1);for(String category:BoardEngine.CATEGORIES){engine.command("YACHT",solo,0,true,"ROLL",Map.of());solo.put("dice",List.of(1,2,3,4,5));if(category.equals("TWOS")){var reused=assertThrows(ApiException.class,()->engine.command("YACHT",solo,0,true,"SCORE",obj("category","ONES")));assertEquals("CATEGORY_USED",reused.code);}engine.command("YACHT",solo,0,true,"SCORE",obj("category",category));}
        assertTrue(bool(solo,"finished"));assertEquals(List.of(0),solo.get("winners"));var row=objects(engine.project("YACHT",solo,0).get("scores")).getFirst();assertEquals(12,map(row.get("categories")).size());assertEquals(0,map(row.get("categories")).get("FOUR_KIND"));assertEquals(0,map(row.get("categories")).get("FULL_HOUSE"));assertEquals(0,map(row.get("categories")).get("YACHT"));assertEquals(1L,row.get("rank"));
    }
}
