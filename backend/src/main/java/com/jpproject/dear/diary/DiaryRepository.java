package com.jpproject.dear.diary;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface DiaryRepository extends JpaRepository<Diary, Long> {
    List<Diary> findByMatchIdOrderByCreatedAtDesc(Long matchId, Pageable pageable);

    // 달력에 표시할 날짜: 내가 쓴 일기의 전송 시각
    @Query("select d.createdAt from Diary d where d.userId = :userId and d.createdAt >= :from and d.createdAt < :to")
    List<LocalDateTime> findMyCreatedAtBetween(@Param("userId") Long userId,
                                               @Param("from") LocalDateTime from,
                                               @Param("to") LocalDateTime to);

    // 매칭 기능(matches 테이블)과는 SQL로만 연결해서, 매칭 코드가 바뀌어도 영향이 없게 한다
    @Query(value = "select match_id from matches where status = 'ACTIVE' "
            + "and (user_ko_id = :userId or user_ja_id = :userId) limit 1", nativeQuery = true)
    Optional<Long> findActiveMatchId(@Param("userId") Long userId);

    @Query(value = "select count(*) from matches where match_id = :matchId "
            + "and (user_ko_id = :userId or user_ja_id = :userId)", nativeQuery = true)
    long countMembership(@Param("matchId") Long matchId, @Param("userId") Long userId);
}
