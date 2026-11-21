-- Dear . Flyway V1 (MySQL 8.0.16 이상)
-- 위치: backend/src/main/resources/db/migration/V1__init.sql
-- 이 파일은 한 번 실행된 뒤에는 고치지 않습니다. 바꿀 것은 V2__...sql 로 추가합니다.

-- DB-001 회원
CREATE TABLE users (
  user_id     BIGINT       NOT NULL AUTO_INCREMENT,
  google_sub  VARCHAR(64)  NOT NULL COMMENT '구글 계정 고유 번호(ID 토큰의 sub)',
  email       VARCHAR(255) NOT NULL,
  nickname    VARCHAR(12)  NULL     COMMENT '가입 1단계(P-003)에서 입력, 그 전에는 NULL',
  native_lang VARCHAR(2)   NULL     COMMENT 'ko / ja, 가입 2단계(P-004)에서 입력, 이후 변경 불가',
  created_at  DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (user_id),
  UNIQUE KEY uk_users_google_sub (google_sub),
  UNIQUE KEY uk_users_email (email),
  UNIQUE KEY uk_users_nickname (nickname),
  CONSTRAINT ck_users_nickname_len CHECK (nickname IS NULL OR CHAR_LENGTH(nickname) BETWEEN 2 AND 12),
  CONSTRAINT ck_users_native_lang CHECK (native_lang IS NULL OR native_lang IN ('ko', 'ja'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- DB-002 매칭 대기열
CREATE TABLE match_queue (
  user_id    BIGINT      NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (user_id),
  KEY idx_match_queue_created (created_at),
  CONSTRAINT fk_match_queue_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- DB-003 매칭 (해제해도 지우지 않고 status만 ENDED로 바꿈)
CREATE TABLE matches (
  match_id     BIGINT      NOT NULL AUTO_INCREMENT,
  user_ko_id   BIGINT      NOT NULL COMMENT '모국어가 한국어인 회원',
  user_ja_id   BIGINT      NOT NULL COMMENT '모국어가 일본어인 회원',
  status       VARCHAR(10) NOT NULL DEFAULT 'ACTIVE',
  created_at   DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  ended_at     DATETIME(6) NULL,
  -- 회원당 활성 매칭 1개를 보장하는 계산 컬럼 (ENDED면 NULL이라 유일 검사에서 빠짐)
  active_ko_id BIGINT AS (IF(status = 'ACTIVE', user_ko_id, NULL)) STORED,
  active_ja_id BIGINT AS (IF(status = 'ACTIVE', user_ja_id, NULL)) STORED,
  PRIMARY KEY (match_id),
  UNIQUE KEY uk_matches_active_ko (active_ko_id),
  UNIQUE KEY uk_matches_active_ja (active_ja_id),
  KEY idx_matches_ko (user_ko_id),
  KEY idx_matches_ja (user_ja_id),
  CONSTRAINT ck_matches_status CHECK (status IN ('ACTIVE', 'ENDED')),
  CONSTRAINT ck_matches_diff_users CHECK (user_ko_id <> user_ja_id),
  CONSTRAINT fk_matches_ko FOREIGN KEY (user_ko_id) REFERENCES users (user_id),
  CONSTRAINT fk_matches_ja FOREIGN KEY (user_ja_id) REFERENCES users (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- DB-004 일기
CREATE TABLE diary (
  diary_id     BIGINT      NOT NULL AUTO_INCREMENT,
  match_id     BIGINT      NOT NULL,
  user_id      BIGINT      NOT NULL COMMENT '작성자',
  title        VARCHAR(30) NULL,
  language     VARCHAR(2)  NOT NULL COMMENT '작성 언어(작성자의 학습 언어), 서버가 자동 입력',
  content      TEXT        NOT NULL COMMENT '내용 있는 줄 2줄 이상은 서버에서 검사',
  status       VARCHAR(10) NOT NULL DEFAULT 'SENT',
  created_at   DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  corrected_at DATETIME(6) NULL,
  read_at      DATETIME(6) NULL     COMMENT '받는 사람이 처음 읽은 시각(FR-021)',
  PRIMARY KEY (diary_id),
  KEY idx_diary_match_created (match_id, created_at),
  KEY idx_diary_user (user_id),
  CONSTRAINT ck_diary_language CHECK (language IN ('ko', 'ja')),
  CONSTRAINT ck_diary_status CHECK (status IN ('SENT', 'CORRECTED')),
  CONSTRAINT ck_diary_content_len CHECK (CHAR_LENGTH(content) <= 1000),
  CONSTRAINT fk_diary_match FOREIGN KEY (match_id) REFERENCES matches (match_id),
  CONSTRAINT fk_diary_user FOREIGN KEY (user_id) REFERENCES users (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- DB-005 첨삭 항목
CREATE TABLE corrections (
  correction_id  BIGINT       NOT NULL AUTO_INCREMENT,
  diary_id       BIGINT       NOT NULL,
  original_text  VARCHAR(200) NOT NULL,
  corrected_text VARCHAR(200) NOT NULL,
  explanation    VARCHAR(300) NULL,
  created_at     DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (correction_id),
  KEY idx_corrections_diary (diary_id),
  CONSTRAINT fk_corrections_diary FOREIGN KEY (diary_id) REFERENCES diary (diary_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- DB-006 단어장
CREATE TABLE words (
  word_id         BIGINT       NOT NULL AUTO_INCREMENT,
  user_id         BIGINT       NOT NULL COMMENT '단어장 주인',
  japan_language  VARCHAR(100) NOT NULL COMMENT '일본어 쪽',
  korea_language  VARCHAR(100) NOT NULL COMMENT '한국어 쪽',
  reading         VARCHAR(100) NULL     COMMENT '읽기(후리가나 등)',
  wrong_text      VARCHAR(200) NULL     COMMENT '첨삭에서 저장했을 때 틀렸던 표현',
  source          VARCHAR(12)  NOT NULL,
  correction_id   BIGINT       NULL,
  study_count     INT          NOT NULL DEFAULT 0,
  is_mastered     BOOLEAN      NOT NULL DEFAULT FALSE,
  last_studied_at DATETIME(6)  NULL,
  created_at      DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (word_id),
  UNIQUE KEY uk_words_user_pair (user_id, japan_language, korea_language),
  KEY idx_words_user_created (user_id, created_at),
  CONSTRAINT ck_words_source CHECK (source IN ('SEARCH', 'MANUAL', 'CORRECTION')),
  CONSTRAINT fk_words_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
  CONSTRAINT fk_words_correction FOREIGN KEY (correction_id) REFERENCES corrections (correction_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

