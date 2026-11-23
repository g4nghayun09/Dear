package com.jpproject.dear.match;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

public interface MatchRepository extends JpaRepository<Match, Long> {

    @Query("select m from Match m where m.status = :status and (m.userKoId = :userId or m.userJaId = :userId)")
    Optional<Match> findByMemberAndStatus(@Param("userId") Long userId, @Param("status") MatchStatus status);

    /** 매칭 해제할 때: 같은 매칭을 동시에 바꾸지 못하게 잠그고 조회 */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select m from Match m where m.status = :status and (m.userKoId = :userId or m.userJaId = :userId)")
    Optional<Match> findByMemberAndStatusForUpdate(@Param("userId") Long userId, @Param("status") MatchStatus status);

    /** API-019 내 매칭 기록 (최신순, 진행 중 + 해제된 것 모두) */
    @Query("select m from Match m where m.userKoId = :userId or m.userJaId = :userId order by m.createdAt desc")
    List<Match> findAllByMember(@Param("userId") Long userId);

    default Optional<Match> findActive(Long userId) {
        return findByMemberAndStatus(userId, MatchStatus.ACTIVE);
    }

    default Optional<Match> findActiveForUpdate(Long userId) {
        return findByMemberAndStatusForUpdate(userId, MatchStatus.ACTIVE);
    }
}
