package com.jpproject.dear.correction.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

// API-012 첨삭 제출 요청. wordCards: 첨삭과 함께 상대에게 전달하는 단어 카드(사전에서 고른 단어)
public record CorrectionRequest(
        List<Item> items,
        @JsonProperty("word_cards") List<WordCard> wordCards
) {
    public record Item(
            @JsonProperty("original_text") String originalText,
            @JsonProperty("corrected_text") String correctedText,
            String explanation
    ) {
    }

    public record WordCard(String term, String reading, String meaning, String pos) {
    }
}
