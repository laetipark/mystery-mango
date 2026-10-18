package com.mysterymango.author;

import com.mysterymango.common.Json;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;

@RestControllerAdvice @Order(Ordered.HIGHEST_PRECEDENCE)
public class AssetErrors {
    @ExceptionHandler(MaxUploadSizeExceededException.class) public ResponseEntity<?> tooLarge(MaxUploadSizeExceededException ex,HttpServletRequest request){return ResponseEntity.status(413).body(Json.map("code","ASSET_TOO_LARGE","message","음원은 25MB, 이미지는 10MB까지 업로드할 수 있습니다.","traceId",String.valueOf(request.getAttribute("traceId"))));}
    @ExceptionHandler(MultipartException.class) public ResponseEntity<?> invalid(MultipartException ex,HttpServletRequest request){return ResponseEntity.badRequest().body(Json.map("code","INVALID_UPLOAD","message","파일 업로드 형식을 확인해 주세요.","traceId",String.valueOf(request.getAttribute("traceId"))));}
}
