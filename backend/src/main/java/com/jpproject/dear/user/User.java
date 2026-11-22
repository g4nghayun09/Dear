package com.jpproject.dear.user;

import jakarta.persistence.*;

import java.time.LocalDateTime;

// DB-001 users 테이블
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long id;

    @Column(name = "google_sub", nullable = false, unique = true, length = 64)
    private String googleSub;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    // 가입 1단계(P-003)에서 입력. 그 전에는 null
    @Column(length = 12, unique = true)
    private String nickname;

    // 가입 2단계(P-004)에서 입력. 'ko' / 'ja'. 이후 변경 불가
    @Column(name = "native_lang", length = 2)
    private String nativeLang;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime createdAt;

    protected User() {
    }

    public User(String googleSub, String email) {
        this.googleSub = googleSub;
        this.email = email;
    }

    public void changeNickname(String nickname) {
        this.nickname = nickname;
    }

    // 모국어는 한 번만 정할 수 있다. 이미 있으면 false
    public boolean setNativeLangOnce(String nativeLang) {
        if (this.nativeLang != null) {
            return false;
        }
        this.nativeLang = nativeLang;
        return true;
    }

    public Long getId() {
        return id;
    }

    public String getGoogleSub() {
        return googleSub;
    }

    public String getEmail() {
        return email;
    }

    public String getNickname() {
        return nickname;
    }

    public String getNativeLang() {
        return nativeLang;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
