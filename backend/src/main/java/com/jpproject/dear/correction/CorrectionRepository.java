package com.jpproject.dear.correction;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface CorrectionRepository extends JpaRepository<Correction, Long> {
    List<Correction> findByDiaryIdOrderByCreatedAt(Long diaryId);

    // 일기 기능(diary 테이블)과는 SQL로만 연결한다 (MatchRepository/DiaryRepository와 같은 방식)
    @Modifying
    @Query(value = "update diary set status = 'CORRECTED', corrected_at = :correctedAt where diary_id = :diaryId",
            nativeQuery = true)
    void markDiaryCorrected(@Param("diaryId") Long diaryId, @Param("correctedAt") LocalDateTime correctedAt);
}
