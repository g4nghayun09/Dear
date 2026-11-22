package com.jpproject.dear.auth;

import com.jpproject.dear.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

// 구글 tokeninfo 엔드포인트로 ID 토큰을 검증한다. (dev 프로필이 아닐 때 사용)
@Component
@Profile("!dev")
public class RealGoogleTokenVerifier implements GoogleTokenVerifier {

    private static final String TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo?id_token={token}";

    private final RestClient restClient = RestClient.create();
    // 웹/안드로이드/iOS 클라이언트 ID가 서로 달라서 쉼표로 여러 개를 받는다
    private final List<String> clientIds;

    public RealGoogleTokenVerifier(@Value("${google.client-id:}") String clientId) {
        this.clientIds = Arrays.stream(clientId.split(",")).map(String::trim).filter(id -> !id.isEmpty()).toList();
    }

    @Override
    @SuppressWarnings("unchecked")
    public GoogleUserInfo verify(String idToken) {
        if (clientIds.isEmpty()) {
            throw new IllegalStateException("google.client-id(GOOGLE_CLIENT_ID)가 설정되지 않았습니다.");
        }

        Map<String, Object> info;
        try {
            info = restClient.get().uri(TOKEN_INFO_URL, idToken).retrieve().body(Map.class);
        } catch (RestClientException e) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "유효하지 않은 구글 토큰입니다.");
        }

        if (info == null
                || !clientIds.contains(String.valueOf(info.get("aud")))
                || !"true".equals(String.valueOf(info.get("email_verified")))
                || info.get("sub") == null
                || info.get("email") == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "유효하지 않은 구글 토큰입니다.");
        }
        return new GoogleUserInfo(String.valueOf(info.get("sub")), String.valueOf(info.get("email")));
    }
}
