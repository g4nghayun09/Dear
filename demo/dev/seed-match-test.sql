-- [개발용] 매칭 테스트용 사용자 3명. 로그인 기능이 완성되기 전에만 씁니다.
-- 앱의 '기능 시연' 화면에서 [테스트 사용자 준비]를 누르면 같은 일을 자동으로 하므로, 보통은 실행할 필요 없습니다.
-- MySQL Workbench 등에서 dear DB에 직접 실행하세요. (Flyway 폴더가 아니라서 자동 실행되지 않음)
-- 1번(한국어), 2번(일본어), 3번(한국어)

INSERT INTO users (user_id, google_sub, email, nickname, native_lang) VALUES
  (1, 'dev-1', 'test.ko1@example.com', '민지',   'ko'),
  (2, 'dev-2', 'test.ja1@example.com', 'はると', 'ja'),
  (3, 'dev-3', 'test.ko2@example.com', '지호',   'ko');

-- 처음부터 다시 테스트하고 싶을 때 (매칭·대기열만 비움)
-- DELETE FROM diary; DELETE FROM matches; DELETE FROM match_queue;
