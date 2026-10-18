package com.mysterymango.game;

import com.mysterymango.common.ValidationContext;
import com.mysterymango.author.PresentationValidator;
import org.springframework.stereotype.Component;
import java.util.*;
import static com.mysterymango.common.ValidationContext.string;

@Component
public class ScenarioValidator {
    private static final String CODE="INVALID_SCENARIO";
    private static final Set<String> ACTIONS=Set.of("CHAT","WHISPER","INVESTIGATE","SHARE","VOTE");
    private record Rows(List<Map<String,Object>> items,Set<String> ids,boolean referencesReady) {}

    public void validate(Map<String,Object> document) { validate(document,ValidationContext.failFast()); }
    public ValidationContext collect(Map<String,Object> document) {
        var context=ValidationContext.collecting();context.run(()->validate(document,context));return context;
    }
    public void validate(Map<String,Object> d,ValidationContext c) {
        if(!c.check(d!=null,"$",CODE,"작품 문서를 입력해 주세요."))return;
        c.check(integer(d,"schemaVersion",0)==1,"schemaVersion",CODE,"지원하지 않는 작품 형식입니다.");
        for(String key:List.of("slug","title","synopsis","language","genre","difficulty"))c.text(d,key,10000,"",CODE);
        c.check(string(d,"slug").matches("[a-z0-9-]{3,80}"),"slug",CODE,"작품 slug가 올바르지 않습니다.");
        int playerCount=integer(d,"playerCount",0);
        boolean playerValid=c.check(d.get("playerCount") instanceof Number n&&n.doubleValue()==playerCount&&playerCount>=1&&playerCount<=4,"playerCount",CODE,"작품 인원은 1~4명의 정수여야 합니다.");
        c.check(integer(d,"estimatedMinutes",0)>0&&integer(d,"estimatedMinutes",0)<=480,"estimatedMinutes",CODE,"예상 시간이 올바르지 않습니다.");
        c.check(Set.of("EASY","MEDIUM","HARD").contains(string(d,"difficulty")),"difficulty",CODE,"난이도가 올바르지 않습니다.");
        c.check(!strings(d.get("modes")).isEmpty()&&Set.of("TEXT","DISCORD").containsAll(strings(d.get("modes"))),"modes",CODE,"플레이 방식이 올바르지 않습니다.");
        String type=Objects.toString(d.getOrDefault("gameType","MURDER_MYSTERY"));
        boolean typeValid=c.check(Set.of("MURDER_MYSTERY","TABLETOP","YACHT","GOMOKU","REVERSI","CHECKERS").contains(type),"gameType",CODE,"게임 유형이 올바르지 않습니다.");
        String engine=switch(type){case "TABLETOP"->"tabletop-v1";case "YACHT"->"yacht-v1";case "GOMOKU"->"gomoku-v1";case "REVERSI"->"reversi-v1";case "CHECKERS"->"checkers-v1";default->"mystery-v1";};
        if(typeValid)c.check(engine.equals(d.getOrDefault("engineId",engine)),"engineId",CODE,"게임 유형과 규칙 엔진이 일치하지 않습니다.");
        if(d.containsKey("supportedPlayerCounts")){
            var counts=c.array(d.get("supportedPlayerCounts"),"supportedPlayerCounts",CODE,1,4,"지원 인원은 1~4개의 목록으로 입력해 주세요.");
            if(counts!=null){
                Set<Integer> seen=new HashSet<>();boolean allValid=true;
                for(int i=0;i<counts.size();i++){
                    Object value=counts.get(i);String path="supportedPlayerCounts["+i+"]";
                    if(c.check(value instanceof Number n&&n.doubleValue()==n.intValue()&&n.intValue()>=1&&n.intValue()<=4,path,CODE,"지원 인원은 1~4명의 정수여야 합니다."))
                        allValid=c.check(seen.add(((Number)value).intValue()),path,CODE,"지원 인원 목록이 중복됩니다.")&&allValid;
                    else allValid=false;
                }
                if(allValid&&playerValid)c.check(seen.contains(playerCount),"supportedPlayerCounts",CODE,"기본 인원은 지원 인원에 포함되어야 합니다.");
                if(type.equals("MURDER_MYSTERY"))c.check(counts.size()==1,"supportedPlayerCounts",CODE,"머더미스터리는 역할 수와 같은 고정 인원을 사용합니다.");
                if(Set.of("GOMOKU","REVERSI","CHECKERS").contains(type))c.check(playerCount==2&&counts.size()==1&&seen.equals(Set.of(2)),"supportedPlayerCounts",CODE,"오목·리버시·체커의 지원 인원은 2명으로 고정합니다.");
            }
        }else c.check(type.equals("MURDER_MYSTERY"),"supportedPlayerCounts",CODE,"보드게임의 지원 인원을 지정해 주세요.");
        if(type.equals("MURDER_MYSTERY"))mystery(d,c,playerValid?playerCount:0);
        else if(type.equals("TABLETOP"))tabletop(d,c);
        PresentationValidator.validate(d,c);
    }
    private void mystery(Map<String,Object> d,ValidationContext c,int players){
        Rows roles=rows(d.get("roles"),"roles",players,players==0?4:players,c),phases=rows(d.get("phases"),"phases",3,30,c),clues=rows(d.get("clues"),"clues",1,100,c),targets=rows(d.get("targets"),"targets",1,100,c);
        Rows endings=rows(d.get("endings"),"endings",2,20,c),rules=rows(d.get("rules"),"rules",0,100,c);
        for(int i=0;i<roles.items.size();i++){
            var role=roles.items.get(i);if(role==null)continue;String path="roles["+i+"]";
            for(String key:List.of("name","publicIntro","secret"))c.text(role,key,20000,path,CODE);
            var objective=c.object(role.get("objective"),path+".objective",CODE,"역할 목표를 입력해 주세요.");
            if(objective!=null){c.text(objective,"text",5000,path+".objective",CODE);condition(objective.get("condition"),path+".objective.condition",roles,clues,0,c);}
        }
        var stages=phases.items;
        if(!stages.isEmpty()){
            if(stages.getFirst()!=null)c.check(string(stages.getFirst(),"kind").equals("READING"),"phases[0].kind",CODE,"첫 단계는 읽기여야 합니다.");
            if(stages.getLast()!=null)c.check(string(stages.getLast(),"kind").equals("ENDING"),"phases["+(stages.size()-1)+"].kind",CODE,"마지막 단계는 엔딩이어야 합니다.");
            if(stages.stream().allMatch(Objects::nonNull)){
                c.check(stages.stream().filter(p->string(p,"kind").equals("VOTE")).count()==1,"phases",CODE,"범인 투표 단계는 한 번이어야 합니다.");
                c.check(stages.stream().filter(p->string(p,"kind").equals("ENDING")).count()==1,"phases",CODE,"엔딩은 마지막 단계에 한 번만 있어야 합니다.");
            }
            if(stages.size()>=2&&stages.get(stages.size()-2)!=null)c.check(string(stages.get(stages.size()-2),"kind").equals("VOTE"),"phases["+(stages.size()-2)+"].kind",CODE,"엔딩 바로 앞에 범인 투표가 필요합니다.");
        }
        for(int i=0;i<stages.size();i++){
            var p=stages.get(i);if(p==null)continue;String path="phases["+i+"]";
            c.check(Set.of("READING","INVESTIGATION","DISCUSSION","VOTE","ENDING").contains(string(p,"kind")),path+".kind",CODE,"허용되지 않은 단계입니다.");
            c.check(integer(p,"durationSeconds",0)>=1&&integer(p,"durationSeconds",0)<=7200,path+".durationSeconds",CODE,"단계 시간은 1~7200초여야 합니다.");
            c.text(p,"publicText",20000,path,CODE);var actions=strings(p.get("actions"));c.check(ACTIONS.containsAll(actions),path+".actions",CODE,"허용되지 않은 행동입니다.");
            c.check(integer(p,"investigationLimit",0)>=0&&integer(p,"investigationLimit",0)<=100,path+".investigationLimit",CODE,"조사 한도가 올바르지 않습니다.");
            c.check(!actions.contains("INVESTIGATE")||string(p,"kind").equals("INVESTIGATION"),path+".actions",CODE,"조사는 조사 단계에서만 허용됩니다.");
            c.check(!actions.contains("VOTE")||string(p,"kind").equals("VOTE"),path+".actions",CODE,"투표는 투표 단계에서만 허용됩니다.");
        }
        for(int i=0;i<clues.items.size();i++){
            var clue=clues.items.get(i);if(clue==null)continue;String path="clues["+i+"]";
            c.text(clue,"title",1000,path,CODE);c.text(clue,"text",20000,path,CODE);c.check(Set.of("PUBLIC_AND_WHISPER","PUBLIC","PRIVATE").contains(string(clue,"sharePolicy")),path+".sharePolicy",CODE,"단서 공유 정책이 올바르지 않습니다.");
        }
        for(int i=0;i<targets.items.size();i++){
            var target=targets.items.get(i);if(target==null)continue;String path="targets["+i+"]";c.text(target,"name",1000,path,CODE);
            var phaseIds=strings(target.get("phaseIds"));var clueIds=strings(target.get("clueIds"));
            c.check(!phaseIds.isEmpty(),path+".phaseIds",CODE,"조사 단계 참조가 필요합니다.");c.check(!clueIds.isEmpty(),path+".clueIds",CODE,"조사 단서 참조가 필요합니다.");
            if(phases.referencesReady)for(int j=0;j<phaseIds.size();j++){
                String id=phaseIds.get(j),ref=path+".phaseIds["+j+"]";
                if(c.check(phases.ids.contains(id),ref,CODE,"조사 단계 참조가 올바르지 않습니다.")){
                    var phase=phases.items.stream().filter(Objects::nonNull).filter(p->id.equals(string(p,"id"))).findFirst().orElseThrow();
                    c.check(string(phase,"kind").equals("INVESTIGATION"),ref,CODE,"조사 대상은 조사 단계만 참조해야 합니다.");
                }
            }
            if(clues.referencesReady)for(int j=0;j<clueIds.size();j++)c.check(clues.ids.contains(clueIds.get(j)),path+".clueIds["+j+"]",CODE,"조사 단서 참조가 올바르지 않습니다.");
        }
        var ballot=c.object(d.get("ballot"),"ballot",CODE,"투표 설정을 입력해 주세요.");
        if(ballot!=null){
            reference(ballot,"culpritRoleId","ballot",roles,c,"범인 역할 참조가 올바르지 않습니다.");
            for(String key:List.of("allowChange","allowAbstain"))c.check(ballot.get(key) instanceof Boolean,"ballot."+key,CODE,"투표 변경 및 기권 정책이 필요합니다.");
            c.check(string(ballot,"tiePolicy").equals("NO_ACCUSATION"),"ballot.tiePolicy",CODE,"초기 동률 정책은 NO_ACCUSATION입니다.");
        }
        for(int i=0;i<endings.items.size();i++){
            var ending=endings.items.get(i);if(ending==null)continue;String path="endings["+i+"]";
            c.text(ending,"title",1000,path,CODE);c.text(ending,"text",20000,path,CODE);condition(ending.get("condition"),path+".condition",roles,clues,0,c);
        }
        if(!endings.items.isEmpty()&&endings.items.getLast()!=null&&endings.items.getLast().get("condition") instanceof Map<?,?> last)
            c.check("ALWAYS".equals(last.get("type")),"endings["+(endings.items.size()-1)+"].condition.type",CODE,"마지막 엔딩은 ALWAYS 조건이어야 합니다.");
        for(int i=0;i<rules.items.size();i++){
            var rule=rules.items.get(i);if(rule==null)continue;String path="rules["+i+"]",when=string(rule,"when");
            c.check(Set.of("PHASE_STARTED","CLUE_PUBLISHED","BALLOT_CLOSED").contains(when),path+".when",CODE,"허용되지 않은 규칙 이벤트입니다.");
            if(when.equals("PHASE_STARTED"))reference(rule,"phaseId",path,phases,c,"규칙 단계 참조가 올바르지 않습니다.");
            if(when.equals("CLUE_PUBLISHED"))reference(rule,"clueId",path,clues,c,"규칙 단서 참조가 올바르지 않습니다.");
            condition(rule.get("condition"),path+".condition",roles,clues,0,c);
            var effects=c.array(rule.get("effects"),path+".effects",CODE,1,16,"규칙의 효과는 1~16개여야 합니다.");if(effects==null)continue;
            for(int j=0;j<effects.size();j++){
                String ep=path+".effects["+j+"]";var effect=c.object(effects.get(j),ep,CODE,"규칙 효과 형식이 올바르지 않습니다.");if(effect==null)continue;
                switch(string(effect,"type")){
                    case "GRANT_CLUE"->{reference(effect,"roleId",ep,roles,c,"규칙 역할 참조가 올바르지 않습니다.");reference(effect,"clueId",ep,clues,c,"규칙 단서 참조가 올바르지 않습니다.");}
                    case "PUBLISH_MATERIAL"->c.text(effect,"text",20000,ep,CODE);
                    case "SET_FLAG"->{c.text(effect,"flag",100,ep,CODE);c.check(effect.get("value") instanceof Boolean||effect.get("value") instanceof String||effect.get("value") instanceof Number,ep+".value",CODE,"플래그는 단순 값이어야 합니다.");}
                    default->c.check(false,ep+".type",CODE,"허용되지 않은 규칙 효과입니다.");
                }
            }
        }
        // v1 효과는 단계 이동이나 트리거를 재발행하지 않는다. 실행 규칙은 변경하지 않는다.
    }
    private void tabletop(Map<String,Object> d,ValidationContext c){
        var table=c.object(d.get("tabletop"),"tabletop",CODE,"테이블 구성을 입력해 주세요.");if(table==null)return;
        Rows objects=rows(table.get("objects"),"tabletop.objects",0,500,c),decks=rows(table.get("decks"),"tabletop.decks",0,50,c);Set<String> all=new HashSet<>(objects.ids);
        for(int i=0;i<decks.items.size();i++){var deck=decks.items.get(i);if(deck!=null&&decks.ids.contains(string(deck,"id")))c.check(all.add(string(deck,"id")),"tabletop.decks["+i+"].id",CODE,"테이블 객체와 덱 ID는 겹칠 수 없습니다.");}
        for(int i=0;i<objects.items.size();i++){
            var o=objects.items.get(i);if(o==null)continue;String path="tabletop.objects["+i+"]",kind=string(o,"kind");
            c.check(Set.of("CARD","TOKEN","DICE","COUNTER").contains(kind),path+".kind",CODE,"테이블 객체 종류가 올바르지 않습니다.");c.text(o,"name",200,path,CODE);
            for(String key:List.of("x","y"))c.number(o,key,-16384,16384,path,CODE);for(String key:List.of("width","height"))c.number(o,key,1,4096,path,CODE);
            for(String key:List.of("locked","faceUp"))c.check(o.get(key) instanceof Boolean,path+"."+key,CODE,"객체 잠금과 앞면 상태가 필요합니다.");
            boolean sidesValid=true;
            if(kind.equals("DICE"))sidesValid=c.check(o.get("sides") instanceof Number n&&n.doubleValue()==n.intValue()&&n.intValue()>=2&&n.intValue()<=100,path+".sides",CODE,"주사위는 2~100면이어야 합니다.");
            boolean valueValid=true;
            if(Set.of("DICE","COUNTER").contains(kind))valueValid=c.check(o.get("value") instanceof Number n&&n.doubleValue()==n.intValue()&&Math.abs(n.doubleValue())<=1000000,path+".value",CODE,"숫자 값은 허용 범위의 정수여야 합니다.");
            if(kind.equals("DICE")&&sidesValid&&valueValid)c.check(integer(o,"value",0)>=1&&integer(o,"value",0)<=integer(o,"sides",0),path+".value",CODE,"주사위 초기 값은 면 수 범위에 있어야 합니다.");
        }
        int cardCount=0;
        for(int i=0;i<decks.items.size();i++){
            var deck=decks.items.get(i);if(deck==null)continue;String path="tabletop.decks["+i+"]";
            c.text(deck,"name",200,path,CODE);c.number(deck,"x",-16384,16384,path,CODE);c.number(deck,"y",-16384,16384,path,CODE);
            Rows cards=rows(deck.get("cards"),path+".cards",1,500,c);cardCount+=cards.items.size();
            for(int j=0;j<cards.items.size();j++){var card=cards.items.get(j);if(card==null)continue;String cp=path+".cards["+j+"]";if(cards.ids.contains(string(card,"id")))c.check(all.add(string(card,"id")),cp+".id",CODE,"모든 카드와 테이블 객체의 ID는 고유해야 합니다.");c.text(card,"name",200,cp,CODE);}
        }
        c.check(cardCount<=1000,"tabletop.decks",CODE,"작품 전체의 카드는 1,000개까지 만들 수 있습니다.");
    }
    private void condition(Object raw,String path,Rows roles,Rows clues,int depth,ValidationContext c){
        if(!c.check(depth<=8,path,CODE,"조건은 8단계보다 깊게 중첩할 수 없습니다."))return;
        var value=c.object(raw,path,CODE,"조건 형식을 확인해 주세요.");if(value==null)return;
        switch(string(value,"type")){
            case "ALWAYS","CULPRIT_IDENTIFIED"->{}
            case "NOT"->condition(value.get("condition"),path+".condition",roles,clues,depth+1,c);
            case "ALL","ANY"->{var children=c.array(value.get("conditions"),path+".conditions",CODE,1,16,"복합 조건은 1~16개여야 합니다.");if(children!=null)for(int i=0;i<children.size();i++)condition(children.get(i),path+".conditions["+i+"]",roles,clues,depth+1,c);}
            case "CLUE_PUBLIC","HAS_CLUE"->{reference(value,"clueId",path,clues,c,"조건 단서 참조가 올바르지 않습니다.");if(value.containsKey("roleId"))reference(value,"roleId",path,roles,c,"조건 역할 참조가 올바르지 않습니다.");}
            case "FLAG"->{c.text(value,"flag",100,path,CODE);c.check(value.containsKey("value"),path+".value",CODE,"플래그 조건에는 값이 필요합니다.");}
            default->c.check(false,path+".type",CODE,"허용되지 않은 조건입니다.");
        }
    }
    private Rows rows(Object raw,String path,int min,int max,ValidationContext c){
        var list=c.array(raw,path,CODE,min,max,"작품 항목 수와 배열 형식을 확인해 주세요.");if(list==null)return new Rows(List.of(),Set.of(),false);
        var values=new ArrayList<Map<String,Object>>();var ids=new HashSet<String>();boolean ready=list.size()>=min;
        for(int i=0;i<list.size();i++){var item=c.object(list.get(i),path+"["+i+"]",CODE,"작품 항목 형식을 확인해 주세요.");values.add(item);if(item==null)ready=false;else ready=c.id(item,ids,path+"["+i+"]",CODE)&&ready;}
        return new Rows(values,ids,ready);
    }
    private void reference(Map<String,Object> value,String key,String path,Rows rows,ValidationContext c,String message){if(rows.referencesReady)c.check(rows.ids.contains(string(value,key)),path+"."+key,CODE,message);}
    private static int integer(Map<String,Object> value,String key,int fallback){return value.get(key) instanceof Number n?n.intValue():fallback;}
    private static List<String> strings(Object value){return value instanceof List<?> list?list.stream().map(String::valueOf).toList():List.of();}
}
