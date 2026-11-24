package com.jpproject.dear.dictionary;

import com.jpproject.dear.common.ApiException;
import com.jpproject.dear.common.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class DictionaryService {

    private final DictionaryRepository dictionaryRepository;
    private final KrdictClient krdictClient;
    private final DeepLClient deepLClient;

    public DictionaryResponse search(String q, String from) {
        // 1) 잘못된 요청 막기: from 은 "ja"/"ko" 만, 검색어는 30자까지
        boolean fromJa = "ja".equals(from);
        boolean fromKo = "ko".equals(from);
        if ((!fromJa && !fromKo) || q.length() > 30) {
            throw new ApiException(ErrorCode.INVALID_INPUT);
        }
        q = q.trim();

        // 2) 한국어로 검색(from=ja)이면 한국어기초사전 API를 먼저 시도. 실패하거나 결과가 없으면 DB 사전으로 대신한다
        if (fromJa && !q.isEmpty() && krdictClient.isEnabled()) {
            try {
                List<DictionaryResponse.Item> fromApi = krdictClient.searchKorean(q);
                if (!fromApi.isEmpty()) {
                    return new DictionaryResponse(fromApi);
                }
            } catch (Exception e) {
                log.warn("한국어기초사전 API 호출 실패, DB 사전으로 대신합니다: {}", e.toString());
            }
        }

        // 3) DB 사전에서 찾기 (세 경우 중 딱 하나만 실행됨)
        List<DictionaryWord> words;
        if (q.isEmpty()) {
            // 검색어가 없으면 앞의 20개
            words = dictionaryRepository.findAll(PageRequest.of(0, 20)).getContent();
        } else if (fromJa) {
            // 한국어 뜻으로 일본어 단어 찾기
            words = dictionaryRepository.findTop20ByKoreaLanguageContaining(q);
        } else {
            // 일본어(단어 또는 읽기)로 한국어 찾기
            words = dictionaryRepository.findTop20ByJapanLanguageContainingOrReadingContaining(q, q);
        }

        // 4) 앱이 받는 모양(term, reading, meaning, pos)으로 바꾸기. 일본어 단어인데 DB에 품사가 없으면 어미로 추정한다
        List<DictionaryResponse.Item> items = words.stream()
                .map(w -> fromJa
                        ? new DictionaryResponse.Item(w.getJapanLanguage(), w.getReading(), w.getKoreaLanguage(),
                                w.getPartOfSpeech() != null ? w.getPartOfSpeech() : guessJapanesePos(w.getJapanLanguage()))
                        : new DictionaryResponse.Item(w.getKoreaLanguage(), null, w.getJapanLanguage(), w.getPartOfSpeech()))
                .toList();

        // 5) 일본어로 검색(from=ko)했는데 DB 사전에 없으면 DeepL 로 한국어 뜻을 번역해서 보여준다 (번역기라 품사는 모르니 어미로 추정)
        if (items.isEmpty() && fromKo && !q.isEmpty() && deepLClient.isEnabled()) {
            try {
                String korean = deepLClient.translateJaToKo(q);
                if (!korean.isEmpty() && !korean.equals(q)) {   // 번역이 그대로면(모르는 글자 등) 결과 없음으로 둔다
                    items = List.of(new DictionaryResponse.Item(korean, null, q, guessJapanesePos(q)));
                }
            } catch (Exception e) {
                log.warn("DeepL 번역 실패, 결과 없이 돌려줍니다: {}", e.toString());
            }
        }

        return new DictionaryResponse(items);
    }

    // 첨삭으로 받은 단어 하나의 품사 찾기 (첨삭 화면에서 "고친 표현"이 사전에 있는 실제 단어인지 확인용).
    // 한국어는 한국어기초사전/DB 사전으로 찾고, 일본어는 외부 사전이 없어서 DB에도 없으면 어미로 추정한다
    public String posOf(String word, boolean ja) {
        if (word == null || word.isBlank()) return null;
        String w = word.trim();
        if (ja) {
            return dictionaryRepository.findFirstByJapanLanguage(w)
                    .map(DictionaryWord::getPartOfSpeech)
                    .orElseGet(() -> guessJapanesePos(w));
        }
        if (krdictClient.isEnabled()) {
            try {
                for (DictionaryResponse.Item item : krdictClient.searchKorean(w)) {
                    if (w.equals(item.meaning()) && item.pos() != null) {
                        return item.pos();
                    }
                }
            } catch (Exception e) {
                log.warn("첨삭 단어 품사 조회(한국어기초사전) 실패: {}", e.toString());
            }
        }
        return dictionaryRepository.findFirstByKoreaLanguage(w).map(DictionaryWord::getPartOfSpeech).orElse(null);
    }

    // 일본어 사전/형태소 분석 API가 없어서 정확한 품사를 모를 때 쓰는 간단한 규칙:
    // 일본어 동사의 기본형은 항상 う단으로 끝난다(行く, 食べる, 飲む 등) → う단으로 끝나면 동사, 아니면 명사로 본다
    private static final Set<Character> U_DAN = Set.of(
            'う', 'く', 'ぐ', 'す', 'ず', 'つ', 'づ', 'ぬ', 'ふ', 'ぶ', 'ぷ', 'む', 'ゆ', 'る',
            'ウ', 'ク', 'グ', 'ス', 'ズ', 'ツ', 'ヅ', 'ヌ', 'フ', 'ブ', 'プ', 'ム', 'ユ', 'ル');

    private static String guessJapanesePos(String word) {
        if (word == null || word.isBlank()) return null;
        char last = word.trim().charAt(word.trim().length() - 1);
        return U_DAN.contains(last) ? "동사" : "명사";
    }
}
