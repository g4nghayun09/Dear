package com.jpproject.dear.common;

import java.util.List;

/**
 * Service에서 던지면 GlobalExceptionHandler가 { code, message, fieldErrors } 로 바꿔 응답합니다.
 * 예: throw new ApiException(ErrorCode.ALREADY_MATCHED);
 */
public class ApiException extends RuntimeException {

    private final ErrorCode errorCode;
    private final List<ErrorResponse.FieldErrorItem> fieldErrors;

    public ApiException(ErrorCode errorCode) {
        this(errorCode, errorCode.defaultMessage(), List.of());
    }

    public ApiException(ErrorCode errorCode, String message) {
        this(errorCode, message, List.of());
    }

    public ApiException(ErrorCode errorCode, String message, List<ErrorResponse.FieldErrorItem> fieldErrors) {
        super(message);
        this.errorCode = errorCode;
        this.fieldErrors = fieldErrors;
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }

    public List<ErrorResponse.FieldErrorItem> getFieldErrors() {
        return fieldErrors;
    }
}
