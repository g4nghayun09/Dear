package com.jpproject.dear.common;

import org.springframework.http.HttpStatus;

/**
 * 공통 오류 코드 (API 명세서 v3 "오류 응답 형식").
 * 모든 기능이 같이 씁니다. 새 오류가 필요하면 여기에 추가하세요.
 */
public enum ErrorCode {
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "입력값을 확인해 주세요"),
    INVALID_LANGUAGE(HttpStatus.BAD_REQUEST, "학습 언어로만 작성할 수 있어요"),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "로그인이 필요해요"),
    FORBIDDEN(HttpStatus.FORBIDDEN, "볼 수 없는 내용이에요"),
    NOT_PARTNER_DIARY(HttpStatus.FORBIDDEN, "첨삭할 수 없는 일기예요"),
    NOT_FOUND(HttpStatus.NOT_FOUND, "찾을 수 없어요"),
    PROFILE_REQUIRED(HttpStatus.CONFLICT, "닉네임과 모국어를 먼저 설정해 주세요"),
    DUPLICATE_EMAIL(HttpStatus.CONFLICT, "이미 가입된 이메일이에요"),
    DUPLICATE_NICKNAME(HttpStatus.CONFLICT, "이미 사용 중인 닉네임이에요"),
    ALREADY_MATCHED(HttpStatus.CONFLICT, "이미 교환 중인 상대가 있어요"),
    NOT_WAITING(HttpStatus.CONFLICT, "매칭 대기 중이 아니에요"),
    NO_ACTIVE_MATCH(HttpStatus.CONFLICT, "교환 상대가 없어요"),
    MATCH_ENDED(HttpStatus.CONFLICT, "끝난 교환일기는 첨삭할 수 없어요"),
    ALREADY_CORRECTED(HttpStatus.CONFLICT, "이미 첨삭된 일기예요"),
    DUPLICATE_WORD(HttpStatus.CONFLICT, "이미 단어장에 있어요"),
    DICTIONARY_UNAVAILABLE(HttpStatus.BAD_GATEWAY, "사전을 불러오지 못했어요");

    private final HttpStatus status;
    private final String defaultMessage;

    ErrorCode(HttpStatus status, String defaultMessage) {
        this.status = status;
        this.defaultMessage = defaultMessage;
    }

    public HttpStatus status() {
        return status;
    }

    public String defaultMessage() {
        return defaultMessage;
    }
}
