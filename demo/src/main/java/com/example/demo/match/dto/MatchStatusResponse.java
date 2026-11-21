package com.example.demo.match.dto;

import java.time.LocalDateTime;

/**
 * API-006 매칭 신청 / API-007 매칭 상태 조회 응답.
 * status: MATCHED(매칭됨) / WAITING(대기 중) / NONE(아무것도 아님)
 * 해당하지 않는 칸은 null 입니다.
 */
public record MatchStatusResponse(
        String status,
        Long matchId,
        PartnerResponse partner,
        LocalDateTime startedAt,
        LocalDateTime waitingSince) {

    public static MatchStatusResponse matched(Long matchId, PartnerResponse partner, LocalDateTime startedAt) {
        return new MatchStatusResponse("MATCHED", matchId, partner, startedAt, null);
    }

    public static MatchStatusResponse waiting(LocalDateTime waitingSince) {
        return new MatchStatusResponse("WAITING", null, null, null, waitingSince);
    }

    public static MatchStatusResponse none() {
        return new MatchStatusResponse("NONE", null, null, null, null);
    }
}
