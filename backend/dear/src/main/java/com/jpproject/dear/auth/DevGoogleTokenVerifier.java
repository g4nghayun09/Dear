package com.jpproject.dear.auth;

import com.jpproject.dear.exception.ApiException;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

// 개발/테스트용: 진짜 구글 없이 "dev:<sub>:<email>" 형태의 토큰을 받아들인다.
// 예) dev:sub-1:minji@gmail.com   (실행 시 spring.profiles.active=dev 일 때만 켜짐)
@Component
@Profile("dev")
public class DevGoogleTokenVerifier implements GoogleTokenVerifier {

    @Override
    public GoogleUserInfo verify(String idToken) {
        String[] parts = idToken.split(":", 3);
        if (parts.length != 3 || !parts[0].equals("dev") || parts[1].isBlank() || parts[2].isBlank()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "dev 토큰 형식은 dev:<sub>:<email> 입니다.");
        }
        return new GoogleUserInfo(parts[1], parts[2]);
    }
}
