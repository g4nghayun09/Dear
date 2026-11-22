package com.jpproject.dear.login;

import com.jpproject.dear.exception.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

// Authorization: Bearer <JWT> 를 검사하고, 회원 ID를 요청에 담아 컨트롤러로 넘긴다.
@Component
public class LoginInterceptor implements HandlerInterceptor {

    private static final String BEARER = "Bearer ";

    private final JwtProvider jwtProvider;

    public LoginInterceptor(JwtProvider jwtProvider) {
        this.jwtProvider = jwtProvider;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // CORS preflight(OPTIONS)에는 토큰이 없으므로 통과
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header == null || !header.startsWith(BEARER)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        Long userId = jwtProvider.getUserId(header.substring(BEARER.length()).trim());
        request.setAttribute(AuthConst.LOGIN_USER_ID, userId);
        return true;    // 통과 -> 컨트롤러로 요청을 보냄
    }
}
