-- DB-006 words 보강: 사전 검색(SEARCH) 단어가 어느 일기에서 나왔는지 남겨서,
-- 그 일기를 다시 볼 때 사전 단어를 표시할 수 있게 한다. 첨삭(CORRECTION) 단어는 correction_id로 이미 연결됨
ALTER TABLE words
  ADD COLUMN diary_id BIGINT NULL COMMENT '사전 검색(SEARCH)으로 넣었을 때, 그 단어를 쓴 일기' AFTER correction_id,
  ADD CONSTRAINT fk_words_diary FOREIGN KEY (diary_id) REFERENCES diary (diary_id) ON DELETE SET NULL,
  ADD KEY idx_words_diary (diary_id);
