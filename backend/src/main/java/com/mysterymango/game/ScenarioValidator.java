package com.mysterymango.game;

import com.mysterymango.common.ApiException;
import org.springframework.stereotype.Component;
import java.util.*;
import static com.mysterymango.game.Definitions.*;

@Component
public class ScenarioValidator {
    private static final Set<String> ACTIONS=Set.of("CHAT","WHISPER","INVESTIGATE","SHARE","VOTE");
    public void validate(Map<String,Object> d) {
        require(integer(d,"schemaVersion",0)==1,"지원하지 않는 작품 형식입니다.");
        for(String key:List.of("slug","title","synopsis","language","genre","difficulty")) text(d,key,10000);
        require(str(d,"slug").matches("[a-z0-9-]{3,80}"),"작품 slug가 올바르지 않습니다.");
        require(integer(d,"playerCount",0)==4,"초기 작품은 정확히 4인용이어야 합니다.");
        require(integer(d,"estimatedMinutes",0)>0&&integer(d,"estimatedMinutes",0)<=480,"예상 시간이 올바르지 않습니다.");
        require(Set.of("EASY","MEDIUM","HARD").contains(str(d,"difficulty")),"난이도가 올바르지 않습니다.");
        require(!strings(d.get("modes")).isEmpty()&&Set.of("TEXT","DISCORD").containsAll(strings(d.get("modes"))),"플레이 방식이 올바르지 않습니다.");
        Set<String> roles=ids(d,"roles",4,4), phases=ids(d,"phases",3,30), clues=ids(d,"clues",1,100), targets=ids(d,"targets",1,100);
        ids(d,"endings",2,20); ids(d,"rules",0,100);
        for(var role:objects(d.get("roles"))) {
            for(String key:List.of("name","publicIntro","secret")) text(role,key,20000);
            var objective=map(role.get("objective")); text(objective,"text",5000); condition(map(objective.get("condition")),roles,clues,0);
        }
        List<Map<String,Object>> stages=objects(d.get("phases"));
        require(str(stages.getFirst(),"kind").equals("READING")&&str(stages.getLast(),"kind").equals("ENDING"),"첫 단계는 읽기, 마지막 단계는 엔딩이어야 합니다.");
        require(stages.stream().filter(p->str(p,"kind").equals("VOTE")).count()==1,"범인 투표 단계는 한 번이어야 합니다.");
        require(stages.stream().filter(p->str(p,"kind").equals("ENDING")).count()==1,"엔딩은 마지막 단계에 한 번만 있어야 합니다.");
        require(str(stages.get(stages.size()-2),"kind").equals("VOTE"),"엔딩 바로 앞에 범인 투표가 필요합니다.");
        for(var p:stages) {
            require(Set.of("READING","INVESTIGATION","DISCUSSION","VOTE","ENDING").contains(str(p,"kind")),"허용되지 않은 단계입니다.");
            require(integer(p,"durationSeconds",0)>=1&&integer(p,"durationSeconds",0)<=7200,"단계 시간은 1~7200초여야 합니다.");
            text(p,"publicText",20000); require(ACTIONS.containsAll(strings(p.get("actions"))),"허용되지 않은 행동입니다.");
            require(integer(p,"investigationLimit",0)>=0&&integer(p,"investigationLimit",0)<=100,"조사 한도가 올바르지 않습니다.");
            require(!strings(p.get("actions")).contains("INVESTIGATE")||str(p,"kind").equals("INVESTIGATION"),"조사는 조사 단계에서만 허용됩니다.");
            require(!strings(p.get("actions")).contains("VOTE")||str(p,"kind").equals("VOTE"),"투표는 투표 단계에서만 허용됩니다.");
        }
        for(var c:objects(d.get("clues"))) { text(c,"title",1000); text(c,"text",20000); require(Set.of("PUBLIC_AND_WHISPER","PUBLIC","PRIVATE").contains(str(c,"sharePolicy")),"단서 공유 정책이 올바르지 않습니다."); }
        for(var t:objects(d.get("targets"))) {
            text(t,"name",1000); require(!strings(t.get("phaseIds")).isEmpty()&&phases.containsAll(strings(t.get("phaseIds"))),"조사 단계 참조가 올바르지 않습니다.");
            require(!strings(t.get("clueIds")).isEmpty()&&clues.containsAll(strings(t.get("clueIds"))),"조사 단서 참조가 올바르지 않습니다.");
            for(String pid:strings(t.get("phaseIds"))) require(str(find(d,"phases",pid),"kind").equals("INVESTIGATION"),"조사 대상은 조사 단계만 참조해야 합니다.");
        }
        var ballot=map(d.get("ballot")); require(roles.contains(str(ballot,"culpritRoleId")),"범인 역할 참조가 올바르지 않습니다.");
        require(ballot.get("allowChange") instanceof Boolean&&ballot.get("allowAbstain") instanceof Boolean,"투표 변경 및 기권 정책이 필요합니다.");
        require(str(ballot,"tiePolicy").equals("NO_ACCUSATION"),"초기 동률 정책은 NO_ACCUSATION입니다.");
        for(var e:objects(d.get("endings"))) { text(e,"title",1000); text(e,"text",20000); condition(map(e.get("condition")),roles,clues,0); }
        require(str(map(objects(d.get("endings")).getLast().get("condition")),"type").equals("ALWAYS"),"마지막 엔딩은 ALWAYS 조건이어야 합니다.");
        for(var r:objects(d.get("rules"))) {
            String when=str(r,"when"); require(Set.of("PHASE_STARTED","CLUE_PUBLISHED","BALLOT_CLOSED").contains(when),"허용되지 않은 규칙 이벤트입니다.");
            if(when.equals("PHASE_STARTED")) require(phases.contains(str(r,"phaseId")),"규칙 단계 참조가 올바르지 않습니다.");
            if(when.equals("CLUE_PUBLISHED")) require(clues.contains(str(r,"clueId")),"규칙 단서 참조가 올바르지 않습니다.");
            condition(map(r.get("condition")),roles,clues,0);
            var effects=objects(r.get("effects")); require(!effects.isEmpty()&&effects.size()<=16,"규칙의 효과는 1~16개여야 합니다.");
            for(var e:effects) switch(str(e,"type")) {
                case "GRANT_CLUE" -> require(roles.contains(str(e,"roleId"))&&clues.contains(str(e,"clueId")),"규칙 자료 지급 참조가 올바르지 않습니다.");
                case "PUBLISH_MATERIAL" -> text(e,"text",20000);
                case "SET_FLAG" -> { text(e,"flag",100); require(e.get("value") instanceof Boolean||e.get("value") instanceof String||e.get("value") instanceof Number,"플래그는 단순 값이어야 합니다."); }
                default -> throw invalid("허용되지 않은 규칙 효과입니다.");
            }
        }
        // Effects cannot publish clues, start phases, or emit trigger events. Thus the v1 rule graph is acyclic by construction.
    }
    private void condition(Map<String,Object> c,Set<String> roles,Set<String> clues,int depth) {
        require(depth<=8,"조건은 8단계보다 깊게 중첩할 수 없습니다.");
        switch(str(c,"type")) {
            case "ALWAYS","CULPRIT_IDENTIFIED" -> { }
            case "NOT" -> condition(map(c.get("condition")),roles,clues,depth+1);
            case "ALL","ANY" -> { var children=objects(c.get("conditions")); require(!children.isEmpty()&&children.size()<=16,"복합 조건은 1~16개여야 합니다."); for(var child:children) condition(child,roles,clues,depth+1); }
            case "CLUE_PUBLIC","HAS_CLUE" -> { require(clues.contains(str(c,"clueId")),"조건 단서 참조가 올바르지 않습니다."); if(c.containsKey("roleId")) require(roles.contains(str(c,"roleId")),"조건 역할 참조가 올바르지 않습니다."); }
            case "FLAG" -> { text(c,"flag",100); require(c.containsKey("value"),"플래그 조건에는 값이 필요합니다."); }
            default -> throw invalid("허용되지 않은 조건입니다.");
        }
    }
    private Set<String> ids(Map<String,Object> d,String name,int min,int max) {
        require(d.get(name) instanceof List,"작품 배열이 누락되었습니다: "+name); var values=objects(d.get(name)); require(values.size()>=min&&values.size()<=max,"작품 항목 수가 올바르지 않습니다: "+name);
        Set<String> result=new HashSet<>(); for(var v:values) { text(v,"id",100); require(str(v,"id").matches("[a-zA-Z0-9_-]+")&&result.add(str(v,"id")),"중복되거나 잘못된 자료 ID입니다: "+name); } return result;
    }
    private void text(Map<String,Object> d,String key,int max) { require(d.get(key) instanceof String&&!str(d,key).isBlank()&&str(d,key).length()<=max,"텍스트가 누락되거나 너무 깁니다: "+key); }
    private void require(boolean valid,String message) { if(!valid) throw invalid(message); }
    private ApiException invalid(String message) { return new ApiException(422,"INVALID_SCENARIO",message); }
}
