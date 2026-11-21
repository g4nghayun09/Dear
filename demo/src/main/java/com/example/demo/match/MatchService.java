package com.example.demo.match;

import java.util.Optional;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.common.ApiException;
import com.example.demo.common.ErrorCode;
import com.example.demo.match.MatchUserReader.MatchUser;
import com.example.demo.match.dto.EndMatchResponse;
import com.example.demo.match.dto.MatchStatusResponse;
import com.example.demo.match.dto.PartnerResponse;

import lombok.RequiredArgsConstructor;

/**
 * FR-006 매칭 신청 / FR-007 매칭 상태 / FR-008 매칭 해제 (담당: 강태인)
 *
 * 다른 기능에서 쓰는 메서드 (일기·첨삭 담당 참고):
 *  - getActiveMatchOrThrow(userId): 일기를 쓸 때 내 활성 매칭 찾기 (없으면 NO_ACTIVE_MATCH)
 *  - getMatchForMember(matchId, userId): 일기 목록·상세를 볼 때 당사자인지 확인 (해제된 매칭도 허용)
 */
@Service
@RequiredArgsConstructor
public class MatchService {

    private final MatchRepository matchRepository;
    private final MatchQueueRepository queueRepository;
    private final MatchUserReader userReader;

    /**
     * API-006 매칭 신청.
     * 반대 언어 대기자가 있으면 바로 매칭, 없으면 대기열에 등록합니다.
     * 이미 대기 중이면 다시 짝을 찾아 보므로, 앱의 '새로고침'도 이 API를 다시 부르면 됩니다.
     */
    @Transactional
    public MatchStatusResponse requestMatch(Long me) {
        MatchUser user = userReader.find(me).orElseThrow(() -> new ApiException(ErrorCode.UNAUTHORIZED));
        if (user.nickname() == null || user.nativeLang() == null) {
            throw new ApiException(ErrorCode.PROFILE_REQUIRED);
        }
        if (matchRepository.findActive(me).isPresent()) {
            throw new ApiException(ErrorCode.ALREADY_MATCHED);
        }

        Optional<Long> partnerId = queueRepository.findOldestPartnerForUpdate(me, user.nativeLang());
        if (partnerId.isEmpty()) {
            MatchQueue waiting = queueRepository.findById(me)
                    .orElseGet(() -> queueRepository.save(new MatchQueue(me)));
            return MatchStatusResponse.waiting(waiting.getCreatedAt());
        }

        Long partner = partnerId.get();
        queueRepository.deleteById(partner);
        queueRepository.deleteById(me);

        Match match = "ko".equals(user.nativeLang())
                ? Match.create(me, partner)
                : Match.create(partner, me);
        try {
            matchRepository.saveAndFlush(match);
        } catch (DataIntegrityViolationException e) {
            // 거의 동시에 다른 매칭이 먼저 만들어진 경우 (DB 유일 제약이 막아 줌)
            throw new ApiException(ErrorCode.ALREADY_MATCHED);
        }
        return toMatched(match, me);
    }

    /** API-007 매칭 상태 조회 */
    @Transactional(readOnly = true)
    public MatchStatusResponse getMyMatch(Long me) {
        Optional<Match> active = matchRepository.findActive(me);
        if (active.isPresent()) {
            return toMatched(active.get(), me);
        }
        return queueRepository.findById(me)
                .map(q -> MatchStatusResponse.waiting(q.getCreatedAt()))
                .orElseGet(MatchStatusResponse::none);
    }

    /** API-008 매칭 해제. 일기와 첨삭은 지우지 않으므로 지난 교환일기로 계속 볼 수 있습니다. */
    @Transactional
    public EndMatchResponse endMatch(Long me) {
        Match match = matchRepository.findActiveForUpdate(me)
                .orElseThrow(() -> new ApiException(ErrorCode.NO_ACTIVE_MATCH));
        match.end();
        return new EndMatchResponse(match.getId(), match.getEndedAt());
    }

    /** API-020 매칭 대기 취소 */
    @Transactional
    public void cancelWaiting(Long me) {
        MatchQueue waiting = queueRepository.findById(me)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_WAITING));
        queueRepository.delete(waiting);
    }

    // ── 다른 기능에서 쓰는 메서드 ──

    @Transactional(readOnly = true)
    public Match getActiveMatchOrThrow(Long userId) {
        return matchRepository.findActive(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.NO_ACTIVE_MATCH));
    }

    @Transactional(readOnly = true)
    public Match getMatchForMember(Long matchId, Long userId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        if (!match.hasMember(userId)) {
            throw new ApiException(ErrorCode.FORBIDDEN);
        }
        return match;
    }

    private MatchStatusResponse toMatched(Match match, Long me) {
        MatchUser partner = userReader.find(match.partnerOf(me))
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        return MatchStatusResponse.matched(
                match.getId(),
                new PartnerResponse(partner.nickname(), partner.nativeLang()),
                match.getCreatedAt());
    }
}
