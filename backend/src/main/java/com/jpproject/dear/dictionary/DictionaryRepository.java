package com.jpproject.dear.dictionary;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DictionaryRepository extends JpaRepository<DictionaryWord, Long> {
    // 한국어 뜻으로 찾기 (한국인이 일본어 단어를 찾을 때)
    List<DictionaryWord> findTop20ByKoreaLanguageContaining(String keyword);
    // 일본어(단어 또는 읽기)로 찾기 (일본인이 한국어 단어를 찾을 때)
    List<DictionaryWord> findTop20ByJapanLanguageContainingOrReadingContaining(String word, String reading);
}