package com.jpproject.dear.dictionary;

import com.jpproject.dear.common.ApiException;
import com.jpproject.dear.common.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DictionaryService {

    private final DictionaryRepository dictionaryRepository;

    public DictionaryResponse search(String q, String from) {
        // 1) 잘못된 요청 막기: from 은 "ja"/"ko" 만, 검색어는 30자까지
        boolean fromJa = "ja".equals(from);
        boolean fromKo = "ko".equals(from);
        if ((!fromJa && !fromKo) || q.length() > 30) {
            throw new ApiException(ErrorCode.INVALID_INPUT);
        }

        // 2) DB에서 단어 찾기 (세 경우 중 딱 하나만 실행됨)
        List<DictionaryWord> words;
        if (q.isBlank()) {
            // 검색어가 없으면 앞의 20개
            words = dictionaryRepository.findAll(PageRequest.of(0, 20)).getContent();
        } else if (fromJa) {
            // 한국어 뜻으로 일본어 단어 찾기
            words = dictionaryRepository.findTop20ByKoreaLanguageContaining(q);
        } else {
            // 일본어(단어 또는 읽기)로 한국어 찾기
            words = dictionaryRepository.findTop20ByJapanLanguageContainingOrReadingContaining(q, q);
        }

        // 3) 앱이 받는 모양(term, reading, meaning)으로 바꾸기
        List<DictionaryResponse.Item> items = words.stream()
                .map(w -> fromJa
                        ? new DictionaryResponse.Item(w.getJapanLanguage(), w.getReading(), w.getKoreaLanguage())
                        : new DictionaryResponse.Item(w.getKoreaLanguage(), null, w.getJapanLanguage()))
                .toList();

        return new DictionaryResponse(items);
    }
}
