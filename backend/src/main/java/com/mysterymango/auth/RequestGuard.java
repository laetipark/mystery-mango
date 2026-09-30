package com.mysterymango.auth;
import com.mysterymango.common.*;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
@Component
public class RequestGuard extends OncePerRequestFilter {
    private static final int MAX_BODY_BYTES=1048576;
    private final Json json;private final ConcurrentHashMap<String,Window> windows=new ConcurrentHashMap<>();
    private record Window(long minute,int count){}
    public RequestGuard(Json json){this.json=json;}
    @Override protected void doFilterInternal(HttpServletRequest req,HttpServletResponse res,FilterChain chain)throws IOException,ServletException{
        String trace=UUID.randomUUID().toString();req.setAttribute("traceId",trace);res.setHeader("X-Trace-Id",trace);res.setHeader("Cache-Control","no-store");res.setHeader("Referrer-Policy","no-referrer");
        String path=req.getRequestURI();long minute=System.currentTimeMillis()/60000;
        if(windows.size()>10000)windows.entrySet().removeIf(e->e.getValue().minute<minute);
        boolean auth=path.startsWith("/api/v1/auth/login")||path.startsWith("/api/v1/auth/register");
        boolean write=!Set.of("GET","HEAD","OPTIONS").contains(req.getMethod());
        if(req.getContentLengthLong()>MAX_BODY_BYTES){reject(res,413,"INPUT_TOO_LARGE","입력 크기가 너무 큽니다.",trace);return;}
        var authentication=SecurityContextHolder.getContext().getAuthentication();
        String actor=authentication!=null && authentication.isAuthenticated() && !(authentication instanceof AnonymousAuthenticationToken)?authentication.getName():req.getRemoteAddr();
        String key=(auth?"auth:":write?"write:":"read:")+actor;
        Window w=windows.compute(key,(k,old)->new Window(minute,old==null||old.minute!=minute?1:old.count+1));
        int max=auth?30:write?180:900;
        if(w.count>max){res.setHeader("Retry-After","60");reject(res,429,"RATE_LIMITED","요청이 많습니다. 잠시 후 다시 시도해 주세요.",trace);return;}
        // Bound actual bytes as well as the untrusted Content-Length header. This application
        // accepts small JSON requests, so downstream MVC can safely read a bounded copy.
        byte[] body=req.getInputStream().readNBytes(MAX_BODY_BYTES+1);
        if(body.length>MAX_BODY_BYTES){reject(res,413,"INPUT_TOO_LARGE","입력 크기가 너무 큽니다.",trace);return;}
        chain.doFilter(new BodyRequest(req,body),res);
    }
    private static final class BodyRequest extends HttpServletRequestWrapper {
        private final byte[] body;
        BodyRequest(HttpServletRequest request,byte[] body){super(request);this.body=body;}
        @Override public int getContentLength(){return body.length;}
        @Override public long getContentLengthLong(){return body.length;}
        @Override public ServletInputStream getInputStream(){
            ByteArrayInputStream input=new ByteArrayInputStream(body);
            return new ServletInputStream(){
                @Override public int read(){return input.read();}
                @Override public int read(byte[] bytes,int offset,int length){return input.read(bytes,offset,length);}
                @Override public boolean isFinished(){return input.available()==0;}
                @Override public boolean isReady(){return true;}
                @Override public void setReadListener(ReadListener listener){throw new IllegalStateException("Only blocking JSON request bodies are supported");}
            };
        }
        @Override public BufferedReader getReader(){String encoding=getCharacterEncoding();return new BufferedReader(new InputStreamReader(getInputStream(),encoding==null?StandardCharsets.UTF_8:java.nio.charset.Charset.forName(encoding)));}
    }
    private void reject(HttpServletResponse res,int status,String code,String message,String trace)throws IOException{res.setStatus(status);res.setContentType("application/json;charset=UTF-8");res.getWriter().write(json.write(Json.map("code",code,"message",message,"traceId",trace)));}
}
