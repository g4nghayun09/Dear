package com.jpproject.dear.match.dto;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonProperty;

/** API-008 매칭 해제 응답 */
public record EndMatchResponse(
        @JsonProperty("match_id") Long matchId,
        @JsonProperty("ended_at") LocalDateTime endedAt) {
}
