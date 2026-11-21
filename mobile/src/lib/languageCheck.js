// FR-010 학습 언어 입력 제한 (담당: 강태인)
// 입력을 막지 않고, 허용되지 않는 글자를 찾아서 전송만 막는 데 씁니다.
// 서버(demo/.../language/LanguageValidator.java)도 같은 규칙으로 한 번 더 검사합니다.
// 규칙을 바꾸면 두 파일을 함께 고치세요.

export const MAX_LENGTH = 1000;
export const MIN_LINES = 2;

const ALLOWED = {
  // 히라가나, 가타카나, 한자, 반각 가타카나, 일본어 문장부호
  ja: /[぀-ゟ゠-ヿㇰ-ㇿ㐀-䶿一-鿿ｦ-ﾟ　-〿]/,
  // 완성형 한글 + 자모(입력 중간에 생기는 ㄱ, ㅏ 등)
  ko: /[가-힣ᄀ-ᇿ㄰-㆏]/,
};

// 두 언어 공통 허용: 숫자, 공백·줄바꿈, 기본 문장부호
const COMMON = /[0-9０-９\s.,!?'"()~…！？（）・：；\-]/;

export function languageName(lang) {
  return lang === 'ja' ? '일본어' : '한국어';
}

// 모국어 → 학습 언어
export function learningLangOf(nativeLang) {
  return nativeLang === 'ko' ? 'ja' : 'ko';
}

export function findInvalidChars(text, lang) {
  const invalid = new Set();
  for (const ch of text) {
    if (!ALLOWED[lang].test(ch) && !COMMON.test(ch)) invalid.add(ch);
  }
  return [...invalid];
}

// 내용 있는 줄 수 (본문 2줄 이상 규칙)
export function countLines(text) {
  return text.split('\n').filter((line) => line.trim() !== '').length;
}

// 일기 본문 검사 결과를 한 번에 돌려줍니다. message는 화면에 보여 줄 안내 문구(문제 없으면 null)
export function checkDiaryInput(content, lang) {
  const invalidChars = findInvalidChars(content, lang);
  const lines = countLines(content);
  const length = [...content].length;

  let message = null;
  if (invalidChars.length > 0) {
    message = `${languageName(lang)}로만 작성할 수 있어요 (사용할 수 없는 글자: ${invalidChars.slice(0, 5).join(' ')})`;
  } else if (length > MAX_LENGTH) {
    message = `${MAX_LENGTH}자 이하로 써 주세요`;
  } else if (content.trim() !== '' && lines < MIN_LINES) {
    message = `${MIN_LINES}줄 이상 써 주세요`;
  }

  return {
    invalidChars,
    lines,
    length,
    message,
    canSend: invalidChars.length === 0 && lines >= MIN_LINES && length <= MAX_LENGTH,
  };
}

export function canSendDiary(content, lang) {
  return checkDiaryInput(content, lang).canSend;
}
