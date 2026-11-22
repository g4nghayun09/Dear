-- V2: 이메일+비밀번호 로그인과 구글 로그인을 둘 다 지원 (이미 만든 DB를 ALTER TABLE로 변경)
-- 서버를 켜면 Flyway가 자동으로 한 번만 실행합니다. 직접 실행하지 마세요(두 번 실행되면 오류).

-- 1) 구글 계정이 없는 이메일 가입자도 저장할 수 있게 google_sub를 비어 있어도 되게 변경
ALTER TABLE users
  MODIFY COLUMN google_sub VARCHAR(64) NULL COMMENT '구글 계정 고유 번호(구글 로그인 사용자만)';

-- 2) 이메일 가입자의 비밀번호 (BCrypt로 암호화한 값만 저장, 평문 저장 금지)
ALTER TABLE users
  ADD COLUMN password_hash VARCHAR(255) NULL COMMENT 'BCrypt 해시(이메일 가입 사용자만)' AFTER email;

-- 3) 둘 중 하나의 로그인 방법은 꼭 있어야 함
ALTER TABLE users
  ADD CONSTRAINT ck_users_login_method CHECK (google_sub IS NOT NULL OR password_hash IS NOT NULL);
