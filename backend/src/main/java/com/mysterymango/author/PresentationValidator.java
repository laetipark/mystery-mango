package com.mysterymango.author;

import com.mysterymango.common.ValidationContext;
import java.util.*;
import static com.mysterymango.common.ValidationContext.string;

public final class PresentationValidator {
    private static final String CODE="INVALID_PRESENTATION";
    private PresentationValidator() {}
    public static void validate(Map<String,Object> document){validate(document,ValidationContext.failFast());}
    public static void validate(Map<String,Object> document,ValidationContext c){
        for(String kind:List.of("yacht","classic"))if(document.get(kind)!=null){
            var appearance=c.object(document.get(kind),kind,CODE,"게임 디자인 형식이 올바르지 않습니다.");
            if(appearance!=null)for(String key:kind.equals("yacht")?List.of("diceColor","pipColor","scoreboardColor"):List.of("boardColor","lightSquareColor","darkSquareColor","firstPieceColor","secondPieceColor"))c.color(appearance,key,kind,CODE);
        }
        int nodeCount=CardLayoutValidator.validate(document,c);
        Object value=document.get("presentation");if(value==null){AssetReferences.scan(document,c);return;}
        var presentation=c.object(value,"presentation",CODE,"장면 형식이 올바르지 않습니다.");if(presentation==null)return;
        var scenes=c.array(presentation.get("scenes"),"presentation.scenes",CODE,0,100,"장면은 100개까지 만들 수 있습니다.");if(scenes==null)return;
        Set<String> phases=ids(document,"phases",c),roles=ids(document,"roles",c),clues=ids(document,"clues",c),targets=ids(document,"targets",c),sceneIds=new HashSet<>();
        for(int i=0;i<scenes.size();i++){
            String path="presentation.scenes["+i+"]";var scene=c.object(scenes.get(i),path,CODE,"장면 형식이 올바르지 않습니다.");if(scene==null)continue;
            c.id(scene,sceneIds,path,CODE);c.text(scene,"name",200,path,CODE);String kind=string(scene,"kind");
            c.check(Set.of("SCENE","ROLE","CLUE").contains(kind),path+".kind",CODE,"장면 종류를 선택해 주세요.");
            if(kind.equals("ROLE"))reference(scene,"referenceId",roles,path,c,"연결한 역할이 없습니다.");
            if(kind.equals("CLUE"))reference(scene,"referenceId",clues,path,c,"연결한 단서가 없습니다.");
            if(c.check(scene.get("phaseIds") instanceof List<?>,path+".phaseIds",CODE,"장면의 단계 참조를 확인해 주세요.")&&phases!=null){
                var refs=(List<?>)scene.get("phaseIds");for(int j=0;j<refs.size();j++)c.check(phases.contains(refs.get(j)),path+".phaseIds["+j+"]",CODE,"장면의 단계 참조를 확인해 주세요.");
            }
            c.number(scene,"width",1,4096,path,CODE);c.number(scene,"height",1,4096,path,CODE);c.color(scene,"background",path,CODE);
            var nodes=c.array(scene.get("nodes"),path+".nodes",CODE,0,200,"장면 하나에 요소는 200개까지 넣을 수 있습니다.");if(nodes==null)continue;
            nodeCount+=nodes.size();if(!c.check(nodeCount<=2000,path+".nodes",CODE,"전체 장면과 카드 디자인 요소는 2,000개까지 만들 수 있습니다."))break;
            Set<String> nodeIds=new HashSet<>();
            for(int j=0;j<nodes.size();j++){
                String np=path+".nodes["+j+"]";var node=c.object(nodes.get(j),np,CODE,"요소 형식이 올바르지 않습니다.");if(node==null)continue;c.id(node,nodeIds,np,CODE);
                String type=string(node,"kind");c.check(Set.of("TEXT","IMAGE","RECT","ELLIPSE","MATERIAL").contains(type),np+".kind",CODE,"요소 종류를 선택해 주세요.");
                for(String key:List.of("x","y"))c.number(node,key,-16384,16384,np,CODE);
                for(String key:List.of("width","height"))c.number(node,key,1,4096,np,CODE);c.number(node,"rotation",-36000,36000,np,CODE);
                for(String key:List.of("locked","hidden"))c.check(node.get(key) instanceof Boolean,np+"."+key,CODE,"요소 잠금과 숨김 상태를 확인해 주세요.");
                if(node.containsKey("fill"))c.color(node,"fill",np,CODE);
                if(Set.of("TEXT","MATERIAL").contains(type)){c.check(node.get("text") instanceof String s&&s.length()<=20000,np+".text",CODE,"텍스트는 20,000자까지 입력할 수 있습니다.");c.number(node,"fontSize",6,240,np,CODE);}
                if(type.equals("IMAGE"))c.check(node.get("assetId")!=null&&!string(node,"assetId").isBlank(),np+".assetId",CODE,"이미지 파일을 선택해 주세요.");
                String binding=string(node,"bindingType");
                switch(binding){
                    case "NONE"->c.check(string(node,"bindingId").isBlank(),np+".bindingId",CODE,"연결하지 않은 요소의 대상은 비워 주세요.");
                    case "ROLE"->reference(node,"bindingId",roles,np,c,"연결한 역할이 없습니다.");
                    case "CLUE"->reference(node,"bindingId",clues,np,c,"연결한 단서가 없습니다.");
                    case "TARGET"->reference(node,"bindingId",targets,np,c,"연결한 조사 대상이 없습니다.");
                    default->c.check(false,np+".bindingType",CODE,"연결 종류를 선택해 주세요.");
                }
            }
        }
        AssetReferences.scan(document,c);
    }
    /** 잘못된 ID 목록에 의존하는 참조 오류를 연쇄 생성하지 않는다. */
    private static Set<String> ids(Map<String,Object> document,String key,ValidationContext c){
        var out=new HashSet<String>();Object value=document.get(key);
        if(c.hasIssueAt(key))return null;
        if(value==null)return out;
        if(!(value instanceof List<?> list)){c.check(false,key,CODE,"연결 대상 목록의 형식을 확인해 주세요.");return null;}
        for(int i=0;i<list.size();i++){
            String path=key+"["+i+"]";if(c.hasIssueAt(path)||c.hasIssueAt(path+".id"))return null;
            if(!(list.get(i) instanceof Map<?,?> map)||!(map.get("id") instanceof String id)||!id.matches("[A-Za-z0-9_-]{1,100}")||!out.add(id)){
                c.check(false,path+".id",CODE,"연결 대상 ID와 중복 여부를 확인해 주세요.");return null;
            }
        }
        return out;
    }
    private static void reference(Map<String,Object> object,String key,Set<String> ids,String path,ValidationContext c,String message){if(ids!=null)c.check(ids.contains(string(object,key)),path+"."+key,CODE,message);}
}
