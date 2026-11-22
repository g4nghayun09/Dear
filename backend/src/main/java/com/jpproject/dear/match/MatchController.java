package com.jpproject.dear.match;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.jpproject.dear.common.auth.CurrentUser;
import com.jpproject.dear.match.dto.EndMatchResponse;
import com.jpproject.dear.match.dto.MatchStatusResponse;

import lombok.RequiredArgsConstructor;

/** 매칭 API (API 명세서 v3: API-006, 007, 008, 020) */
@RestController
@RequestMapping("/api/matches")
@RequiredArgsConstructor
public class MatchController {

    private final MatchService matchService;

    /** API-006 매칭 신청 (대기 중일 때 다시 부르면 새로고침) */
    @PostMapping
    public MatchStatusResponse requestMatch(@RequestAttribute(CurrentUser.ID) Long userId) {
        return matchService.requestMatch(userId);
    }

    /** API-007 매칭 상태 조회 */
    @GetMapping("/me")
    public MatchStatusResponse getMyMatch(@RequestAttribute(CurrentUser.ID) Long userId) {
        return matchService.getMyMatch(userId);
    }

    /** API-008 매칭 해제 */
    @PostMapping("/me/end")
    public EndMatchResponse endMatch(@RequestAttribute(CurrentUser.ID) Long userId) {
        return matchService.endMatch(userId);
    }

    /** API-020 매칭 대기 취소 */
    @DeleteMapping("/queue")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancelWaiting(@RequestAttribute(CurrentUser.ID) Long userId) {
        matchService.cancelWaiting(userId);
    }
}
