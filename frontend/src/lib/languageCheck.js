// FR-010 학습 언어 입력 제한 (담당: 강태인)
// 입력은 막지 않고(IME 조합 중 글자가 깨지지 않게), 허용되지 않는 글자를 찾아 "보내기"만 막는 데 씁니다.
// 서버(backend/dear/.../language/LanguageValidator.java)도 같은 규칙으로 한 번 더 검사합니다.
// 규칙을 바꾸면 두 파일을 함께 고치세요.
import { DIARY_CONTENT_MAX, DIARY_MIN_LINES, countTextLines, learningLang } from './validation';

export const MAX_LENGTH = DIARY_CONTENT_MAX; // 1000
export const MIN_LINES = DIARY_MIN_LINES; // 2 (화면에 보이는 줄 기준)
// 서버는 화면 줄 수를 알 수 없어서 "엔터 2줄 이상 또는 20자 이상"으로 검사한다 (2줄이 넘칠 만큼 쓴 글은 20자를 넘음)
export const MIN_CHARS = 20;
export { learningLang };

const ALLOWED = {
  // 히라가나, 가타카나(확장 포함), 한자(확장 A 포함), 반각 가타카나, 일본어 문장부호(、。「」 등)
  ja: /[぀-ゟ゠-ヿㇰ-ㇿ㐀-䶿一-鿿ｦ-ﾟ　-〿]/,
  // 완성형 한글 + 자모(입력 중간에 생기는 ㄱ, ㅏ 등)
  ko: /[가-힣ᄀ-ᇿ㄰-㆏]/,
};

// 두 언어 공통 허용: 숫자(전각 포함), 공백·줄바꿈, 기본 문장부호
const COMMON = /[0-9０-９\s.,!?'"()~…！？（）・：；\-]/;

export function findInvalidChars(text, lang) {
  const invalid = new Set();
  for (const ch of text ?? '') {
    if (!ALLOWED[lang].test(ch) && !COMMON.test(ch)) invalid.add(ch);
  }
  return [...invalid];
}

/** 서버(LanguageValidator)와 같은 분량 규칙: 엔터로 2줄 이상 또는 20자 이상 */
export function meetsServerLength(content) {
  const text = content ?? '';
  return countTextLines(text) >= MIN_LINES || [...text.trim()].length >= MIN_CHARS;
}

/**
 * 일기 본문 검사 결과
 * problem: 'invalid_chars' | 'too_long' | 'too_few_lines' | null
 * canSend: 보내기 버튼을 켜도 되는지
 */
// visualLines: 입력칸에 실제로 보이는 줄 수 (긴 문장이 자동으로 넘어간 줄 포함). 없으면 엔터 줄 수만 셈
export function checkDiaryInput(content, lang, visualLines = 0) {
  const text = content ?? '';
  const invalidChars = findInvalidChars(text, lang);
  const lines = text.trim() === '' ? 0 : Math.max(countTextLines(text), visualLines);
  const length = [...text].length;

  let problem = null;
  if (invalidChars.length > 0) problem = 'invalid_chars';
  else if (length > MAX_LENGTH) problem = 'too_long';
  else if (text.trim() !== '' && lines < MIN_LINES) problem = 'too_few_lines';

  return {
    invalidChars,
    lines,
    length,
    problem,
    canSend: invalidChars.length === 0 && lines >= MIN_LINES && length <= MAX_LENGTH,
  };
}
