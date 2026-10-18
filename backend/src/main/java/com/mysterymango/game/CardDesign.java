package com.mysterymango.game;

import java.util.*;
import static com.mysterymango.game.Definitions.*;

/** 고정한 카드 디자인에서 현재 보이는 한 면의 시각 정보만 만든다. */
final class CardDesign {
    private CardDesign() {}

    static Map<String,Object> face(Map<String,Object> state,Object reference,boolean front) {
        if(reference==null||reference.toString().isBlank())return null;
        var layout=objects(state.get("cardLayouts")).stream()
            .filter(candidate->reference.equals(candidate.get("id"))).findFirst()
            .orElseThrow(()->BoardEngine.error("INVALID_CARD_LAYOUT","카드 디자인 연결을 확인해 주세요."));
        var side=map(layout.get(front?"front":"back"));
        BoardEngine.check(side.containsKey("background")&&side.get("nodes") instanceof List<?>,"INVALID_CARD_LAYOUT","카드 디자인의 면을 확인해 주세요.");
        var nodes=objects(side.get("nodes")).stream().map(node->{
            var view=new LinkedHashMap<String,Object>();
            for(String key:List.of("kind","x","y","width","height","rotation","fill"))if(node.containsKey(key))view.put(key,node.get(key));
            if("TEXT".equals(str(node,"kind")))for(String key:List.of("text","fontSize"))if(node.containsKey(key))view.put(key,node.get(key));
            if("IMAGE".equals(str(node,"kind"))&&node.get("assetId")!=null)view.put("assetId",node.get("assetId"));
            return view;
        }).toList();
        return obj("width",layout.get("width"),"height",layout.get("height"),"background",side.get("background"),"nodes",nodes);
    }

    static void applyToCard(Map<String,Object> state,Map<String,Object> source,Map<String,Object> view,int seat) {
        boolean front=source.get("ownerSeat") instanceof Number owner&&owner.intValue()==seat||bool(source,"faceUp");
        Object reference=front?source.get("layoutId"):source.containsKey("backLayoutId")?source.get("backLayoutId"):source.get("layoutId");
        var design=face(state,reference,front);
        if(design!=null){
            for(String key:List.of("name","text","assetId","backAssetId"))view.remove(key);
            view.put("faceDesign",design);
        }else if(front)view.remove("backAssetId");
        else for(String key:List.of("name","text","assetId"))view.remove(key);
    }
}
