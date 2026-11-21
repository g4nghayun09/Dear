package com.example.demo.match;

import java.time.LocalDateTime;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * DB-003 matches. 해제해도 지우지 않고 status만 ENDED로 바꿉니다.
 * 회원(users)과는 엔티티로 연결하지 않고 ID만 저장합니다. (회원 엔티티는 로그인 담당이 관리)
 * active_ko_id / active_ja_id 는 DB가 계산하는 컬럼이라 매핑하지 않습니다.
 */
@Entity
@Table(name = "matches")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "match_id")
    private Long id;

    @Column(name = "user_ko_id", nullable = false)
    private Long userKoId;

    @Column(name = "user_ja_id", nullable = false)
    private Long userJaId;

    // MySQL에서 enum 타입으로 검증하지 않도록 VARCHAR로 지정 (ddl-auto=validate 대비)
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "status", nullable = false, length = 10)
    private MatchStatus status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    public static Match create(Long userKoId, Long userJaId) {
        Match match = new Match();
        match.userKoId = userKoId;
        match.userJaId = userJaId;
        match.status = MatchStatus.ACTIVE;
        match.createdAt = LocalDateTime.now();
        return match;
    }

    public void end() {
        this.status = MatchStatus.ENDED;
        this.endedAt = LocalDateTime.now();
    }

    public boolean isActive() {
        return status == MatchStatus.ACTIVE;
    }

    public boolean hasMember(Long userId) {
        return userKoId.equals(userId) || userJaId.equals(userId);
    }

    /** 나(userId)의 교환 상대 ID */
    public Long partnerOf(Long userId) {
        return userKoId.equals(userId) ? userJaId : userKoId;
    }
}
