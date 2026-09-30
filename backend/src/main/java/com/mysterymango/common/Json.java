package com.mysterymango.common;

import tools.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import java.util.*;

@Component
public class Json {
    private final ObjectMapper mapper;
    public Json(ObjectMapper mapper){this.mapper=mapper;}
    public String write(Object value){return mapper.writeValueAsString(value);}
    @SuppressWarnings("unchecked") public Map<String,Object> object(String value){return mapper.readValue(value,Map.class);}
    public <T>T read(String value,Class<T> type){return mapper.readValue(value,type);}
    public static Map<String,Object> map(Object... pairs){Map<String,Object> result=new LinkedHashMap<>();for(int i=0;i<pairs.length;i+=2)result.put((String)pairs[i],pairs[i+1]);return result;}
}

