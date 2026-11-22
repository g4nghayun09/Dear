package com.jpproject.dear.diary;

import com.jpproject.dear.dto.DiaryCalendarResponse;
import com.jpproject.dear.dto.DiaryRequest;
import com.jpproject.dear.dto.DiaryResponse;
import com.jpproject.dear.exception.ApiException;
import com.jpproject.dear.user.User;
import com.jpproject.dear.user.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.List;

@Service
@Transactional
public class DiaryService {

    private static final int MAX_LIMIT = 50;

    private final DiaryRepository diaryRepository;
    private final UserRepository userRepository;
    private final LanguageValidator languageValidator;

    public DiaryService(DiaryRepository diaryRepository, UserRepository userRepository,
                        LanguageValidator languageValidator) {
        this.diaryRepository = diaryRepository;
        this.userRepository = userRepository;
        this.languageValidator = languageValidator;
    }

    // 일기 전송 (FR-009~011): 학습 언어로 쓴 일기를 내 활성 매칭에 저장한다
    public DiaryResponse create(Long userId, DiaryRequest request) {
        User user = findUser(userId);
        if (user.getNativeLang() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_INPUT", "가입을 먼저 마쳐 주세요.");
        }
        String language = LanguageValidator.learningLangOf(user.getNativeLang());
        languageValidator.validateContent(request.content(), language);

        Long matchId = diaryRepository.findActiveMatchId(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.CONFLICT, "NO_ACTIVE_MATCH", "교환 상대가 없어요."));

        String title = request.title() == null || request.title().isBlank() ? null : request.title().trim();
        Diary saved = diaryRepository.save(new Diary(matchId, userId, title, language, request.content()));
        return DiaryResponse.from(saved, userId);
    }

    // 일기 목록 (최신순). matchId가 없으면 내 활성 매칭. 끝난 매칭도 당사자는 볼 수 있다
    @Transactional(readOnly = true)
    public List<DiaryResponse> list(Long userId, Long matchId, int offset, int limit) {
        int size = Math.min(Math.max(limit, 1), MAX_LIMIT);
        if (offset < 0 || offset % size != 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_INPUT", "offset은 limit의 배수여야 해요.");
        }
        Long target = matchId != null ? matchId : diaryRepository.findActiveMatchId(userId).orElse(null);
        if (target == null) {
            return List.of();
        }
        requireMember(target, userId);
        return diaryRepository.findByMatchIdOrderByCreatedAtDesc(target, PageRequest.of(offset / size, size))
                .stream().map(d -> DiaryResponse.from(d, userId)).toList();
    }

    @Transactional(readOnly = true)
    public DiaryResponse get(Long userId, Long diaryId) {
        Diary diary = diaryRepository.findById(diaryId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "일기를 찾을 수 없어요."));
        requireMember(diary.getMatchId(), userId);
        return DiaryResponse.from(diary, userId);
    }

    // 홈 달력: 그 달에 내가 일기를 쓴 날짜
    @Transactional(readOnly = true)
    public DiaryCalendarResponse calendar(Long userId, String month) {
        YearMonth ym;
        try {
            ym = YearMonth.parse(month);
        } catch (DateTimeParseException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_INPUT", "month는 yyyy-MM 형식이어야 해요.");
        }
        LocalDateTime from = ym.atDay(1).atStartOfDay();
        LocalDateTime to = ym.plusMonths(1).atDay(1).atStartOfDay();
        List<Integer> days = diaryRepository.findMyCreatedAtBetween(userId, from, to).stream()
                .map(LocalDateTime::getDayOfMonth).distinct().sorted().toList();
        return new DiaryCalendarResponse(ym.toString(), days);
    }

    // 매칭 당사자만 일기를 볼 수 있다 (남의 일기는 존재 자체를 숨기려고 404)
    private void requireMember(Long matchId, Long userId) {
        if (diaryRepository.countMembership(matchId, userId) == 0) {
            throw new ApiException(HttpStatus.NOT_FOUND, "일기를 찾을 수 없어요.");
        }
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "존재하지 않는 회원입니다."));
    }
}
