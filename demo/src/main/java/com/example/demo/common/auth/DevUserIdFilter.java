package com.example.demo.common.auth;

import java.io.IOException;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * [개발용] 로그인 기능이 완성되기 전에 다른 기능을 테스트하기 위한 필터.
 * 요청 헤더 X-User-Id: 1 을 보내면 1번 사용자로 로그인한 것처럼 처리합니다.
 *
 * .env 에 DEV_AUTH=true 일 때만 켜집니다. 시연·배포 때는 반드시 false(또는 삭제)로 두세요.
 */
@Component
@ConditionalOnProperty(name = "dear.dev-auth.enabled", havingValue = "true")
public class DevUserIdFilter extends OncePerRequestFilter {

    public static final String HEADER = "X-User-Id";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader(HEADER);
        if (request.getAttribute(CurrentUser.ID) == null && header != null && header.matches("\\d+")) {
            request.setAttribute(CurrentUser.ID, Long.valueOf(header));
        }
        chain.doFilter(request, response);
    }
}
