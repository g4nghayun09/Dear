package com.jpproject.dear.dto;

import com.jpproject.dear.diary.Diary;

import java.time.LocalDateTime;

public record DiaryResponse(
        Long diaryId,
        Long matchId,
        Long authorId,
        boolean mine,
        String title,
        String language,
        String content,
        String status,
        LocalDateTime createdAt,
        LocalDateTime correctedAt,
        LocalDateTime readAt
) {
    public static DiaryResponse from(Diary d, Long meId) {
        return new DiaryResponse(d.getId(), d.getMatchId(), d.getUserId(), d.getUserId().equals(meId),
                d.getTitle(), d.getLanguage(), d.getContent(), d.getStatus(),
                d.getCreatedAt(), d.getCorrectedAt(), d.getReadAt());
    }
}
