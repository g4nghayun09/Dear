package com.jpproject.dear.dev;

import java.util.List;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.jpproject.dear.diary.LanguageValidator;
import com.jpproject.dear.exception.ApiException;

import lombok.RequiredArgsConstructor;

/**
 * [개발용] 기능 시연 화면(src/app/dev.js)에서 쓰는 API.
 * .env 의 DEV_AUTH=true 일 때만 켜지고, 시연·배포 때(false)는 아예 생기지 않습니다.
 */
@RestController
@RequestMapping("/api/dev")
@RequiredArgsConstructor
@ConditionalOnProperty(name = "dear.dev-auth.enabled", havingValue = "true")
public class DevDemoController {

    private final DevDemoService demoService;
    private final LanguageValidator languageValidator;

    /** 테스트 사용자 3명 준비 + 매칭·대기·일기 초기화 */
    @PostMapping("/test-users")
    public List<DevDemoService.TestUser> prepareTestUsers() {
        return demoService.prepareTestUsers();
    }

    public record LanguageCheckRequest(String content, String lang) {
    }

    public record LanguageCheckResponse(
            @JsonProperty("valid") boolean valid,
            @JsonProperty("invalid_chars") List<String> invalidChars,
            @JsonProperty("lines") int lines,
            @JsonProperty("length") int length,
            @JsonProperty("error_code") String errorCode,
            @JsonProperty("message") String message) {
    }

    /** 서버 쪽 학습 언어 검사(LanguageValidator)를 그대로 실행해 결과를 돌려줌 */
    @PostMapping("/language-check")
    public LanguageCheckResponse checkLanguage(@RequestBody LanguageCheckRequest req) {
        String content = req.content() == null ? "" : req.content();
        String lang = "ko".equals(req.lang()) ? "ko" : "ja";
        List<String> invalid = languageValidator.findInvalidChars(content, lang);
        int lines = languageValidator.countLines(content);
        int length = content.codePointCount(0, content.length());
        try {
            languageValidator.validateContent(content, lang);
            return new LanguageCheckResponse(true, invalid, lines, length, null, "보낼 수 있어요");
        } catch (ApiException e) {
            return new LanguageCheckResponse(false, invalid, lines, length, e.getCode(), e.getMessage());
        }
    }
}
