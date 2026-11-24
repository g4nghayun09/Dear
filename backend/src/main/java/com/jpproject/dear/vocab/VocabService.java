package com.jpproject.dear.vocab;

import com.jpproject.dear.common.ApiException;
import com.jpproject.dear.common.ErrorCode;
import com.jpproject.dear.diary.LanguageValidator;
import com.jpproject.dear.user.User;
import com.jpproject.dear.user.UserRepository;
import com.jpproject.dear.vocab.dto.VocabRequest;
import com.jpproject.dear.vocab.dto.VocabResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

// API-014 단어장 추가 / API-015 단어장 목록. 수정/삭제(API-016~017)는 별도 작업
@Service
@RequiredArgsConstructor
public class VocabService {

    private static final Set<String> SOURCES = Set.of("SEARCH", "MANUAL", "CORRECTION");

    private final WordRepository wordRepository;
    private final UserRepository userRepository;

    @Transactional
    public VocabResponse create(Long userId, VocabRequest request) {
        if (isBlank(request.term()) || isBlank(request.meaning())) {
            throw new ApiException(ErrorCode.INVALID_INPUT);
        }
        String source = request.source() == null ? "" : request.source().toUpperCase();
        if (!SOURCES.contains(source)) {
            throw new ApiException(ErrorCode.INVALID_INPUT);
        }

        User user = userRepository.findById(userId).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        boolean ja = "ja".equals(LanguageValidator.learningLangOf(user.getNativeLang()));
        String japan = ja ? request.term() : request.meaning();
        String korea = ja ? request.meaning() : request.term();

        // 이미 있는 단어면 새로 만들지 않고, 이번 일기로 다시 연결한다 (그래야 이 일기의 "단어 모음"에도 보임)
        var existing = wordRepository.findByUserIdAndJapanLanguageAndKoreaLanguage(userId, japan, korea);
        if (existing.isPresent()) {
            Word word = existing.get();
            word.relinkTo(request.diaryId(), request.correctionId());
            return VocabResponse.from(word, ja);
        }
        try {
            Word saved = wordRepository.save(new Word(userId, japan, korea, request.reading(),
                    request.wrongText(), request.pos(), source, request.correctionId(), request.diaryId()));
            return VocabResponse.from(saved, ja);
        } catch (DataIntegrityViolationException e) {
            throw new ApiException(ErrorCode.DUPLICATE_WORD);
        }
    }

    // API-015 단어장 목록. source: correction(첨삭 받은 것) | study(검색+직접추가) | 없음(전체)
    @Transactional(readOnly = true)
    public List<VocabResponse> list(Long userId, String source) {
        User user = userRepository.findById(userId).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        boolean ja = "ja".equals(LanguageValidator.learningLangOf(user.getNativeLang()));
        List<Word> words;
        if ("correction".equalsIgnoreCase(source)) {
            words = wordRepository.findByUserIdAndSourceOrderByCreatedAtDesc(userId, "CORRECTION");
        } else if ("study".equalsIgnoreCase(source)) {
            words = wordRepository.findByUserIdAndSourceNotOrderByCreatedAtDesc(userId, "CORRECTION");
        } else {
            words = wordRepository.findByUserIdOrderByCreatedAtDesc(userId);
        }
        return words.stream().map(w -> VocabResponse.from(w, ja)).toList();
    }

    // 일기 상세에서 "사전으로 찾은 단어" 강조 표시용 (correction 담당 참고)
    @Transactional(readOnly = true)
    public List<String> searchTermsOf(Long diaryId, boolean ja) {
        return wordRepository.findByDiaryIdAndSourceOrderByCreatedAt(diaryId, "SEARCH").stream()
                .map(w -> ja ? w.getJapanLanguage() : w.getKoreaLanguage())
                .toList();
    }

    // 일기 상세의 "단어 모음": 그 일기에서 나온 단어 전체(사전 검색 + 첨삭)
    @Transactional(readOnly = true)
    public List<VocabResponse> vocabOf(Long diaryId, boolean ja) {
        return wordRepository.findByDiaryIdOrderByCreatedAt(diaryId).stream()
                .map(w -> VocabResponse.from(w, ja))
                .toList();
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
