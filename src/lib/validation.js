// 앱 쪽 입력 검사. 서버(DB CHECK)와 같은 규칙으로 맞춤
import { t } from './i18n';

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
  if (!v) return t('validation.nicknameRequired');
  if (v.length < NICKNAME_MIN || v.length > NICKNAME_MAX) {
    return t('validation.nicknameLength', { min: NICKNAME_MIN, max: NICKNAME_MAX });
  }
  return null;
}

export function validateDiary({ title, content }) {
  if (title && title.length > DIARY_TITLE_MAX) return t('validation.diaryTitleLength', { max: DIARY_TITLE_MAX });
  if (!content || !content.trim()) return t('validation.diaryContentRequired');
  if (content.length > DIARY_CONTENT_MAX) return t('validation.diaryContentLength', { max: DIARY_CONTENT_MAX });
  if (countTextLines(content) < DIARY_MIN_LINES) return t('validation.diaryMinLines', { min: DIARY_MIN_LINES });
  return null;
}

export function validateCorrections(items, diaryContent) {
  if (items.length > CORRECTION_MAX_ITEMS) return t('validation.correctionMaxItems', { max: CORRECTION_MAX_ITEMS });
  for (const it of items) {
    if (!it.original_text?.trim() || !it.corrected_text?.trim()) return t('validation.correctionBothRequired');
    if (it.original_text.length > 200 || it.corrected_text.length > 200) return t('validation.correctionTextLength');
    if (it.explanation && it.explanation.length > 300) return t('validation.correctionExplanationLength');
    if (!diaryContent.includes(it.original_text)) return t('validation.correctionOriginalMustExist');
  }
  return null;
}

// 모국어 → 학습 언어 (명세: 학습 언어는 반대 언어로 계산)
export const learningLang = (nativeLang) => (nativeLang === 'ko' ? 'ja' : 'ko');
