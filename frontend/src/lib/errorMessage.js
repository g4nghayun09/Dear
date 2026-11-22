import { ApiError } from './api/client';
import { t } from './i18n';

// 서버 오류 → 사용자 문구 (명세 E-7: 오류 문구 변환은 이 파일 하나에서만)
const CODE_KEYS = {
  ALREADY_MATCHED: 'error.alreadyMatched',
  NO_ACTIVE_MATCH: 'error.noActiveMatch',
  NOT_PARTNER_DIARY: 'error.notPartnerDiary',
  MATCH_ENDED: 'error.matchEnded',
  ALREADY_CORRECTED: 'error.alreadyCorrected',
  INVALID_INPUT: 'error.invalidInput',
  DICTIONARY_UNAVAILABLE: 'error.dictionaryUnavailable',
  NICKNAME_DUPLICATED: 'error.nicknameDuplicated',
  VOCAB_DUPLICATED: 'error.vocabDuplicated',
  LOGIN_FAILED: 'error.loginFailed',
  NETWORK_ERROR: 'error.networkError',
  TIMEOUT: 'error.timeout',
};

// 409(중복)는 어디서 났는지에 따라 문구가 다름
const CONFLICT_KEYS = {
  profile: CODE_KEYS.NICKNAME_DUPLICATED,
  vocab: CODE_KEYS.VOCAB_DUPLICATED,
};

/**
 * @param {unknown} error
 * @param {'profile'|'vocab'} [context] 409 문구를 고를 때 사용
 */
export function errorMessage(error, context) {
  if (error instanceof ApiError) {
    if (error.code && CODE_KEYS[error.code]) return t(CODE_KEYS[error.code]);
    if (error.status === 409) return t(CONFLICT_KEYS[context] ?? 'error.duplicated');
    if (error.status === 401) return t('error.sessionExpired');
    if (error.status === 403) return t('error.forbidden');
    if (error.status === 404) return t('error.notFound');
    if (error.status === 400) return t(CODE_KEYS.INVALID_INPUT);
    if (error.status === 502) return t(CODE_KEYS.DICTIONARY_UNAVAILABLE);
    if (error.status >= 500) return t('error.serverError');
  }
  return t('error.generic');
}
