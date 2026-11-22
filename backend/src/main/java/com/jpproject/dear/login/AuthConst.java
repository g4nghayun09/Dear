package com.jpproject.dear.login;

public class AuthConst {
    // LoginInterceptor가 JWT를 검증한 뒤 요청에 담아두는 로그인 회원 ID (Long)
    public static final String LOGIN_USER_ID = "loginUserId";

    private AuthConst() {
    }
}
