package com.jpproject.dear.match.dto;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * API-006 매칭 신청 / API-007 매칭 상태 조회 응답.
 * 앱(src/lib/api/real.js, mock.js)과 같은 모양: 소문자 status + snake_case 이름.
 * status: matched(매칭됨) / waiting(대기 중) / none(아무것도 아님). 해당하지 않는 칸은 null.
 */
public record MatchStatusResponse(
        @JsonProperty("status") String status,
        @JsonProperty("match_id") Long matchId,
        @JsonProperty("partner") PartnerResponse partner,
        @JsonProperty("started_at") LocalDateTime startedAt,
        @JsonProperty("waiting_since") LocalDateTime waitingSince) {

    public static MatchStatusResponse matched(Long matchId, PartnerResponse partner, LocalDateTime startedAt) {
        return new MatchStatusResponse("matched", matchId, partner, startedAt, null);
    }

    public static MatchStatusResponse waiting(LocalDateTime waitingSince) {
        return new MatchStatusResponse("waiting", null, null, null, waitingSince);
    }

    public static MatchStatusResponse none() {
        return new MatchStatusResponse("none", null, null, null, null);
    }
}
