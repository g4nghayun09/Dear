-- 단어장 카드에 "기본형" 대신 실제 품사(명사/동사/형용사 등)를 보여주기 위해 추가
ALTER TABLE dictionary
  ADD COLUMN part_of_speech VARCHAR(10) NULL COMMENT '품사 (명사/동사/형용사 등)' AFTER korea_language;

ALTER TABLE words
  ADD COLUMN part_of_speech VARCHAR(10) NULL COMMENT '사전 단어일 때의 품사 (첨삭 항목은 NULL)' AFTER wrong_text;

-- 기본 사전(V3) 단어들의 품사 채우기
UPDATE dictionary SET part_of_speech = '명사' WHERE japan_language IN ('今日', '明日', '友達', '学校', '放課後');
UPDATE dictionary SET part_of_speech = '형용사' WHERE japan_language = '白い';
