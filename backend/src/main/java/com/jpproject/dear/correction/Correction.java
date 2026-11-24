package com.jpproject.dear.correction;

import jakarta.persistence.*;

import java.time.LocalDateTime;

// DB-005 corrections 테이블
@Entity
@Table(name = "corrections")
public class Correction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "correction_id")
    private Long id;

    @Column(name = "diary_id", nullable = false)
    private Long diaryId;

    @Column(name = "original_text", nullable = false, length = 200)
    private String originalText;

    @Column(name = "corrected_text", nullable = false, length = 200)
    private String correctedText;

    @Column(length = 300)
    private String explanation;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected Correction() {
    }

    public Correction(Long diaryId, String originalText, String correctedText, String explanation) {
        this.diaryId = diaryId;
        this.originalText = originalText;
        this.correctedText = correctedText;
        this.explanation = explanation;
    }

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public Long getId() { return id; }
    public Long getDiaryId() { return diaryId; }
    public String getOriginalText() { return originalText; }
    public String getCorrectedText() { return correctedText; }
    public String getExplanation() { return explanation; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
