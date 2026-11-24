package com.jpproject.dear.dictionary;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DictionaryRepository extends JpaRepository<DictionaryWord, Long> {
    // 한국어 뜻으로 찾기 (한국인이 일본어 단어를 찾을 때)
    List<DictionaryWord> findTop20ByKoreaLanguageContaining(String keyword);
    // 일본어(단어 또는 읽기)로 찾기 (일본인이 한국어 단어를 찾을 때)
    List<DictionaryWord> findTop20ByJapanLanguageContainingOrReadingContaining(String word, String reading);
    // 첨삭으로 받은 단어의 품사 찾기용 (정확히 일치하는 단어만)
    Optional<DictionaryWord> findFirstByJapanLanguage(String japanLanguage);
    Optional<DictionaryWord> findFirstByKoreaLanguage(String koreaLanguage);
}