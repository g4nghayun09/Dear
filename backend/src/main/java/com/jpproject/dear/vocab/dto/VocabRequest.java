package com.jpproject.dear.vocab.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

// API-014 단어장에 단어 추가. source: search(사전 검색) | manual(직접 추가) | correction(첨삭 받음)
public record VocabRequest(
        String term,
        String reading,
        String meaning,
        String source,
        @JsonProperty("wrong_text") String wrongText,
        String pos,
        @JsonProperty("diary_id") Long diaryId,
        @JsonProperty("correction_id") Long correctionId
) {
}
