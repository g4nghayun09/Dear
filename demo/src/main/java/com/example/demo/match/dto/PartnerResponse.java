package com.example.demo.match.dto;

/** 교환 상대 정보. 개인정보 보호를 위해 닉네임과 모국어만 보냅니다(이메일·ID 제외). */
public record PartnerResponse(String nickname, String nativeLang) {
}
