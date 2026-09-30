package com.mysterymango.game;

import com.mysterymango.common.ApiException;
import java.util.*;

final class Definitions {
    private Definitions() {}
    @SuppressWarnings("unchecked") static Map<String,Object> map(Object value) { return value instanceof Map ? (Map<String,Object>)value : Map.of(); }
    @SuppressWarnings("unchecked") static List<Map<String,Object>> objects(Object value) { return value instanceof List ? ((List<?>)value).stream().map(Definitions::map).toList() : List.of(); }
    static List<String> strings(Object value) { return value instanceof List ? ((List<?>)value).stream().map(String::valueOf).toList() : List.of(); }
    static String str(Map<String,Object> map,String key) { return String.valueOf(map.getOrDefault(key,"")); }
    static int integer(Map<String,Object> map,String key,int fallback) { Object v=map.get(key); return v instanceof Number n ? n.intValue():fallback; }
    static boolean bool(Map<String,Object> map,String key) { return Boolean.TRUE.equals(map.get(key)); }
    static Map<String,Object> find(Map<String,Object> definition,String collection,String id) { return objects(definition.get(collection)).stream().filter(x->id.equals(str(x,"id"))).findFirst().orElseThrow(()->new ApiException(422,"INVALID_SCENARIO_REFERENCE","작품의 자료 참조가 올바르지 않습니다.")); }
    static Map<String,Object> obj(Object... pairs) { Map<String,Object> result=new LinkedHashMap<>(); for(int i=0;i<pairs.length;i+=2) result.put((String)pairs[i],pairs[i+1]); return result; }
}
