package com.jpproject.dear.diary;

import com.jpproject.dear.exception.ApiException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class LanguageValidatorTest {

    private final LanguageValidator validator = new LanguageValidator();

    private static final String JA = "今日は放課後に友達とカフェに行きました。\nケーキがとてもおいしかったです。";
    private static final String KO = "오늘은 친구랑 한강에 갔어요.\n라면을 먹었어요.";

    @Test
    void 학습언어는_모국어의_반대() {
        assertEquals("ja", LanguageValidator.learningLangOf("ko"));
        assertEquals("ko", LanguageValidator.learningLangOf("ja"));
    }

    @Test
    void 일본어_일기는_일본어_학습자에게_통과() {
        assertDoesNotThrow(() -> validator.validateContent(JA, "ja"));
    }

    @Test
    void 한국어_일기는_한국어_학습자에게_통과() {
        assertDoesNotThrow(() -> validator.validateContent(KO, "ko"));
    }

    @Test
    void 일본어로_써야_하는데_한글이_섞이면_INVALID_LANGUAGE() {
        ApiException e = assertThrows(ApiException.class, () -> validator.validateContent("今日は楽しかった\n오늘は天気がいい", "ja"));
        assertEquals("INVALID_LANGUAGE", e.getCode());
        assertTrue(validator.findInvalidChars("今日は오늘", "ja").containsAll(java.util.List.of("오", "늘")));
    }

    @Test
    void 한국어로_써야_하는데_일본어가_섞이면_INVALID_LANGUAGE() {
        ApiException e = assertThrows(ApiException.class, () -> validator.validateContent("오늘은 今日\n좋았어요", "ko"));
        assertEquals("INVALID_LANGUAGE", e.getCode());
    }

    @Test
    void 숫자_공백_문장부호는_두_언어_모두_허용() {
        assertDoesNotThrow(() -> validator.validateContent("2026년 11월 22일!\n좋은 하루였어요...", "ko"));
        assertDoesNotThrow(() -> validator.validateContent("2026年11月22日！\n「楽しい」一日でした。", "ja"));
    }

    @Test
    void 영어는_허용되지_않는다() {
        assertEquals(java.util.List.of("h", "i"), validator.findInvalidChars("hi", "ja"));
    }

    @Test
    void 내용_있는_줄이_2줄_미만이면_거절() {
        assertEquals("INVALID_INPUT", assertThrows(ApiException.class, () -> validator.validateContent("한 줄뿐이에요", "ko")).getCode());
        // 빈 줄은 줄 수에 세지 않는다
        assertEquals("INVALID_INPUT", assertThrows(ApiException.class, () -> validator.validateContent("한 줄\n\n   \n", "ko")).getCode());
    }

    @Test
    void 줄바꿈이_있어도_내용_있는_줄이_2줄이면_통과() {
        assertDoesNotThrow(() -> validator.validateContent("첫째 줄\n\n둘째 줄", "ko"));
    }

    @Test
    void 비었거나_1000자를_넘으면_거절() {
        assertThrows(ApiException.class, () -> validator.validateContent("  ", "ko"));
        assertThrows(ApiException.class, () -> validator.validateContent(null, "ko"));
        String longText = "가".repeat(500) + "\n" + "나".repeat(501);
        assertThrows(ApiException.class, () -> validator.validateContent(longText, "ko"));
        String max = "가".repeat(500) + "\n" + "나".repeat(499);   // 줄바꿈 포함 정확히 1000자
        assertDoesNotThrow(() -> validator.validateContent(max, "ko"));
    }
}
