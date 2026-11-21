package com.jpproject.dear.common;

import java.util.List;

/** 모든 오류 응답의 모양: { "code": "...", "message": "...", "fieldErrors": [ { "field", "reason" } ] } */
public record ErrorResponse(String code, String message, List<FieldErrorItem> fieldErrors) {

    public record FieldErrorItem(String field, String reason) {
    }

    public static ErrorResponse of(ErrorCode code, String message, List<FieldErrorItem> fieldErrors) {
        return new ErrorResponse(code.name(), message, fieldErrors);
    }
}
