package com.jpproject.dear.vocab.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.jpproject.dear.vocab.Word;

import java.time.LocalDateTime;

public record VocabResponse(
        Long id,
        String term,
        String reading,
        String meaning,
        String source,
        @JsonProperty("wrong_text") String wrongText,
        String pos,
        @JsonProperty("created_at") LocalDateTime createdAt
) {
    // ja: 이 단어장 주인의 학습 언어가 일본어인지 (term/meaning 어느 쪽이 japan_language 칼럼인지 결정)
    public static VocabResponse from(Word w, boolean ja) {
        String term = ja ? w.getJapanLanguage() : w.getKoreaLanguage();
        String meaning = ja ? w.getKoreaLanguage() : w.getJapanLanguage();
        String source = w.getSource() == null ? null : w.getSource().toLowerCase();
        return new VocabResponse(w.getId(), term, w.getReading(), meaning, source,
                w.getWrongText(), w.getPartOfSpeech(), w.getCreatedAt());
    }
}
