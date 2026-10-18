package com.mysterymango.author;

import com.mysterymango.common.ApiException;
import java.util.*;

/** Explicit, recursive editor contract. Unknown extension fields never enter editor or public DTOs. */
public final class AuthorDocument {
    private AuthorDocument() {}
    private static final Map<String,Object> CONDITION=new LinkedHashMap<>();
    private static final Map<String,Object> EFFECT=shape("type roleId clueId text flag value");
    private static final Map<String,Object> NODE=shape("id kind x y width height rotation fill text fontSize assetId locked hidden bindingType bindingId");
    private static final Map<String,Object> CARD_NODE=shape("id kind x y width height rotation fill text fontSize assetId locked hidden");
    private static final Map<String,Object> CARD_FACE=shape("background","nodes",List.of(CARD_NODE));
    private static final Map<String,Object> CARD_LAYOUT=shape("id name width height","front",CARD_FACE,"back",CARD_FACE);
    private static final Map<String,Object> SCENE=shape("id name kind referenceId width height background bgmAssetId","phaseIds",List.of("scalar"),"nodes",List.of(NODE));
    private static final Map<String,Object> TABLE_OBJECT=shape("id kind name text assetId backAssetId layoutId x y width height locked faceUp sides value");
    private static final Map<String,Object> CARD=shape("id name text assetId layoutId");
    private static final Map<String,Object> DECK=shape("id name backAssetId backLayoutId x y","cards",List.of(CARD));
    private static final Map<String,Object> ROOT;
    static {
        CONDITION.putAll(shape("type clueId roleId flag value"));
        CONDITION.put("condition",CONDITION);CONDITION.put("conditions",List.of(CONDITION));
        ROOT=shape("schemaVersion slug title synopsis playerCount estimatedMinutes genre difficulty language gameType engineId",
            "modes",List.of("scalar"),"supportedPlayerCounts",List.of("scalar"),
            "roles",List.of(shape("id name publicIntro secret","objective",shape("text","condition",CONDITION))),
            "phases",List.of(shape("id kind durationSeconds publicText investigationLimit","actions",List.of("scalar"))),
            "targets",List.of(shape("id name","phaseIds",List.of("scalar"),"clueIds",List.of("scalar"))),
            "clues",List.of(shape("id title text sharePolicy")),"ballot",shape("culpritRoleId allowChange allowAbstain tiePolicy"),
            "endings",List.of(shape("id title text","condition",CONDITION)),
            "rules",List.of(shape("id when phaseId clueId","condition",CONDITION,"effects",List.of(EFFECT))),
            "presentation",shape("","scenes",List.of(SCENE),"cardLayouts",List.of(CARD_LAYOUT)),
            "yacht",shape("diceColor pipColor scoreboardColor"),
            "classic",shape("boardColor lightSquareColor darkSquareColor firstPieceColor secondPieceColor"),
            "tabletop",shape("","objects",List.of(TABLE_OBJECT),"decks",List.of(DECK)));
    }
    private static Map<String,Object> shape(String scalars,Object... children){
        var out=new LinkedHashMap<String,Object>();for(String key:scalars.split(" "))if(!key.isBlank())out.put(key,"scalar");
        for(int i=0;i<children.length;i+=2)out.put((String)children[i],children[i+1]);return out;
    }
    public static Map<String,Object> project(Map<String,Object> input){
        if(input==null)throw new ApiException(422,"INVALID_DOCUMENT","작품 문서를 입력해 주세요.");
        return object(input,ROOT,0,new int[]{0});
    }
    @SuppressWarnings("unchecked") private static Map<String,Object> object(Map<?,?> value,Map<String,Object> fields,int depth,int[] count){
        if(depth>32||++count[0]>20000)throw invalid();var out=new LinkedHashMap<String,Object>();
        for(var entry:fields.entrySet())if(value.containsKey(entry.getKey())){
            Object item=value.get(entry.getKey()),spec=entry.getValue();
            if(item==null){out.put(entry.getKey(),null);continue;}
            if(spec instanceof Map<?,?> children){if(!(item instanceof Map<?,?> map))throw invalid();out.put(entry.getKey(),object(map,(Map<String,Object>)children,depth+1,count));}
            else if(spec instanceof List<?> children){if(!(item instanceof List<?> list)||list.size()>2000)throw invalid();var result=new ArrayList<>();for(Object child:list){if(children.getFirst() instanceof Map<?,?> childSpec){if(!(child instanceof Map<?,?> map))throw invalid();result.add(object(map,(Map<String,Object>)childSpec,depth+1,count));}else result.add(scalar(child));}out.put(entry.getKey(),result);}
            else out.put(entry.getKey(),scalar(item));
        }return out;
    }
    private static Object scalar(Object value){if(value==null||value instanceof Boolean)return value;if(value instanceof String s&&s.length()<=50000)return s;if(value instanceof Number n&&Double.isFinite(n.doubleValue()))return value;throw invalid();}
    private static ApiException invalid(){return new ApiException(422,"INVALID_DOCUMENT","작품 문서의 형식이나 크기를 확인해 주세요.");}
    public static Set<UUID> assetIds(Map<String,Object> document){
        var result=new LinkedHashSet<UUID>();collect(document,result);return result;
    }
    private static void collect(Object value,Set<UUID> out){
        if(value instanceof Map<?,?> map)for(var entry:map.entrySet()){
            if(Set.of("assetId","backAssetId","bgmAssetId").contains(entry.getKey())&&entry.getValue()!=null&&!entry.getValue().toString().isBlank()){
                try{out.add(UUID.fromString(entry.getValue().toString()));}catch(IllegalArgumentException ex){throw new ApiException(422,"INVALID_ASSET_REFERENCE","올바른 자산을 선택해 주세요.");}
            }else collect(entry.getValue(),out);
        }else if(value instanceof List<?> list)for(Object child:list)collect(child,out);
    }
}
