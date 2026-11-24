package com.jpproject.dear.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.jpproject.dear.correction.Correction;
import com.jpproject.dear.diary.Diary;
import com.jpproject.dear.vocab.dto.VocabResponse;

import java.time.LocalDateTime;
import java.util.List;

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
        LocalDateTime readAt,
        List<CorrectionItem> corrections,
        @JsonProperty("search_words") List<String> searchWords,
        List<VocabResponse> vocab
) {
    // 목록 화면 등 첨삭·사전 단어가 필요 없는 곳: 빈 목록으로 둔다
    public static DiaryResponse from(Diary d, Long meId) {
        return from(d, meId, List.of(), List.of(), List.of());
    }

    // 상세 화면: 그 일기의 첨삭 결과 + 사전으로 찾은 단어(작성자가 넣은 것) + 단어 모음까지 같이 내려준다
    public static DiaryResponse from(Diary d, Long meId, List<Correction> corrections, List<String> searchWords,
                                      List<VocabResponse> vocab) {
        List<CorrectionItem> items = corrections.stream()
                .map(c -> new CorrectionItem(c.getId(), c.getOriginalText(), c.getCorrectedText(),
                        c.getExplanation(), c.getCreatedAt()))
                .toList();
        return new DiaryResponse(d.getId(), d.getMatchId(), d.getUserId(), d.getUserId().equals(meId),
                d.getTitle(), d.getLanguage(), d.getContent(), d.getStatus(),
                d.getCreatedAt(), d.getCorrectedAt(), d.getReadAt(), items, searchWords, vocab);
    }

    // 프론트는 snake_case(original_text 등)를 그대로 쓰므로 여기서 맞춰 준다
    public record CorrectionItem(
            Long id,
            @JsonProperty("original_text") String originalText,
            @JsonProperty("corrected_text") String correctedText,
            String explanation,
            @JsonProperty("created_at") LocalDateTime createdAt
    ) {
    }
}
