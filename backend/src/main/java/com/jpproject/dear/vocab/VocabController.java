package com.jpproject.dear.vocab;

import com.jpproject.dear.common.auth.CurrentUser;
import com.jpproject.dear.vocab.dto.VocabRequest;
import com.jpproject.dear.vocab.dto.VocabResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vocab")
@RequiredArgsConstructor
public class VocabController {

    private final VocabService vocabService;

    // API-014 단어장에 단어 추가
    @PostMapping
    public ResponseEntity<VocabResponse> create(@RequestAttribute(CurrentUser.ID) Long userId,
                                                 @RequestBody VocabRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(vocabService.create(userId, request));
    }

    // API-015 단어장 목록
    @GetMapping
    public List<VocabResponse> list(@RequestAttribute(CurrentUser.ID) Long userId,
                                     @RequestParam(required = false) String source) {
        return vocabService.list(userId, source);
    }
}
