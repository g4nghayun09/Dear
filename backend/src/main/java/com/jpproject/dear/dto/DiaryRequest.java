package com.jpproject.dear.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// 일기 전송. 매칭(match)은 서버가 로그인한 회원의 활성 매칭으로 찾는다.
public record DiaryRequest(
        @Size(max = 30, message = "제목은 30자 이하로 써 주세요.")
        String title,
        @NotBlank(message = "본문을 입력해 주세요.")
        String content
) {
}

