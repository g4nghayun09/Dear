package com.jpproject.dear.common.auth;

import java.io.IOException;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.jpproject.dear.login.SessionConst;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

/**
 * 로그인(세션, 강하윤)과 매칭 등 다른 기능을 이어 주는 필터. (작성: 강태인)
 * 구글 로그인 후 세션에 저장된 회원 번호(SessionConst.LOGIN_USER_ID)를
 * 요청 속성 CurrentUser.ID 로 옮겨 둡니다. → 컨트롤러는 @RequestAttribute(CurrentUser.ID) Long userId 로 받음
 */
@Component
public class SessionUserIdFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        HttpSession session = request.getSession(false);
        if (session != null && request.getAttribute(CurrentUser.ID) == null) {
            Object userId = session.getAttribute(SessionConst.LOGIN_USER_ID);
            if (userId instanceof Long id) {
                request.setAttribute(CurrentUser.ID, id);
            }
        }
        chain.doFilter(request, response);
    }
}
