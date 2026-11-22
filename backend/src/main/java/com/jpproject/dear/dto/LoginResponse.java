package com.jpproject.dear.dto;

// 구글 로그인 응답. 앱은 token을 저장해 두고 이후 요청에 Authorization: Bearer <token> 으로 보낸다.
public record LoginResponse(
        String token,
        UserResponse user
) {
}
