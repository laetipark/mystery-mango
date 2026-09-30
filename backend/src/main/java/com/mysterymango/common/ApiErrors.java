package com.mysterymango.common;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;
import java.util.Map;

@RestControllerAdvice
public class ApiErrors {
    @ExceptionHandler(ApiException.class)
    ResponseEntity<?> api(ApiException e, HttpServletRequest request) { return error(e.status, e.code, e.getMessage(), request); }
    @ExceptionHandler({IllegalArgumentException.class, MethodArgumentNotValidException.class, HttpMessageNotReadableException.class, org.springframework.beans.TypeMismatchException.class})
    ResponseEntity<?> invalid(Exception e, HttpServletRequest request) { return error(400,"INVALID_REQUEST","입력 내용을 확인해 주세요.",request); }
    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<?> conflict(Exception e, HttpServletRequest request) { return error(409,"CONFLICT","이미 처리되었거나 다른 요청과 충돌했습니다.",request); }
    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<?> forbidden(Exception e, HttpServletRequest request) { return error(403,"FORBIDDEN","접근 권한이 없습니다.",request); }
    @ExceptionHandler(Exception.class)
    ResponseEntity<?> unknown(Exception e,HttpServletRequest request) {
        if(e instanceof org.springframework.web.ErrorResponse response && response.getStatusCode().is4xxClientError()) {
            int status=response.getStatusCode().value();
            String code=switch(status){case 404->"NOT_FOUND";case 405->"METHOD_NOT_ALLOWED";case 415->"UNSUPPORTED_MEDIA_TYPE";default->"INVALID_REQUEST";};
            String message=switch(status){case 404->"요청한 항목을 찾을 수 없습니다.";case 405->"지원하지 않는 요청 방식입니다.";case 415->"JSON 형식으로 요청해 주세요.";default->"입력 내용과 필수 헤더를 확인해 주세요.";};
            return error(status,code,message,request);
        }
        org.slf4j.LoggerFactory.getLogger(ApiErrors.class).error("Request failed trace={} class={}",request.getAttribute("traceId"),e.getClass().getName());
        return error(500,"INTERNAL_ERROR","요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.",request);
    }
    private ResponseEntity<?> error(int status,String code,String message,HttpServletRequest r) {
        return ResponseEntity.status(status).body(Map.of("code",code,"message",message,"traceId",String.valueOf(r.getAttribute("traceId"))));
    }
}
