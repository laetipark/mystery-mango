package com.mysterymango.game;

import java.util.*;
import static com.mysterymango.game.Definitions.*;

/** Bounded data-only predicate evaluation: no expression language or dynamic code. */
public final class RuleConditions {
    public record Facts(boolean culpritIdentified, Set<String> publicClues, Map<String,Set<String>> roleClues, Map<String,Object> flags, String ownRole) {}
    private RuleConditions() {}
    public static boolean evaluate(Map<String,Object> condition,Facts facts) { return evaluate(condition,facts,0); }
    private static boolean evaluate(Map<String,Object> c,Facts f,int depth) {
        if(depth>8) throw new IllegalArgumentException("Condition nesting exceeds eight levels");
        return switch(str(c,"type")) {
            case "ALWAYS" -> true;
            case "CULPRIT_IDENTIFIED" -> f.culpritIdentified();
            case "NOT" -> !evaluate(map(c.get("condition")),f,depth+1);
            case "ALL" -> objects(c.get("conditions")).stream().allMatch(x->evaluate(x,f,depth+1));
            case "ANY" -> objects(c.get("conditions")).stream().anyMatch(x->evaluate(x,f,depth+1));
            case "CLUE_PUBLIC" -> f.publicClues().contains(str(c,"clueId"));
            case "HAS_CLUE" -> f.roleClues().getOrDefault(c.containsKey("roleId")?str(c,"roleId"):f.ownRole(),Set.of()).contains(str(c,"clueId"));
            case "FLAG" -> Objects.equals(f.flags().get(str(c,"flag")),c.get("value"));
            default -> throw new IllegalArgumentException("Unsupported condition");
        };
    }
    public static String accusation(Collection<String> votes) {
        Map<String,Integer> counts=new HashMap<>();
        votes.stream().filter(Objects::nonNull).forEach(v->counts.merge(v,1,Integer::sum));
        int max=counts.values().stream().mapToInt(Integer::intValue).max().orElse(0);
        List<String> winners=counts.entrySet().stream().filter(e->e.getValue()==max).map(Map.Entry::getKey).toList();
        return winners.size()==1?winners.getFirst():null;
    }
}
