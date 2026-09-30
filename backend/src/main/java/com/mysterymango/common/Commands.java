package com.mysterymango.common;

import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.dao.TransientDataAccessException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
import java.util.function.Supplier;
import java.util.function.Consumer;

@Component
public class Commands {
    private final Db db; private final Json json; private final TransactionTemplate tx;
    public Commands(Db db,Json json,PlatformTransactionManager tm){this.db=db;this.json=json;this.tx=new TransactionTemplate(tm);}
    public void lock(){db.list("select pg_advisory_xact_lock(7240912801)");}
    public <T>T transaction(Supplier<T> action){return tx.execute(status->{lock();return action.get();});}
    public <T>T run(UUID actor,String key,String scope,Object body,Supplier<T> action){
        return run(actor,key,scope,body,action,result->{});
    }
    /** Validate present-day access inside the command lock, including cache replays. */
    @SuppressWarnings("unchecked")
    public <T>T run(UUID actor,String key,String scope,Object body,Supplier<T> action,Consumer<T> authorizeResponse){
        if(key==null||key.length()<8||key.length()>128)throw new ApiException(400,"IDEMPOTENCY_REQUIRED","요청 식별자가 필요합니다.");
        String hash=hash(scope+"\n"+json.write(canonical(body)));
        for(int attempt=0;;attempt++){
            try{return transaction(()->{
                var old=db.optional("select * from command_result where user_id=? and key=?",actor,key);
                if(old!=null){if(!hash.equals(old.get("request_hash")))throw new ApiException(409,"IDEMPOTENCY_KEY_REUSED","같은 요청 식별자에 다른 내용을 보낼 수 없습니다.");T value=(T)json.object(old.get("result").toString());authorizeResponse.accept(value);return value;}
                T value=action.get();
                authorizeResponse.accept(value);
                db.update("insert into command_result(user_id,key,scope,request_hash,result) values(?,?,?,?,cast(? as jsonb))",actor,key,scope,hash,json.write(value));
                return value;
            });}catch(TransientDataAccessException e){if(attempt>=2)throw e;try{Thread.sleep(25L*(attempt+1));}catch(InterruptedException x){Thread.currentThread().interrupt();throw e;}}
        }
    }
    private Object canonical(Object value){if(value instanceof Map<?,?> m){var out=new TreeMap<String,Object>();m.forEach((k,v)->out.put(k.toString(),canonical(v)));return out;}if(value instanceof Collection<?> c)return c.stream().map(this::canonical).toList();return value;}
    public static String hash(String value){try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));}catch(Exception e){throw new IllegalStateException(e);}}
}
