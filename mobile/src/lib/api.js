// Spring 서버 호출 공통 함수 (API 명세서 v3 기준)
// 서버 주소는 .env 의 EXPO_PUBLIC_API_URL 에서 읽습니다. 예: http://192.168.0.12:8080
import { getToken } from './auth';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080';

// [개발용] 로그인 기능 완성 전 테스트용 사용자 번호.
// 값이 있으면 서버에 X-User-Id 헤더를 보내 그 사용자로 동작합니다. (서버 .env 의 DEV_AUTH=true 일 때만)
// 기본값은 .env 의 EXPO_PUBLIC_DEV_USER_ID, 앱 안에서는 setDevUserId()로 폰마다 바꿀 수 있습니다.
let devUserId = __DEV__ ? (process.env.EXPO_PUBLIC_DEV_USER_ID || null) : null;

export function setDevUserId(id) {
  devUserId = __DEV__ && id ? String(id) : null;
}

export function getDevUserId() {
  return devUserId;
}

// 서버가 { code, message, fieldErrors } 로 보낸 오류를 담는 객체
export class ApiError extends Error {
  constructor(status, body) {
    super(body?.message ?? '서버와 연결하지 못했어요');
    this.status = status;
    this.code = body?.code ?? 'NETWORK_ERROR';
    this.fieldErrors = body?.fieldErrors ?? [];
  }
}

// asUser: [개발용] 이 요청만 다른 테스트 사용자로 보냄 (시연 화면에서 사용)
export async function request(path, { method = 'GET', body, auth = true, asUser } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const devId = __DEV__ && asUser ? String(asUser) : devUserId;
    if (devId) headers['X-User-Id'] = devId;
  }

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, null); // 서버가 꺼져 있거나 Wi-Fi가 다름
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

// ── API 목록 (API ID는 명세서와 같음) ──
export const api = {
  googleLogin: (idToken) => request('/api/auth/google', { method: 'POST', body: { idToken }, auth: false }), // API-001
  setProfile: (nickname, nativeLang) => request('/api/users/me/profile', { method: 'PUT', body: { nickname, nativeLang } }), // API-004
  getMe: () => request('/api/users/me'), // API-005

  requestMatch: () => request('/api/matches', { method: 'POST' }), // API-006
  getMyMatch: () => request('/api/matches/me'), // API-007
  endMatch: () => request('/api/matches/me/end', { method: 'POST' }), // API-008
  cancelWaiting: () => request('/api/matches/queue', { method: 'DELETE' }), // API-020
  getMatchHistory: (page = 0) => request(`/api/matches/history?page=${page}&size=20`), // API-019

  sendDiary: (title, content) => request('/api/diaries', { method: 'POST', body: { title, content } }), // API-009
  getDiaries: (matchId, page = 0) => request(`/api/matches/${matchId}/diaries?page=${page}&size=20`), // API-010
  getDiary: (diaryId) => request(`/api/diaries/${diaryId}`), // API-011
  markDiaryRead: (diaryId) => request(`/api/diaries/${diaryId}/read`, { method: 'POST' }), // API-018

  submitCorrections: (diaryId, items) => request(`/api/diaries/${diaryId}/corrections`, { method: 'POST', body: { items } }), // API-012

  searchDictionary: (q, from) => request(`/api/dictionary?q=${encodeURIComponent(q)}&from=${from}`), // API-013
  saveWord: (word) => request('/api/words', { method: 'POST', body: word }), // API-014
  getWords: (source, page = 0) => request(`/api/words?page=${page}&size=20${source ? `&source=${source}` : ''}`), // API-015
  deleteWord: (wordId) => request(`/api/words/${wordId}`, { method: 'DELETE' }), // API-016
  studyWord: (wordId, correct, mastered) => request(`/api/words/${wordId}/study`, { method: 'PATCH', body: { correct, mastered } }), // API-017
};

// ── [개발용] 기능 시연 화면 전용 (서버 DEV_AUTH=true 일 때만 동작) ──
export const devApi = {
  prepareTestUsers: () => request('/api/dev/test-users', { method: 'POST', auth: false }),
  languageCheck: (content, lang) => request('/api/dev/language-check', { method: 'POST', body: { content, lang }, auth: false }),
  requestMatchAs: (userId) => request('/api/matches', { method: 'POST', asUser: userId }),
  getMyMatchAs: (userId) => request('/api/matches/me', { asUser: userId }),
  cancelWaitingAs: (userId) => request('/api/matches/queue', { method: 'DELETE', asUser: userId }),
  endMatchAs: (userId) => request('/api/matches/me/end', { method: 'POST', asUser: userId }),
};
