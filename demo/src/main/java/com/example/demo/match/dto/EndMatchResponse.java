package com.example.demo.match.dto;

import java.time.LocalDateTime;

/** API-008 매칭 해제 응답 */
public record EndMatchResponse(Long matchId, LocalDateTime endedAt) {
}
