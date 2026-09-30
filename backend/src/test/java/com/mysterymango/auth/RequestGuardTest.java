package com.mysterymango.auth;

import com.mysterymango.common.Json;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicBoolean;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.*;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.*;
import tools.jackson.databind.ObjectMapper;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class RequestGuardTest {
    private final RequestGuard guard=new RequestGuard(new Json(new ObjectMapper()));

    @RestController static class Echo {
        @PostMapping(value="/echo",produces="application/json;charset=UTF-8") String echo(@RequestBody String body){return body;}
    }
    @Test void acceptedBodyStillReachesMvcExactly()throws Exception {
        MockMvc mvc=MockMvcBuilders.standaloneSetup(new Echo()).addFilters(guard).build();
        mvc.perform(post("/echo").contentType("application/json").content("{\"text\":\"망고\"}"))
                .andExpect(status().isOk()).andExpect(content().string("{\"text\":\"망고\"}"))
                .andExpect(header().string("Cache-Control","no-store"));
    }
    @Test void declaredOversizedBodyIsRejected()throws Exception {
        MockMvc mvc=MockMvcBuilders.standaloneSetup(new Echo()).addFilters(guard).build();
        mvc.perform(post("/echo").contentType("application/json").content(new byte[1048577]))
                .andExpect(status().is(413)).andExpect(jsonPath("$.code").value("INPUT_TOO_LARGE"));
    }
    @Test void unknownOrDishonestLengthCannotBypassActualByteLimit()throws Exception {
        for(long length:new long[]{-1,1}){
            MockHttpServletRequest source=new MockHttpServletRequest("POST","/echo");
            source.addHeader("Transfer-Encoding","chunked");source.setContent(new byte[1048577]);
            HttpServletRequest request=new HttpServletRequestWrapper(source){
                @Override public int getContentLength(){return (int)length;}
                @Override public long getContentLengthLong(){return length;}
            };
            MockHttpServletResponse response=new MockHttpServletResponse();AtomicBoolean invoked=new AtomicBoolean();
            guard.doFilter(request,response,(req,res)->invoked.set(true));
            assertEquals(413,response.getStatus());assertFalse(invoked.get());
        }
    }
    @Test void unknownLengthSmallBodyIsPreserved()throws Exception {
        MockHttpServletRequest source=new MockHttpServletRequest("POST","/echo");
        byte[] body="{\"message\":\"safe\"}".getBytes(StandardCharsets.UTF_8);source.setContent(body);
        HttpServletRequest request=new HttpServletRequestWrapper(source){
            @Override public int getContentLength(){return -1;}
            @Override public long getContentLengthLong(){return -1;}
        };
        guard.doFilter(request,new MockHttpServletResponse(),(req,res)->assertArrayEquals(body,req.getInputStream().readAllBytes()));
    }
}
