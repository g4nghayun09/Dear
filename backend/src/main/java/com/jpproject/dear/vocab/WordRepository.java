package com.jpproject.dear.vocab;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WordRepository extends JpaRepository<Word, Long> {
    boolean existsByUserIdAndJapanLanguageAndKoreaLanguage(Long userId, String japanLanguage, String koreaLanguage);
    Optional<Word> findByUserIdAndJapanLanguageAndKoreaLanguage(Long userId, String japanLanguage, String koreaLanguage);

    // 그 일기를 쓰면서 사전으로 찾은 단어들 (일기 상세 화면에서 강조 표시하려고)
    List<Word> findByDiaryIdAndSourceOrderByCreatedAt(Long diaryId, String source);

    // 그 일기에서 나온 단어 전체(사전 검색 + 첨삭) — 일기 상세의 "단어 모음"
    List<Word> findByDiaryIdOrderByCreatedAt(Long diaryId);

    // API-015 단어장 목록 (전체 / source별)
    List<Word> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Word> findByUserIdAndSourceOrderByCreatedAtDesc(Long userId, String source);
    List<Word> findByUserIdAndSourceNotOrderByCreatedAtDesc(Long userId, String source);
}
