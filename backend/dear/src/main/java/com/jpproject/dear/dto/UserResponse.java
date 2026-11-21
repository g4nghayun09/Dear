package com.jpproject.dear.dto;

import com.jpproject.dear.user.User;

// signupStep: 앱이 어느 화면으로 보낼지 정하는 값
//   NICKNAME : 닉네임 입력(P-003)
//   LANGUAGE : 모국어 선택(P-004)
//   DONE     : 가입 완료 → 매칭 화면
public record UserResponse(
        Long userId,
        String email,
        String nickname,
        String nativeLang,
        String signupStep
) {
    public static UserResponse from(User user) {
        String step;
        if (user.getNickname() == null) {
            step = "NICKNAME";
        } else if (user.getNativeLang() == null) {
            step = "LANGUAGE";
        } else {
            step = "DONE";
        }
        return new UserResponse(user.getId(), user.getEmail(), user.getNickname(),
                user.getNativeLang(), step);
    }
}
