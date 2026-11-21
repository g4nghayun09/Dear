package com.jpproject.dear.dto;

import jakarta.validation.constraints.NotBlank;

// 앱이 구글에서 받은 ID 토큰
public record GoogleLoginRequest(
        @NotBlank(message = "구글 토큰이 필요합니다.") String idToken
) {
}
