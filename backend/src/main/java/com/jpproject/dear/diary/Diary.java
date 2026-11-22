package com.jpproject.dear.diary;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

// DB-004 diary 테이블
@Entity
@Table(name = "diary")
public class Diary {

    public static final String SENT = "SENT";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "diary_id")
    private Long id;

    @Column(name = "match_id", nullable = false)
    private Long matchId;

    // 작성자
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(length = 30)
    private String title;

    // 작성 언어(작성자의 학습 언어). 서버가 자동으로 넣는다
    @Column(nullable = false, length = 2)
    private String language;

    @JdbcTypeCode(SqlTypes.LONGVARCHAR)
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false, length = 10)
    private String status = SENT;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "corrected_at")
    private LocalDateTime correctedAt;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    protected Diary() {
    }

    public Diary(Long matchId, Long userId, String title, String language, String content) {
        this.matchId = matchId;
        this.userId = userId;
        this.title = title;
        this.language = language;
        this.content = content;
    }

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public Long getId() { return id; }
    public Long getMatchId() { return matchId; }
    public Long getUserId() { return userId; }
    public String getTitle() { return title; }
    public String getLanguage() { return language; }
    public String getContent() { return content; }
    public String getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getCorrectedAt() { return correctedAt; }
    public LocalDateTime getReadAt() { return readAt; }
}
