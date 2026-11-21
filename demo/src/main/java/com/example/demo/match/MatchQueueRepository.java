package com.example.demo.match;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MatchQueueRepository extends JpaRepository<MatchQueue, Long> {

    /**
     * 모국어가 나와 반대인, 가장 오래 기다린 회원 1명을 잠그고 가져옵니다.
     * SKIP LOCKED: 다른 사람이 이미 잡아 둔 대기자는 건너뜀 → 동시에 신청해도 한 사람이 두 번 매칭되지 않음.
     */
    @Query(value = """
            SELECT q.user_id
            FROM match_queue q
            JOIN users u ON u.user_id = q.user_id
            WHERE u.native_lang <> :myLang
              AND q.user_id <> :myId
            ORDER BY q.created_at
            LIMIT 1
            FOR UPDATE OF q SKIP LOCKED
            """, nativeQuery = true)
    Optional<Long> findOldestPartnerForUpdate(@Param("myId") Long myId, @Param("myLang") String myLang);
}
