package com.mysterymango.game;

import org.junit.jupiter.api.Test;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class RuleConditionsTest {
    @Test void tiesAbstentionsAndMissingVotesNeverInventAnAccusation() {
        assertNull(RuleConditions.accusation(List.of()));
        assertNull(RuleConditions.accusation(Arrays.asList(null,null)));
        assertNull(RuleConditions.accusation(List.of("a","a","b","b")));
        assertEquals("b",RuleConditions.accusation(Arrays.asList("a","b","b",null)));
    }
    @Test void personalObjectiveUsesOnlyItsOwnersGrantedClues() {
        var f=new RuleConditions.Facts(false,Set.of("public"),Map.of("a",Set.of("secret-a"),"b",Set.of("secret-b")),Map.of("proven",true),"a");
        assertTrue(RuleConditions.evaluate(Map.of("type","HAS_CLUE","clueId","secret-a"),f));
        assertFalse(RuleConditions.evaluate(Map.of("type","HAS_CLUE","clueId","secret-b"),f));
        assertTrue(RuleConditions.evaluate(Map.of("type","ALL","conditions",List.of(Map.of("type","FLAG","flag","proven","value",true),Map.of("type","NOT","condition",Map.of("type","CULPRIT_IDENTIFIED")))),f));
    }
    @Test void arbitraryExpressionsAndOverdeepConditionsAreRejected() {
        var f=new RuleConditions.Facts(false,Set.of(),Map.of(),Map.of(),"a");
        assertThrows(IllegalArgumentException.class,()->RuleConditions.evaluate(Map.of("type","SpEL","expression","T(java.lang.Runtime).getRuntime()"),f));
        Map<String,Object> nested=Map.of("type","ALWAYS");for(int i=0;i<10;i++)nested=Map.of("type","NOT","condition",nested);
        final var invalid=nested;assertThrows(IllegalArgumentException.class,()->RuleConditions.evaluate(invalid,f));
    }
}
