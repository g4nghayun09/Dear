// 앱 쪽 입력 검사. 서버(DB CHECK)와 같은 규칙으로 맞춤

export const NICKNAME_MIN = 2;
export const NICKNAME_MAX = 12;
export const DIARY_TITLE_MAX = 30;
export const DIARY_CONTENT_MAX = 1000;
export const DIARY_MIN_LINES = 2;
export const CORRECTION_MAX_ITEMS = 20;

// 내용 있는 줄 수 (DB의 count_text_lines 와 같은 기준)
export function countTextLines(text) {
  return (text ?? '').split('\n').filter((line) => line.trim() !== '').length;
}

// 오류가 없으면 null, 있으면 문구
export function validateNickname(nickname) {
  const v = (nickname ?? '').trim();
  if (!v) return '닉네임을 입력해 주세요.';
  if (v.length < NICKNAME_MIN || v.length > NICKNAME_MAX) return `닉네임은 ${NICKNAME_MIN}~${NICKNAME_MAX}자로 입력해 주세요.`;
  return null;
}

export function validateDiary({ title, content }) {
  if (title && title.length > DIARY_TITLE_MAX) return `제목은 ${DIARY_TITLE_MAX}자 이하로 써 주세요.`;
  if (!content || !content.trim()) return '일기 내용을 써 주세요.';
  if (content.length > DIARY_CONTENT_MAX) return `일기는 ${DIARY_CONTENT_MAX}자 이하로 써 주세요.`;
  if (countTextLines(content) < DIARY_MIN_LINES) return `일기는 ${DIARY_MIN_LINES}줄 이상 써 주세요.`;
  return null;
}

export function validateCorrections(items, diaryContent) {
  if (items.length > CORRECTION_MAX_ITEMS) return `첨삭은 ${CORRECTION_MAX_ITEMS}개까지 할 수 있어요.`;
  for (const it of items) {
    if (!it.original_text?.trim() || !it.corrected_text?.trim()) return '틀린 부분과 고친 표현을 모두 써 주세요.';
    if (it.original_text.length > 200 || it.corrected_text.length > 200) return '첨삭 문구는 200자 이하로 써 주세요.';
    if (it.explanation && it.explanation.length > 300) return '설명은 300자 이하로 써 주세요.';
    if (!diaryContent.includes(it.original_text)) return '틀린 부분은 일기 본문에 있는 문구여야 해요.';
  }
  return null;
}

// 모국어 → 학습 언어 (명세: 학습 언어는 반대 언어로 계산)
export const learningLang = (nativeLang) => (nativeLang === 'ko' ? 'ja' : 'ko');
