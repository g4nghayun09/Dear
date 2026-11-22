package com.jpproject.dear.login;

import com.jpproject.dear.exception.ApiException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.*;

class JwtAuthTest {

    private static final String SECRET = "test-secret-test-secret-test-secret-1234";

    private final JwtProvider jwtProvider = new JwtProvider(SECRET, 60_000);
    private final LoginInterceptor interceptor = new LoginInterceptor(jwtProvider);

    @Test
    void 발급한_토큰에서_회원ID를_꺼낸다() {
        assertEquals(42L, jwtProvider.getUserId(jwtProvider.createToken(42L)));
    }

    @Test
    void 만료된_토큰은_401() {
        JwtProvider expired = new JwtProvider(SECRET, -1000);
        assertUnauthorized(() -> jwtProvider.getUserId(expired.createToken(1L)));
    }

    @Test
    void 다른_키로_서명한_토큰은_401() {
        JwtProvider other = new JwtProvider("another-secret-another-secret-12345678", 60_000);
        assertUnauthorized(() -> jwtProvider.getUserId(other.createToken(1L)));
    }

    @Test
    void 깨진_토큰은_401() {
        assertUnauthorized(() -> jwtProvider.getUserId("not-a-jwt"));
    }

    @Test
    void 짧은_비밀키는_서버_시작_실패() {
        assertThrows(IllegalStateException.class, () -> new JwtProvider("short", 60_000));
        assertThrows(IllegalStateException.class, () -> new JwtProvider("", 60_000));
    }

    @Test
    void 인터셉터_토큰이_없으면_401() {
        assertUnauthorized(() -> interceptor.preHandle(new MockHttpServletRequest(), new MockHttpServletResponse(), null));
    }

    @Test
    void 인터셉터_Bearer가_아니면_401() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Basic abc");
        assertUnauthorized(() -> interceptor.preHandle(request, new MockHttpServletResponse(), null));
    }

    @Test
    void 인터셉터_유효한_토큰이면_회원ID를_요청에_담는다() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + jwtProvider.createToken(7L));

        assertTrue(interceptor.preHandle(request, new MockHttpServletResponse(), null));
        assertEquals(7L, request.getAttribute(AuthConst.LOGIN_USER_ID));
    }

    @Test
    void 인터셉터_OPTIONS는_토큰없이_통과() {
        MockHttpServletRequest request = new MockHttpServletRequest("OPTIONS", "/users/me");
        assertTrue(interceptor.preHandle(request, new MockHttpServletResponse(), null));
    }

    private void assertUnauthorized(Runnable action) {
        ApiException e = assertThrows(ApiException.class, action::run);
        assertEquals(HttpStatus.UNAUTHORIZED, e.getStatus());
    }
}
