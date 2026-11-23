package com.jpproject.dear.match.dto;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonProperty;

/** API-019 매칭 기록 한 줄. status: active(진행 중) / ended(해제됨) */
public record MatchHistoryItem(
        @JsonProperty("match_id") Long matchId,
        @JsonProperty("status") String status,
        @JsonProperty("partner") PartnerResponse partner,
        @JsonProperty("started_at") LocalDateTime startedAt,
        @JsonProperty("ended_at") LocalDateTime endedAt) {
}
