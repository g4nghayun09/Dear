import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { API_URL } from '../config';
import { request, ApiError } from './client';

// 구글 로그인 후 서버가 돌려보낼 앱 주소 (빌드 앱: dear://auth/callback, Expo Go: exp://…/--/auth/callback)
export const redirectUri = Linking.createURL('auth/callback');

export function tokenFromUrl(url) {
  const { queryParams } = Linking.parse(url);
  if (queryParams?.error) throw new ApiError(401, String(queryParams.error), 'LOGIN_FAILED');
  return queryParams?.token ? String(queryParams.token) : null;
}

/*
 * Spring 주소 (명세 API ID 기준)
 * 주소가 바뀌면 이 파일만 고치면 됨
 *
 * API-001 GET    /oauth2/authorization/google?redirect_uri=   → redirect_uri?token=JWT
 * API-003 POST   /api/auth/logout
 * API-004 POST   /api/profiles                   { nickname, native_lang }
 * API-005 GET    /api/profiles/me                → 프로필 | null
 * API-006 POST   /api/matches                    → { status, match }
 * API-007 GET    /api/matches/me                 → { status, match_id, partner, started_at }
 * API-008 POST   /api/matches/me/end             { rating }
 * API-019 GET    /api/matches/past
 * API-009 POST   /api/diaries                    { match_id, title, content }
 * API-010 GET    /api/diaries?match_id=&offset=&limit=20
 * API-011 GET    /api/diaries/{id}               → 일기 + corrections + match_status
 * API-018 POST   /api/diaries/{id}/read
 * API-012 POST   /api/diaries/{id}/corrections   { items }
 * API-013 GET    /api/dictionary?q=&from=
 * API-014 POST   /api/vocab
 * API-015 GET    /api/vocab?source=
 * API-016 DELETE /api/vocab/{id}
 * API-017 PATCH  /api/vocab/{id}
 */
export const realApi = {
  // ---- 인증·프로필 ----
  async loginWithGoogle() {
    const url = `${API_URL}/oauth2/authorization/google?redirect_uri=${encodeURIComponent(redirectUri)}`;
    const result = await WebBrowser.openAuthSessionAsync(url, redirectUri);
    if (result.type !== 'success') return null; // 창을 닫음 → P-002 유지
    const token = tokenFromUrl(result.url);
    if (!token) throw new ApiError(401, 'no token', 'LOGIN_FAILED');
    return token;
  },
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  createProfile: ({ nickname, native_lang }) =>
    request('/api/profiles', { method: 'POST', body: { nickname, native_lang } }),
  async getMyProfile() {
    try {
      return (await request('/api/profiles/me')) ?? null;
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null; // 서버가 404로 줘도 처음 로그인으로 처리
      throw e;
    }
  },

  // ---- 매칭 ----
  requestMatch: () => request('/api/matches', { method: 'POST' }),
  getMyMatch: () => request('/api/matches/me'),
  endMatch: (rating = null) => request('/api/matches/me/end', { method: 'POST', body: { rating } }),
  getPastMatches: () => request('/api/matches/past'),

  // ---- 일기 ----
  sendDiary: ({ match_id, title, content }) =>
    request('/api/diaries', { method: 'POST', body: { match_id, title: title || null, content } }),
  getDiaries: (matchId, { offset = 0, limit = 20 } = {}) =>
    request('/api/diaries', { query: { match_id: matchId, offset, limit } }),
  getDiary: (id) => request(`/api/diaries/${id}`),
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
