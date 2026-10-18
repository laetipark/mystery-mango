package com.mysterymango.game;

import com.mysterymango.common.ApiException;
import java.util.*;
import java.util.function.*;
import static com.mysterymango.game.Definitions.*;

/** 실제 저장 어댑터와 독립 시험이 공유하는 머더미스터리 규칙. */
public final class MysteryEngine {
    private MysteryEngine(){}
    public static void action(Map<String,Object> phase,String action){require(strings(phase.get("actions")).contains(action),409,"ACTION_NOT_ALLOWED","현재 단계에서 허용되지 않는 행동입니다.");}
    public static void investigation(Map<String,Object> target,String phaseId,int remaining){require(strings(target.get("phaseIds")).contains(phaseId),409,"TARGET_UNAVAILABLE","지금 조사할 수 없는 대상입니다.");require(remaining>0,409,"INVESTIGATION_LIMIT","이 단계의 조사 횟수를 모두 사용했습니다.");}
    public static void share(Map<String,Object> clue,boolean owned,String scope){require(owned,403,"CLUE_NOT_OWNED","보유한 단서만 공유할 수 있습니다.");String policy=str(clue,"sharePolicy");if(scope.equals("PUBLIC"))require(!policy.equals("PRIVATE"),403,"CLUE_PRIVATE","공개할 수 없는 단서입니다.");else require(scope.equals("WHISPER")&&policy.equals("PUBLIC_AND_WHISPER"),403,"SHARE_NOT_ALLOWED","밀담 공유를 허용하지 않는 단서입니다.");}
    public static void vote(Map<String,Object> d,String roleId,boolean prior,String priorRole){var settings=map(d.get("ballot"));if(roleId==null)require(bool(settings,"allowAbstain"),422,"ABSTAIN_NOT_ALLOWED","이 작품에서는 기권할 수 없습니다.");else find(d,"roles",roleId);if(prior&&!bool(settings,"allowChange"))require(Objects.equals(priorRole,roleId),409,"VOTE_FINAL","이미 제출한 투표를 바꿀 수 없습니다.");}
    public static Map<String,Object> ending(Map<String,Object> d,RuleConditions.Facts facts){return objects(d.get("endings")).stream().filter(e->RuleConditions.evaluate(map(e.get("condition")),facts)).findFirst().orElseThrow(()->new ApiException(422,"ENDING_MISSING","도달할 수 있는 엔딩이 없습니다."));}
    public static Map<String,Object> role(Map<String,Object> d,String roleId){var r=find(d,"roles",roleId);return obj("id",r.get("id"),"name",r.get("name"),"secret",r.get("secret"),"objective",map(r.get("objective")).get("text"));}
    public static List<Map<String,Object>> clues(Map<String,Object> d,Map<String,Boolean> grants,Set<String> published){return objects(d.get("clues")).stream().filter(c->grants.containsKey(str(c,"id"))||published.contains(str(c,"id"))).map(c->obj("id",c.get("id"),"title",c.get("title"),"text",c.get("text"),"owned",Boolean.TRUE.equals(grants.get(str(c,"id"))),"public",published.contains(str(c,"id")),"sharePolicy",c.get("sharePolicy"))).toList();}
    public static void rules(Map<String,Object> d,String event,String reference,String cause,Supplier<RuleConditions.Facts> facts,BiPredicate<String,String> claim,Consumer<Map<String,Object>> apply){
        int effects=0;for(var rule:objects(d.get("rules"))){if(!event.equals(str(rule,"when")))continue;if(event.equals("PHASE_STARTED")&&!reference.equals(str(rule,"phaseId")))continue;if(event.equals("CLUE_PUBLISHED")&&!reference.equals(str(rule,"clueId")))continue;if(!RuleConditions.evaluate(map(rule.get("condition")),facts.get())||!claim.test(str(rule,"id"),cause))continue;for(var effect:objects(rule.get("effects"))){require(++effects<=1600,422,"RULE_LIMIT","작품 규칙 실행 한도를 초과했습니다.");apply.accept(effect);}}
    }
    static void require(boolean ok,int status,String code,String message){if(!ok)throw new ApiException(status,code,message);}
}
