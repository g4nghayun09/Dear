package com.jpproject.dear.common.auth;

import java.io.IOException;

import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.jpproject.dear.login.JwtProvider;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * 로그인(JWT, 강하윤)과 매칭 API(/api/matches/**)를 이어 주는 필터. (작성: 강태인)
 * Authorization: Bearer <JWT> 가 있으면 JwtProvider로 회원 번호를 꺼내 요청 속성 CurrentUser.ID 에 넣어 둡니다.
 * 토큰이 없거나 잘못되면 아무것도 하지 않고 넘기며, 컨트롤러에서 회원 번호가 없으면 401이 됩니다.
 * (/users/me, /diaries 는 기존처럼 LoginInterceptor가 검사합니다)
 */
@Component
public class JwtUserIdFilter extends OncePerRequestFilter {

    private static final String BEARER = "Bearer ";

    private final JwtProvider jwtProvider;

    public JwtUserIdFilter(JwtProvider jwtProvider) {
        this.jwtProvider = jwtProvider;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (request.getAttribute(CurrentUser.ID) == null && header != null && header.startsWith(BEARER)) {
            try {
                Long userId = jwtProvider.getUserId(header.substring(BEARER.length()).trim());
                request.setAttribute(CurrentUser.ID, userId);
            } catch (RuntimeException e) {
                // 만료·위조 토큰: 로그인 안 한 것으로 처리 → 컨트롤러에서 401
            }
        }
        chain.doFilter(request, response);
    }
}
