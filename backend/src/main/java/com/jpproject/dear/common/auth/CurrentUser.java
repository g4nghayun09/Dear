package com.jpproject.dear.common.auth;

/**
 * 로그인한 사용자 ID를 요청에 담아 두는 약속. (매칭 API 등)
 *
 * - 실제 로그인: JwtUserIdFilter가 Authorization: Bearer <JWT> 의 회원 번호를 여기로 넣어 줍니다.
 * - 개발용: DevUserIdFilter가 X-User-Id 헤더 값을 넣어 줍니다. (DEV_AUTH=true 일 때만)
 * - 다른 기능: 컨트롤러에서 @RequestAttribute(CurrentUser.ID) Long userId 로 받아 씁니다.
 *   값이 없으면 CommonExceptionHandler가 401을 돌려줍니다.
 */
public final class CurrentUser {

    public static final String ID = "userId";

    private CurrentUser() {
    }
}
