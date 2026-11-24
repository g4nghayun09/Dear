package com.jpproject.dear.correction;

import com.jpproject.dear.common.ApiException;
import com.jpproject.dear.common.ErrorCode;
import com.jpproject.dear.correction.dto.CorrectionRequest;
import com.jpproject.dear.correction.dto.CorrectionSubmitResponse;
import com.jpproject.dear.dictionary.DeepLClient;
import com.jpproject.dear.dictionary.DictionaryService;
import com.jpproject.dear.diary.Diary;
import com.jpproject.dear.diary.DiaryRepository;
import com.jpproject.dear.match.Match;
import com.jpproject.dear.match.MatchService;
import com.jpproject.dear.vocab.Word;
import com.jpproject.dear.vocab.WordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

// API-012 첨삭 제출 (담당: 강태인 — 일기 쪽과 같이, 단어장은 조회 API 없이 저장만 먼저 연결)
@Slf4j
@Service
@RequiredArgsConstructor
public class CorrectionService {

    private static final int MAX_ITEMS = 20;
    private static final String CORRECTED = "CORRECTED";

    private final DiaryRepository diaryRepository;
    private final CorrectionRepository correctionRepository;
    private final MatchService matchService;
    private final WordRepository wordRepository;
    private final DeepLClient deepLClient;
    private final DictionaryService dictionaryService;

    @Transactional
    public CorrectionSubmitResponse submit(Long userId, Long diaryId, CorrectionRequest request) {
        Diary diary = diaryRepository.findById(diaryId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));

        // 내 일기는 내가 첨삭할 수 없다 (상대 일기만)
        if (diary.getUserId().equals(userId)) {
            throw new ApiException(ErrorCode.NOT_PARTNER_DIARY);
        }

        // 매칭 당사자인지 + 아직 교환 중인지 (MatchService.getMatchForMember: 당사자 아니면 FORBIDDEN)
        Match match = matchService.getMatchForMember(diary.getMatchId(), userId);
        if (!match.isActive()) {
            throw new ApiException(ErrorCode.MATCH_ENDED);
        }
        if (CORRECTED.equals(diary.getStatus())) {
            throw new ApiException(ErrorCode.ALREADY_CORRECTED);
        }

        List<CorrectionRequest.Item> items = request.items();
        if (items == null || items.isEmpty() || items.size() > MAX_ITEMS) {
            throw new ApiException(ErrorCode.INVALID_INPUT);
        }
        String fullText = (diary.getTitle() != null ? diary.getTitle() + "\n" : "") + diary.getContent();
        for (CorrectionRequest.Item it : items) {
            if (isBlank(it.originalText()) || isBlank(it.correctedText())
                    || it.originalText().length() > 200 || it.correctedText().length() > 200
                    || (it.explanation() != null && it.explanation().length() > 300)
                    || !fullText.contains(it.originalText())) {
                throw new ApiException(ErrorCode.INVALID_INPUT);
            }
        }

        LocalDateTime now = LocalDateTime.now();
        boolean ja = "ja".equals(diary.getLanguage());
        // 단어장은 "일기를 쓴 사람(= 첨삭을 받는 사람)" 것. mock과 달리 실제로 상대 쪽에 쌓인다
        Long ownerId = diary.getUserId();

        for (CorrectionRequest.Item it : items) {
            Correction saved = correctionRepository.save(
                    new Correction(diaryId, it.originalText(), it.correctedText(), it.explanation()));
            // 단어장 카드의 "뜻": 고친 표현을 상대 모국어로 번역해서 보여준다 (안 되면 원래 틀렸던 표현으로 대신)
            String meaning = translateOrFallback(it.correctedText(), ja, it.originalText());
            // 고친 표현이 사전에 있는 실제 단어면 품사를 보여주고, 문장 전체를 고친 경우처럼 못 찾으면 null
            // (프론트에서 null이면 "표현" 같은 중립적인 자리표시 라벨로 대신 보여준다)
            String pos = posOrNull(it.correctedText(), ja);
            saveWordIfAbsent(ownerId, ja, it.correctedText(), meaning, it.originalText(), pos, "CORRECTION", saved.getId(), diaryId);
        }
        if (request.wordCards() != null) {
            for (CorrectionRequest.WordCard wc : request.wordCards()) {
                if (isBlank(wc.term()) || isBlank(wc.meaning())) continue;
                saveWordIfAbsent(ownerId, ja, wc.term(), wc.meaning(), null, wc.pos(), "CORRECTION", null, diaryId);
            }
        }

        correctionRepository.markDiaryCorrected(diaryId, now);
        return new CorrectionSubmitResponse(diaryId, CORRECTED, now, items.size());
    }

    // 품사 조회가 실패해도(사전에 없는 표현, API 오류 등) 첨삭 자체는 그대로 진행되게 한다
    private String posOrNull(String correctedText, boolean ja) {
        try {
            return dictionaryService.posOf(correctedText, ja);
        } catch (Exception e) {
            log.warn("첨삭 단어 품사 조회 실패: {}", e.toString());
            return null;
        }
    }

    // 고친 표현을 DeepL로 번역 (ja: 고친 표현이 일본어인지). 키가 없거나 실패하면 fallback(원래 틀렸던 표현)을 그대로 쓴다
    private String translateOrFallback(String correctedText, boolean ja, String fallback) {
        if (!deepLClient.isEnabled()) return fallback;
        try {
            String translated = ja ? deepLClient.translate(correctedText, "JA", "KO")
                    : deepLClient.translate(correctedText, "KO", "JA");
            return (translated == null || translated.isBlank() || translated.equals(correctedText)) ? fallback : translated;
        } catch (Exception e) {
            log.warn("첨삭 단어 번역 실패, 원래 틀렸던 표현으로 대신합니다: {}", e.toString());
            return fallback;
        }
    }

    // 단어장 저장은 부가 기능이라, 글자 수 초과 등으로 실패해도 첨삭 자체는 그대로 진행되게 한다.
    // 이미 있는 단어면(다른 일기에서 전에 썼던 것) 새로 만들지 않고, 이 일기로 다시 연결해서 여기서도 "단어 모음"에 보이게 한다
    private void saveWordIfAbsent(Long userId, boolean ja, String term, String meaning,
                                   String wrongText, String pos, String source, Long correctionId, Long diaryId) {
        String japan = ja ? term : meaning;
        String korea = ja ? meaning : term;
        try {
            wordRepository.findByUserIdAndJapanLanguageAndKoreaLanguage(userId, japan, korea)
                    .ifPresentOrElse(
                            existing -> existing.relinkTo(diaryId, correctionId),
                            () -> wordRepository.save(new Word(userId, japan, korea, null, wrongText, pos, source, correctionId, diaryId)));
        } catch (DataIntegrityViolationException e) {
            // 글자 수 초과(100자) 등 — 단어장만 건너뛰고 첨삭 결과는 그대로 둔다
        }
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
