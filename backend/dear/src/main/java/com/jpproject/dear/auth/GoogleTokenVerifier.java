package com.jpproject.dear.auth;

// 구글 ID 토큰을 검증해서 사용자 정보를 돌려준다. 실패하면 ApiException(401)
public interface GoogleTokenVerifier {

    GoogleUserInfo verify(String idToken);

    // sub: 구글 계정 고유 번호 (users.google_sub)
    record GoogleUserInfo(String sub, String email) {
    }
}
