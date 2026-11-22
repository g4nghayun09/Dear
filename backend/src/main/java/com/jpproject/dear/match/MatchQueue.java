package com.jpproject.dear.match;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** DB-002 match_queue. 매칭을 기다리는 회원 1명당 1행. */
@Entity
@Table(name = "match_queue")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MatchQueue {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public MatchQueue(Long userId) {
        this.userId = userId;
        this.createdAt = LocalDateTime.now();
    }
}
