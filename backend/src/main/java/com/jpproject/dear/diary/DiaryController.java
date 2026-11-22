package com.jpproject.dear.diary;

import com.jpproject.dear.dto.DiaryCalendarResponse;
import com.jpproject.dear.dto.DiaryRequest;
import com.jpproject.dear.dto.DiaryResponse;
import com.jpproject.dear.login.AuthConst;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// 로그인(JWT)한 회원만 접근 (LoginInterceptor가 /diaries/** 를 막아줌)
@RestController
@RequestMapping("/diaries")
public class DiaryController {

    private final DiaryService diaryService;

    public DiaryController(DiaryService diaryService) {
        this.diaryService = diaryService;
    }

    // API-009 일기 전송
    @PostMapping
    public ResponseEntity<DiaryResponse> create(@RequestAttribute(AuthConst.LOGIN_USER_ID) Long userId,
                                                @Valid @RequestBody DiaryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(diaryService.create(userId, request));
    }

    // API-010 일기 목록 (최신순, offset은 limit의 배수)
    @GetMapping
    public ResponseEntity<List<DiaryResponse>> list(@RequestAttribute(AuthConst.LOGIN_USER_ID) Long userId,
                                                    @RequestParam(required = false) Long matchId,
                                                    @RequestParam(defaultValue = "0") int offset,
                                                    @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(diaryService.list(userId, matchId, offset, limit));
    }

    // 홈 달력: 이번 달에 내가 일기를 쓴 날짜들 (예: ?month=2026-11)
    @GetMapping("/calendar")
    public ResponseEntity<DiaryCalendarResponse> calendar(@RequestAttribute(AuthConst.LOGIN_USER_ID) Long userId,
                                                          @RequestParam String month) {
        return ResponseEntity.ok(diaryService.calendar(userId, month));
    }

    // API-011 일기 상세
    @GetMapping("/{id}")
    public ResponseEntity<DiaryResponse> get(@RequestAttribute(AuthConst.LOGIN_USER_ID) Long userId,
                                             @PathVariable Long id) {
        return ResponseEntity.ok(diaryService.get(userId, id));
    }
}
