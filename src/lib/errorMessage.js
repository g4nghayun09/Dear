import { ApiError } from './api/client';

// 서버 오류 → 사용자 문구 (명세 E-7: 오류 문구 변환은 이 파일 하나에서만)
const CODE_MESSAGES = {
  ALREADY_MATCHED: '이미 교환 중인 상대가 있어요.',
  NO_ACTIVE_MATCH: '교환 상대가 없어요.',
  NOT_PARTNER_DIARY: '첨삭할 수 없는 일기예요.',
  MATCH_ENDED: '끝난 교환일기는 첨삭할 수 없어요.',
  ALREADY_CORRECTED: '이미 첨삭된 일기예요.',
  INVALID_INPUT: '입력한 내용을 다시 확인해 주세요.',
  DICTIONARY_UNAVAILABLE: '사전 검색이 잠시 안 돼요. 직접 추가해 주세요.',
  NICKNAME_DUPLICATED: '이미 사용 중인 닉네임이에요.',
  VOCAB_DUPLICATED: '이미 단어장에 있는 단어예요.',
  LOGIN_FAILED: '구글 로그인에 실패했어요. 다시 시도해 주세요.',
  NETWORK_ERROR: '서버에 연결할 수 없어요. 네트워크를 확인해 주세요.',
  TIMEOUT: '서버 응답이 너무 늦어요. 잠시 후 다시 시도해 주세요.',
};

// 409(중복)는 어디서 났는지에 따라 문구가 다름
const CONFLICT_MESSAGES = {
  profile: CODE_MESSAGES.NICKNAME_DUPLICATED,
  vocab: CODE_MESSAGES.VOCAB_DUPLICATED,
};

/**
 * @param {unknown} error
 * @param {'profile'|'vocab'} [context] 409 문구를 고를 때 사용
 */
export function errorMessage(error, context) {
  if (error instanceof ApiError) {
    if (error.code && CODE_MESSAGES[error.code]) return CODE_MESSAGES[error.code];
    if (error.status === 409) return CONFLICT_MESSAGES[context] ?? '이미 등록되어 있어요.';
    if (error.status === 401) return '로그인이 만료됐어요. 다시 로그인해 주세요.';
    if (error.status === 403) return '권한이 없어요.';
    if (error.status === 404) return '찾을 수 없어요.';
    if (error.status === 400) return CODE_MESSAGES.INVALID_INPUT;
    if (error.status === 502) return CODE_MESSAGES.DICTIONARY_UNAVAILABLE;
    if (error.status >= 500) return '서버에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.';
  }
  return '문제가 생겼어요. 다시 시도해 주세요.';
}
