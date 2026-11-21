package com.jpproject.dear.user;

import com.jpproject.dear.dto.NativeLangRequest;
import com.jpproject.dear.dto.NicknameRequest;
import com.jpproject.dear.dto.UserResponse;
import com.jpproject.dear.login.SessionConst;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// 로그인한 회원만 접근 (LoginInterceptor가 /users/me/** 를 막아줌)
@RestController
@RequestMapping("/users/me")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // 내 정보 조회. signupStep으로 가입이 어디까지 됐는지 알 수 있다.
    @GetMapping
    public ResponseEntity<UserResponse> me(@SessionAttribute(SessionConst.LOGIN_USER_ID) Long userId) {
        return ResponseEntity.ok(userService.getUser(userId));
    }

    // 가입 1단계: 닉네임
    @PatchMapping("/nickname")
    public ResponseEntity<UserResponse> setNickname(@SessionAttribute(SessionConst.LOGIN_USER_ID) Long userId,
                                                    @Valid @RequestBody NicknameRequest request) {
        return ResponseEntity.ok(userService.setNickname(userId, request.nickname()));
    }

    // 가입 2단계: 모국어 (변경 불가)
    @PatchMapping("/native-lang")
    public ResponseEntity<UserResponse> setNativeLang(@SessionAttribute(SessionConst.LOGIN_USER_ID) Long userId,
                                                      @Valid @RequestBody NativeLangRequest request) {
        return ResponseEntity.ok(userService.setNativeLang(userId, request.nativeLang()));
    }
}
