package com.jpproject.dear.vocab;

import jakarta.persistence.*;

import java.time.LocalDateTime;

// DB-006 words 테이블 (단어장). 지금은 첨삭 기능에서 쓰는 쪽만 구현 — 조회용 /api/vocab API는 별도 작업
@Entity
@Table(name = "words")
public class Word {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "word_id")
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "japan_language", nullable = false, length = 100)
    private String japanLanguage;

    @Column(name = "korea_language", nullable = false, length = 100)
    private String koreaLanguage;

    @Column(length = 100)
    private String reading;

    @Column(name = "wrong_text", length = 200)
    private String wrongText;

    @Column(name = "part_of_speech", length = 10)
    private String partOfSpeech;

    @Column(nullable = false, length = 12)
    private String source;

    @Column(name = "correction_id")
    private Long correctionId;

    // 사전 검색(SEARCH)으로 넣었을 때, 그 단어를 쓴 일기 (나중에 그 일기를 다시 볼 때 표시하려고)
    @Column(name = "diary_id")
    private Long diaryId;

    @Column(name = "study_count", nullable = false)
    private int studyCount = 0;

    @Column(name = "is_mastered", nullable = false)
    private boolean mastered = false;

    @Column(name = "last_studied_at")
    private LocalDateTime lastStudiedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected Word() {
    }

    public Word(Long userId, String japanLanguage, String koreaLanguage, String reading,
                String wrongText, String source, Long correctionId, Long diaryId) {
        this(userId, japanLanguage, koreaLanguage, reading, wrongText, null, source, correctionId, diaryId);
    }

    public Word(Long userId, String japanLanguage, String koreaLanguage, String reading,
                String wrongText, String partOfSpeech, String source, Long correctionId, Long diaryId) {
        this.userId = userId;
        this.japanLanguage = japanLanguage;
        this.koreaLanguage = koreaLanguage;
        this.reading = reading;
        this.wrongText = wrongText;
        this.partOfSpeech = partOfSpeech;
        this.source = source;
        this.correctionId = correctionId;
        this.diaryId = diaryId;
    }

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    // 이미 있는 단어를 다른 일기에서 또 썼을 때: 그 일기에서도 "단어 모음"에 보이도록 최근 일기로 다시 연결한다
    public void relinkTo(Long diaryId, Long correctionId) {
        this.diaryId = diaryId;
        if (correctionId != null) {
            this.correctionId = correctionId;
        }
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getJapanLanguage() { return japanLanguage; }
    public String getKoreaLanguage() { return koreaLanguage; }
    public String getReading() { return reading; }
    public String getWrongText() { return wrongText; }
    public String getPartOfSpeech() { return partOfSpeech; }
    public String getSource() { return source; }
    public Long getCorrectionId() { return correctionId; }
    public Long getDiaryId() { return diaryId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
