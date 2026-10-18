package com.mysterymango.author;

import com.mysterymango.common.ValidationContext;
import java.util.*;

/** 동일 파일을 여러 위치에서 사용해도 각 위치의 오류 경로를 보존한다. 파일 원문은 읽지 않는다. */
final class AssetReferences {
    record Reference(String path, UUID id, String kind) {}
    static List<Reference> scan(Map<String,Object> document,ValidationContext context){
        var result=new ArrayList<Reference>();scan(document,"",0,new int[]{0},context,result);return result;
    }
    private static void scan(Object value,String path,int depth,int[] visited,ValidationContext context,List<Reference> result){
        if(!context.check(depth<=32&&++visited[0]<=20000,path.isEmpty()?"$":path,"INVALID_DOCUMENT","작품 문서의 형식이나 크기를 확인해 주세요."))return;
        if(value instanceof Map<?,?> map){
            var keys=map.keySet().stream().filter(String.class::isInstance).map(String.class::cast).sorted().toList();
            for(String key:keys){
                Object child=map.get(key);String next=ValidationContext.field(path,key);
                if(Set.of("assetId","backAssetId","bgmAssetId").contains(key)&&child!=null&&!child.toString().isBlank()){
                    UUID id=null;
                    if(child instanceof String text)try{id=UUID.fromString(text);}catch(IllegalArgumentException ignored){}
                    if(context.check(id!=null,next,"INVALID_ASSET_REFERENCE","올바른 자산을 선택해 주세요."))result.add(new Reference(next,id,key.equals("bgmAssetId")?"audio/":"image/"));
                }else if(child instanceof Map<?,?>||child instanceof List<?>)scan(child,next,depth+1,visited,context,result);
            }
        }else if(value instanceof List<?> list){
            if(!context.check(list.size()<=2000,path,"INVALID_DOCUMENT","작품 문서의 형식이나 크기를 확인해 주세요."))return;
            for(int i=0;i<list.size();i++)if(list.get(i) instanceof Map<?,?>||list.get(i) instanceof List<?>)scan(list.get(i),path+"["+i+"]",depth+1,visited,context,result);
        }
    }
}
