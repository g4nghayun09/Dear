package com.jpproject.dear.dto;

import java.util.Map;

public class ApiErrorResponse {
    private final int sataus;
    private final String message;
    private final Map<String, String> errors;

    public ApiErrorResponse(int sataus, String message, Map<String, String> errors) {
        this.sataus = sataus;
        this.message = message;
        this.errors = errors;
    }

    public int getSataus() {
        return sataus;
    }

    public String getMessage() {
        return message;
    }

    public Map<String, String> getErrors() {
        return errors;
    }
}
