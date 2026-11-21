package com.jpproject.dear.common;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.ServletRequestBindingException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * common.ApiException(매칭·언어 검사 등)을 { code, message, fieldErrors } 형식으로 바꿔 응답합니다. (작성: 강태인)
 *
 * 로그인 쪽 예외(exception.ApiException)와 @Valid 검증 실패는
 * exception.GlobalExceptionHandler(강하윤)가 처리합니다. 이름이 겹치지 않게 CommonExceptionHandler로 둡니다.
 */
@RestControllerAdvice
public class CommonExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> handleApi(ApiException e) {
        ErrorCode code = e.getErrorCode();
        return ResponseEntity.status(code.status())
                .body(ErrorResponse.of(code, e.getMessage(), e.getFieldErrors()));
    }

    /** 로그인 사용자 정보(세션 / 요청 속성)가 없을 때 → 401 */
    @ExceptionHandler(ServletRequestBindingException.class)
    public ResponseEntity<ErrorResponse> handleMissingUser(ServletRequestBindingException e) {
        ErrorCode code = ErrorCode.UNAUTHORIZED;
        return ResponseEntity.status(code.status())
                .body(ErrorResponse.of(code, code.defaultMessage(), List.of()));
    }
}
