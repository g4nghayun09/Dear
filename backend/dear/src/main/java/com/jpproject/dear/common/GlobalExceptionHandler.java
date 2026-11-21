package com.jpproject.dear.common;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.ServletRequestBindingException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/** 예외를 공통 오류 형식으로 바꿔 응답합니다. */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> handleApi(ApiException e) {
        ErrorCode code = e.getErrorCode();
        return ResponseEntity.status(code.status())
                .body(ErrorResponse.of(code, e.getMessage(), e.getFieldErrors()));
    }

    /** @Valid 검증 실패 */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException e) {
        List<ErrorResponse.FieldErrorItem> items = e.getBindingResult().getFieldErrors().stream()
                .map(f -> new ErrorResponse.FieldErrorItem(f.getField(), f.getDefaultMessage()))
                .toList();
        ErrorCode code = ErrorCode.INVALID_INPUT;
        return ResponseEntity.status(code.status())
                .body(ErrorResponse.of(code, code.defaultMessage(), items));
    }

    /** 로그인 사용자 정보(userId)가 요청에 없을 때 → 401 */
    @ExceptionHandler(ServletRequestBindingException.class)
    public ResponseEntity<ErrorResponse> handleMissingUser(ServletRequestBindingException e) {
        ErrorCode code = ErrorCode.UNAUTHORIZED;
        return ResponseEntity.status(code.status())
                .body(ErrorResponse.of(code, code.defaultMessage(), List.of()));
    }
}
