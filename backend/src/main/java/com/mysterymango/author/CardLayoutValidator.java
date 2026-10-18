package com.mysterymango.author;

import com.mysterymango.common.ValidationContext;
import java.util.*;
import static com.mysterymango.common.ValidationContext.string;

/** 카드 면은 정적인 시각 요소만 사용하며 게임 자료 바인딩이나 실행 코드를 갖지 않는다. */
final class CardLayoutValidator {
    private static final String CODE="INVALID_PRESENTATION";
    private CardLayoutValidator() {}
    static int validate(Map<String,Object> document,ValidationContext c) {
        var presentation=map(document.get("presentation"));var ids=new HashSet<String>();int nodeCount=0;boolean referencesReady=true;
        if(presentation.containsKey("cardLayouts")){
            var layouts=c.array(presentation.get("cardLayouts"),"presentation.cardLayouts",CODE,0,100,"카드 디자인은 100개까지 만들 수 있습니다.");
            if(layouts==null)referencesReady=false;
            else for(int i=0;i<layouts.size();i++){
                String path="presentation.cardLayouts["+i+"]";var layout=c.object(layouts.get(i),path,CODE,"카드 디자인 형식을 확인해 주세요.");
                if(layout==null){referencesReady=false;continue;}
                referencesReady=c.id(layout,ids,path,CODE)&&referencesReady;
                c.text(layout,"name",200,path,CODE);c.number(layout,"width",1,4096,path,CODE);c.number(layout,"height",1,4096,path,CODE);
                for(String side:List.of("front","back")){
                    var face=c.object(layout.get(side),path+"."+side,CODE,"카드 디자인 형식을 확인해 주세요.");
                    if(face!=null)nodeCount+=face(face,path+"."+side,c);
                }
                if(!c.check(nodeCount<=2000,"presentation.cardLayouts",CODE,"전체 장면과 카드 디자인 요소는 2,000개까지 만들 수 있습니다.")){referencesReady=false;break;}
            }
        }
        var tabletop=map(document.get("tabletop"));
        if(referencesReady){
            var objects=rows(tabletop.get("objects"));
            for(int i=0;i<objects.size();i++){
                var item=map(objects.get(i));String path="tabletop.objects["+i+"]";
                if(reference(item,"layoutId",ids,path,c))c.check("CARD".equals(item.get("kind")),path+".layoutId",CODE,"카드에만 카드 디자인을 연결할 수 있습니다.");
            }
            var decks=rows(tabletop.get("decks"));
            for(int i=0;i<decks.size();i++){
                var deck=map(decks.get(i));String path="tabletop.decks["+i+"]";reference(deck,"backLayoutId",ids,path,c);
                var cards=rows(deck.get("cards"));for(int j=0;j<cards.size();j++)reference(map(cards.get(j)),"layoutId",ids,path+".cards["+j+"]",c);
            }
        }
        return nodeCount;
    }
    private static int face(Map<String,Object> face,String path,ValidationContext c){
        c.color(face,"background",path,CODE);var nodes=c.array(face.get("nodes"),path+".nodes",CODE,0,200,"카드 한 면에 요소는 200개까지 넣을 수 있습니다.");if(nodes==null)return 0;
        var ids=new HashSet<String>();
        for(int i=0;i<nodes.size();i++){
            String np=path+".nodes["+i+"]";var node=c.object(nodes.get(i),np,CODE,"카드 디자인 형식을 확인해 주세요.");if(node==null)continue;
            c.id(node,ids,np,CODE);String kind=string(node,"kind");
            c.check(Set.of("TEXT","IMAGE","RECT","ELLIPSE").contains(kind),np+".kind",CODE,"카드에는 텍스트·이미지·사각형·타원만 넣을 수 있습니다.");
            for(String key:List.of("x","y"))c.number(node,key,-16384,16384,np,CODE);
            for(String key:List.of("width","height"))c.number(node,key,1,4096,np,CODE);c.number(node,"rotation",-36000,36000,np,CODE);
            for(String key:List.of("locked","hidden"))if(node.containsKey(key))c.check(node.get(key) instanceof Boolean,np+"."+key,CODE,"편집 상태는 참 또는 거짓이어야 합니다.");
            if(node.containsKey("fill"))c.color(node,"fill",np,CODE);
            if(kind.equals("TEXT")){c.check(node.get("text") instanceof String text&&text.length()<=20000,np+".text",CODE,"텍스트는 20,000자까지 입력할 수 있습니다.");c.number(node,"fontSize",6,240,np,CODE);}
            if(kind.equals("IMAGE")){
                boolean valid;try{UUID.fromString(string(node,"assetId"));valid=node.get("assetId") instanceof String;}catch(IllegalArgumentException ex){valid=false;}
                c.check(valid,np+".assetId",CODE,"이미지 파일을 선택해 주세요.");
            }
        }
        return nodes.size();
    }
    private static boolean reference(Map<String,Object> item,String key,Set<String> ids,String path,ValidationContext c){
        Object value=item.get(key);if(value==null||value instanceof String text&&text.isBlank())return false;
        return c.check(value instanceof String&&ids.contains(value),path+"."+key,CODE,"연결한 카드 디자인이 없습니다.");
    }
    @SuppressWarnings("unchecked") private static Map<String,Object> map(Object value){return value instanceof Map<?,?>?(Map<String,Object>)value:Map.of();}
    private static List<?> rows(Object value){return value instanceof List<?> list&&list.size()<=2000?list:List.of();}
}
