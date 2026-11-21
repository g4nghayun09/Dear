package com.example.demo.common.auth;

/**
 * 로그인한 사용자 ID를 요청에 담아 두는 약속.
 *
 * - 로그인(JWT) 담당: 토큰을 검사한 뒤 request.setAttribute(CurrentUser.ID, userId) 를 해 주세요.
 * - 다른 기능: 컨트롤러에서 @RequestAttribute(CurrentUser.ID) Long userId 로 받아 씁니다.
 *   값이 없으면 GlobalExceptionHandler가 401을 돌려줍니다.
 */
public final class CurrentUser {

    public static final String ID = "userId";

    private CurrentUser() {
    }
}
