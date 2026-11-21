package com.jpproject.dear.language;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Component;

import com.jpproject.dear.common.ApiException;
import com.jpproject.dear.common.ErrorCode;
import com.jpproject.dear.common.ErrorResponse.FieldErrorItem;

/**
 * FR-010 학습 언어 입력 제한 - 서버 쪽 검사 (담당: 강태인)
 * 앱(src/lib/languageCheck.js)과 같은 규칙입니다. 규칙을 바꾸면 두 파일을 함께 고치세요.
 *
 * 일기 전송 API(담당: 강하윤)에서 이렇게 씁니다:
 *   languageValidator.validateDiary(request.content(), LanguageValidator.learningLangOf(me.getNativeLang()));
 */
@Component
public class LanguageValidator {

    public static final int MAX_LENGTH = 1000;
    public static final int MIN_LINES = 2;

    private static final String COMMON_PUNCT = ".,!?'\"()~…！？（）・：；-";

    /** 모국어 → 학습 언어 (ko ↔ ja) */
    public static String learningLangOf(String nativeLang) {
        return "ko".equals(nativeLang) ? "ja" : "ko";
    }

    /** 학습 언어가 아닌 글자 목록 (중복 없이, 처음 나온 순서대로) */
    public List<String> findInvalidChars(String text, String lang) {
        Set<String> invalid = new LinkedHashSet<>();
        text.codePoints().forEach(cp -> {
            if (!isAllowed(cp, lang) && !isCommon(cp)) {
                invalid.add(new String(Character.toChars(cp)));
            }
        });
        return List.copyOf(invalid);
    }

    /** 내용 있는 줄 수 */
    public int countLines(String text) {
        return (int) text.lines().filter(line -> !line.isBlank()).count();
    }

    /** 일기 본문 검사. 문제가 있으면 ApiException을 던집니다. */
    public void validateDiary(String content, String lang) {
        if (content == null || content.isBlank()) {
            throw invalid(ErrorCode.INVALID_INPUT, "본문을 입력해 주세요");
        }
        if (content.codePointCount(0, content.length()) > MAX_LENGTH) {
            throw invalid(ErrorCode.INVALID_INPUT, MAX_LENGTH + "자 이하로 써 주세요");
        }
        if (countLines(content) < MIN_LINES) {
            throw invalid(ErrorCode.INVALID_INPUT, MIN_LINES + "줄 이상 써 주세요");
        }
        List<String> chars = findInvalidChars(content, lang);
        if (!chars.isEmpty()) {
            String message = ("ja".equals(lang) ? "일본어" : "한국어") + "로만 작성할 수 있어요";
            throw new ApiException(ErrorCode.INVALID_LANGUAGE, message,
                    List.of(new FieldErrorItem("content", "허용되지 않는 글자: " + String.join(", ", chars))));
        }
    }

    private static ApiException invalid(ErrorCode code, String reason) {
        return new ApiException(code, code.defaultMessage(), List.of(new FieldErrorItem("content", reason)));
    }

    private static boolean isAllowed(int cp, String lang) {
        if ("ja".equals(lang)) {
            return in(cp, 0x3040, 0x309F)      // 히라가나
                    || in(cp, 0x30A0, 0x30FF)  // 가타카나 (ー 포함)
                    || in(cp, 0x31F0, 0x31FF)  // 가타카나 확장
                    || in(cp, 0x3400, 0x4DBF)  // 한자 확장 A
                    || in(cp, 0x4E00, 0x9FFF)  // 한자
                    || in(cp, 0xFF66, 0xFF9F)  // 반각 가타카나
                    || in(cp, 0x3000, 0x303F); // 일본어 문장부호 (、。「」 등)
        }
        return in(cp, 0xAC00, 0xD7A3)          // 완성형 한글
                || in(cp, 0x1100, 0x11FF)      // 한글 자모
                || in(cp, 0x3130, 0x318F);     // 호환용 자모 (ㄱ, ㅏ 등)
    }

    private static boolean isCommon(int cp) {
        return in(cp, '0', '9')
                || in(cp, 0xFF10, 0xFF19)      // 전각 숫자
                || Character.isWhitespace(cp) || cp == 0x00A0 || cp == 0x3000
                || COMMON_PUNCT.indexOf(cp) >= 0;
    }

    private static boolean in(int cp, int from, int to) {
        return cp >= from && cp <= to;
    }
}
