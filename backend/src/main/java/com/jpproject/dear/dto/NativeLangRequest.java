package com.jpproject.dear.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record NativeLangRequest(
        @NotBlank(message = "모국어를 선택하세요.")
        @Pattern(regexp = "ko|ja", message = "모국어는 ko 또는 ja여야 합니다.")
        String nativeLang
) {
}
