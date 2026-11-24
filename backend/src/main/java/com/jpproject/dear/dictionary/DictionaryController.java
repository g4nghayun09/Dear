package com.jpproject.dear.dictionary;

import com.jpproject.dear.common.auth.CurrentUser;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/dictionary")
public class DictionaryController {
    // ... 생성자로 DictionaryService 주입
    private final DictionaryService dictionaryService;

    @GetMapping
    public DictionaryResponse search(
            @RequestAttribute(CurrentUser.ID) Long userId,   // 로그인 확인용 (값은 쓰지 않음)
            @RequestParam(defaultValue = "") String q,
            @RequestParam String from) {
        return dictionaryService.search(q, from);
    }
}