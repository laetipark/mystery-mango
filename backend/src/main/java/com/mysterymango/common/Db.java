package com.mysterymango.common;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import java.util.*;
import java.time.Instant;
import java.sql.Timestamp;

@Component
public class Db {
    private final JdbcTemplate jdbc;
    public Db(JdbcTemplate jdbc) { this.jdbc=jdbc; }
    public List<Map<String,Object>> list(String sql,Object... args) { return jdbc.queryForList(sql,parameters(args)); }
    public Map<String,Object> optional(String sql,Object... args) { var rows=list(sql,args); return rows.isEmpty()?null:rows.getFirst(); }
    public Map<String,Object> one(String sql,Object... args) { var row=optional(sql,args); if(row==null) throw new ApiException(404,"NOT_FOUND","요청한 항목을 찾을 수 없습니다."); return row; }
    public int update(String sql,Object... args) { return jdbc.update(sql,parameters(args)); }
    private Object[] parameters(Object[] args) { return Arrays.stream(args).map(v->v instanceof Instant instant?Timestamp.from(instant):v).toArray(); }
    public static UUID uuid(Map<String,Object> row,String key) { var value=row.get(key); return value==null?null:UUID.fromString(value.toString()); }
    public static String str(Map<String,Object> row,String key) { var value=row.get(key); return value==null?null:value.toString(); }
    public static int num(Map<String,Object> row,String key) { return ((Number)row.get(key)).intValue(); }
    public static Instant instant(Map<String,Object> row,String key) { var value=row.get(key); if(value==null)return null; if(value instanceof Timestamp t)return t.toInstant(); if(value instanceof java.time.OffsetDateTime t)return t.toInstant(); return Instant.parse(value.toString()); }
}
