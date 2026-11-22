package com.jpproject.dear.auth;

import com.jpproject.dear.dto.GoogleLoginRequest;
import com.jpproject.dear.dto.LoginResponse;
import com.jpproject.dear.dto.UserResponse;
import com.jpproject.dear.login.JwtProvider;
import com.jpproject.dear.user.UserService;
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
    private final JwtProvider jwtProvider;

    public AuthController(UserService userService, JwtProvider jwtProvider) {
        this.userService = userService;
        this.jwtProvider = jwtProvider;
    }

    // 구글 로그인 (가입 포함). 응답의 token으로 인증하고, user.signupStep으로 앱이 다음 화면을 정한다.
    @PostMapping("/google")
    public ResponseEntity<LoginResponse> googleLogin(@Valid @RequestBody GoogleLoginRequest request) {
        UserResponse user = userService.loginWithGoogle(request.idToken());
        return ResponseEntity.ok(new LoginResponse(jwtProvider.createToken(user.userId()), user));
    }

    // JWT는 서버에 상태가 없으므로 앱이 토큰을 지우면 로그아웃이다. (앱이 호출할 수 있게 열어둠)
    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.noContent().build();
    }
}
