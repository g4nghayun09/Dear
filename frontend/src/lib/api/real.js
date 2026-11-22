import { request, ApiError } from './client';

// 서버 응답(UserResponse: userId, email, nickname, nativeLang, signupStep)
// → 앱에서 쓰는 프로필 모양(id, nickname, native_lang). 가입이 끝나지 않았으면 null
function toProfile(user) {
  if (!user || user.signupStep !== 'DONE') return null;
  return { id: user.userId, email: user.email, nickname: user.nickname, native_lang: user.nativeLang };
}

/*
 * Spring 주소 (명세 API ID 기준)
 * 주소가 바뀌면 이 파일만 고치면 됨. 인증: 로그인 후 모든 요청에 Authorization: Bearer <JWT>
 *
 * API-001 POST   /auth/google                    { idToken } → { token, user }
 * API-003 POST   /auth/logout
 * API-004 PATCH  /users/me/nickname              { nickname }      (가입 1단계)
 *         PATCH  /users/me/native-lang           { nativeLang }    (가입 2단계)
 * API-005 GET    /users/me                       → user (signupStep: NICKNAME | LANGUAGE | DONE)
 *
 * API-009 POST   /diaries                       { title, content } → 일기 (매칭은 서버가 내 활성 매칭으로 찾음)
 * API-010 GET    /diaries?matchId=&offset=&limit=20  → 일기 배열 (offset은 limit의 배수)
 * API-011 GET    /diaries/{id}                   → 일기
 *         GET    /diaries/calendar?month=2026-11 → { month, days: [내가 쓴 날짜] }
 *
 * (아래는 서버 구현 전 — 경로는 가안)
 * API-006 POST   /api/matches                    → { status, match }
 * API-007 GET    /api/matches/me                 → { status, match_id, partner, started_at }
 * API-008 POST   /api/matches/me/end             { rating }
 * API-019 GET    /api/matches/past
 * API-018 POST   /api/diaries/{id}/read
 * API-012 POST   /api/diaries/{id}/corrections   { items }
 * API-013 GET    /api/dictionary?q=&from=
 * API-014 POST   /api/vocab
 * API-015 GET    /api/vocab?source=
 * API-016 DELETE /api/vocab/{id}
 * API-017 PATCH  /api/vocab/{id}
 */
// 서버 일기(camelCase) → 앱에서 쓰는 모양
function toDiary(d) {
  return {
    id: d.diaryId, match_id: d.matchId, author_id: d.authorId, mine: d.mine, title: d.title,
    language: d.language, content: d.content, status: d.status,
    created_at: d.createdAt, corrected_at: d.correctedAt, read_at: d.readAt,
  };
}

export const realApi = {
  // ---- 인증·프로필 ----
  // 구글 ID 토큰을 서버에 보내고 우리 서비스의 JWT 를 받는다
  async loginWithGoogle(idToken) {
    const res = await request('/auth/google', { method: 'POST', body: { idToken }, auth: false });
    if (!res?.token) throw new ApiError(401, 'no token', 'LOGIN_FAILED');
    return res.token;
  },
  logout: () => request('/auth/logout', { method: 'POST' }),
  // 닉네임 → 모국어 순서로 저장. 이미 닉네임만 저장된 상태에서 다시 시도해도 안전
  async createProfile({ nickname, native_lang }) {
    await request('/users/me/nickname', { method: 'PATCH', body: { nickname } });
    const user = await request('/users/me/native-lang', { method: 'PATCH', body: { nativeLang: native_lang } });
    return toProfile(user);
  },
  // null 이면 가입이 끝나지 않은 사용자 → 가입하기 화면
  async getMyProfile() {
    return toProfile(await request('/users/me'));
  },

  // ---- 매칭 ----
  requestMatch: () => request('/api/matches', { method: 'POST' }),
  getMyMatch: () => request('/api/matches/me'),
  cancelWaiting: () => request('/api/matches/queue', { method: 'DELETE' }), // API-020 매칭 대기 취소
  endMatch: (rating = null) => request('/api/matches/me/end', { method: 'POST', body: { rating } }),
  getPastMatches: () => request('/api/matches/past'),

  // ---- 일기 ----
  async sendDiary({ title, content }) {
    return toDiary(await request('/diaries', { method: 'POST', body: { title: title || null, content } }));
  },
  async getDiaries(matchId, { offset = 0, limit = 20 } = {}) {
    return (await request('/diaries', { query: { matchId, offset, limit } })).map(toDiary);
  },
  async getDiary(id) {
    return toDiary(await request(`/diaries/${id}`));
  },
  // month: '2026-11' → { month, days: [1, 2, ...] } (내가 일기를 쓴 날)
  getDiaryCalendar: (month) => request('/diaries/calendar', { query: { month } }),
  markDiaryRead: (id) => request(`/api/diaries/${id}/read`, { method: 'POST' }),

  // ---- 첨삭 ----
  submitCorrections: (diaryId, items) =>
    request(`/api/diaries/${diaryId}/corrections`, { method: 'POST', body: { items } }),

  // ---- 단어장·학습 ----
  searchDictionary: (q, from) => request('/api/dictionary', { query: { q, from } }),
  saveVocab: (item) => request('/api/vocab', { method: 'POST', body: item }),
  getVocab: (source) => request('/api/vocab', { query: { source } }), // source: 'correction' | 'study'(검색+직접추가) | 없음
  deleteVocab: (id) => request(`/api/vocab/${id}`, { method: 'DELETE' }),
  updateVocabStudy: (id, { study_count, is_mastered, last_studied_at }) =>
    request(`/api/vocab/${id}`, { method: 'PATCH', body: { study_count, is_mastered, last_studied_at } }),
};
