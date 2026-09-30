package com.mysterymango.security;

import java.time.Instant;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

/** Checks the explicit OpenAPI subset used by the application's response DTOs against real JSON. */
final class WireContractAssertions {
    private WireContractAssertions() {}

    @SuppressWarnings("unchecked")
    static void response(Map<String,Object> document,String path,Object value) {
        var paths=(Map<String,Object>)document.get("paths");
        var operation=(Map<String,Object>)((Map<String,Object>)paths.get(path)).get("get");
        var responses=(Map<String,Object>)operation.get("responses");
        var content=(Map<String,Object>)((Map<String,Object>)responses.get("200")).get("content");
        var schema=(Map<String,Object>)((Map<String,Object>)content.get("application/json")).get("schema");
        check(document,schema,value,path);
    }

    @SuppressWarnings("unchecked")
    private static void check(Map<String,Object> document,Map<String,Object> schema,Object value,String path) {
        if(schema.containsKey("$ref")) {
            Object target=document;
            for(String part:schema.get("$ref").toString().substring(2).split("/"))target=((Map<String,Object>)target).get(part);
            assertNotNull(target,"Unresolved schema at "+path);
            check(document,(Map<String,Object>)target,value,path);return;
        }
        if(schema.containsKey("anyOf")) {
            for(var alternative:(List<Map<String,Object>>)schema.get("anyOf")) {
                try {check(document,alternative,value,path);return;} catch(AssertionError ignored) {}
            }
            fail("No nullable/schema alternative matches "+path+" (type "+(value==null?"null":value.getClass().getSimpleName())+")");
        }
        if(schema.containsKey("allOf"))for(var part:(List<Map<String,Object>>)schema.get("allOf"))check(document,part,value,path);
        String type=Objects.toString(schema.get("type"),"");
        switch(type) {
            case "null" -> assertNull(value,path);
            case "object" -> {
                assertInstanceOf(Map.class,value,path);var object=(Map<String,Object>)value;
                var properties=(Map<String,Object>)schema.getOrDefault("properties",Map.of());
                for(String required:(List<String>)schema.getOrDefault("required",List.of()))assertTrue(object.containsKey(required),path+" missing "+required);
                if(Boolean.FALSE.equals(schema.get("additionalProperties")))assertTrue(properties.keySet().containsAll(object.keySet()),path+" contains undocumented fields "+object.keySet());
                for(var field:object.entrySet())if(properties.containsKey(field.getKey()))check(document,(Map<String,Object>)properties.get(field.getKey()),field.getValue(),path+"."+field.getKey());
            }
            case "array" -> {
                assertInstanceOf(List.class,value,path);int index=0;
                for(Object item:(List<?>)value)check(document,(Map<String,Object>)schema.get("items"),item,path+"["+index+++ "]");
            }
            case "string" -> {
                assertInstanceOf(String.class,value,path);
                if("uuid".equals(schema.get("format")))assertDoesNotThrow(()->UUID.fromString((String)value),path);
                if("date-time".equals(schema.get("format")))assertDoesNotThrow(()->Instant.parse((String)value),path);
            }
            case "integer" -> {assertInstanceOf(Number.class,value,path);assertEquals(((Number)value).doubleValue(),((Number)value).longValue(),path);}
            case "boolean" -> assertInstanceOf(Boolean.class,value,path);
            case "number" -> assertInstanceOf(Number.class,value,path);
            default -> assertTrue(schema.containsKey("anyOf")||schema.containsKey("allOf"),"Unverified schema shape: "+path);
        }
        if(schema.containsKey("enum"))assertTrue(((List<?>)schema.get("enum")).contains(value),path+" enum mismatch");
    }
}
