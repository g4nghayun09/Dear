CREATE TABLE dictionary (
  dictionary_id  BIGINT       NOT NULL AUTO_INCREMENT,
  japan_language VARCHAR(100) NOT NULL COMMENT '일본어 단어 (예: 今日)',
  reading        VARCHAR(100) NULL     COMMENT '읽기 (예: きょう)',
  korea_language VARCHAR(100) NOT NULL COMMENT '한국어 뜻 (예: 오늘)',
  PRIMARY KEY (dictionary_id),
  UNIQUE KEY uk_dictionary_pair (japan_language, korea_language),
  KEY idx_dictionary_korea (korea_language),
  KEY idx_dictionary_japan (japan_language)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO dictionary (japan_language, reading, korea_language) VALUES
('今日', 'きょう', '오늘'),
('明日', 'あした', '내일'),
('友達', 'ともだち', '친구'),
('学校', 'がっこう', '학교'),
('放課後', 'ほうかご', '방과 후'),
('白い', 'しろい', '하얗다');