package com.jpproject.dear.exception;

import com.jpproject.dear.dto.ApiErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiErrorResponse> handleApiException(ApiException e) {
        ApiErrorResponse body = new ApiErrorResponse(e.getStatus().value(),
                e.getCode(),
                e.getMessage(),
                Map.of());
        return ResponseEntity.status(e.getStatus()).body(body);
    }

    // @Valid 검증 실패 → 400, 필드별 메시지
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException e) {
        Map<String, String> errors = new LinkedHashMap<>();
        e.getBindingResult().getFieldErrors()
                .forEach(f -> errors.putIfAbsent(f.getField(), f.getDefaultMessage()));
        ApiErrorResponse body = new ApiErrorResponse(HttpStatus.BAD_REQUEST.value(),
                "입력값이 올바르지 않습니다.", errors);
        return ResponseEntity.badRequest().body(body);
    }
}
