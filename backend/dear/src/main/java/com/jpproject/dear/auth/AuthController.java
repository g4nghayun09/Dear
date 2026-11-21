package com.jpproject.dear.auth;

import com.jpproject.dear.dto.GoogleLoginRequest;
import com.jpproject.dear.dto.UserResponse;
import com.jpproject.dear.login.SessionConst;
import com.jpproject.dear.user.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    // 구글 로그인 (가입 포함). 응답의 signupStep으로 앱이 다음 화면을 정한다.
    @PostMapping("/google")
    public ResponseEntity<UserResponse> googleLogin(@Valid @RequestBody GoogleLoginRequest request,
                                                    HttpServletRequest httpRequest) {
        UserResponse user = userService.loginWithGoogle(request.idToken());

        HttpSession session = httpRequest.getSession();
        httpRequest.changeSessionId(); // 로그인 성공 시 세션 ID 교체(세션 고정 공격 방지)
        session.setAttribute(SessionConst.LOGIN_USER_ID, user.userId());
        return ResponseEntity.ok(user);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        return ResponseEntity.noContent().build();
    }
}
