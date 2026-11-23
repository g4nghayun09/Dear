import { ApiError } from './client';
import { getJSON, setJSON, removeKey } from '../tokenStorage';
import { learningLang } from '../validation';
import { MIN_LINES, checkDiaryInput, meetsServerLength } from '../languageCheck';

// 서버 없이 화면을 만들 때 쓰는 가짜 API. real.js 와 같은 함수·같은 응답 모양
// 프로필만 기기에 저장, 나머지는 앱을 다시 켜면 초기화됨

const PROFILE_KEY = 'dear.mock.profile';
const TAKEN_NICKNAMES = ['디어', 'dear', 'admin'];
const ME = 'me-0000';

const wait = (ms = 400) => new Promise((r) => setTimeout(r, ms));
const now = () => new Date().toISOString();
const uid = () => Math.random().toString(16).slice(2, 10) + '-' + Date.now().toString(16);
const fail = (status, code) => {
  throw new ApiError(status, code, code);
};

const db = {
  waiting: false, // 매칭 신청 → 대기 → 다음 상태 조회 때 상대가 생긴 것으로 처리
  match: null, // 활성 매칭
  pastMatches: [],
  diaries: [],
  corrections: [],
  vocab: [],
};

// 사전 검색 화면 확인용 샘플 단어
const DICTIONARY = [
  { ja: '白い', reading: 'しろい', ko: '하얗다' },
  { ja: '今日', reading: 'きょう', ko: '오늘' },
  { ja: '放課後', reading: 'ほうかご', ko: '방과 후' },
  { ja: '友達', reading: 'ともだち', ko: '친구' },
  { ja: '音楽', reading: 'おんがく', ko: '음악' },
  { ja: '天気', reading: 'てんき', ko: '날씨' },
  { ja: '学校', reading: 'がっこう', ko: '학교' },
  { ja: '寒い', reading: 'さむい', ko: '춥다' },
  { ja: '楽しい', reading: 'たのしい', ko: '즐겁다' },
  { ja: '明日', reading: 'あした', ko: '내일' },
  { ja: '空', reading: 'そら', ko: '하늘' },
  { ja: '嬉しい', reading: 'うれしい', ko: '기쁘다' },
];

function partnerFor(lang) {
  return lang === 'ko' ? { nickname: 'はると', native_lang: 'ja' } : { nickname: '민지', native_lang: 'ko' };
}

function seedDiary(match, lang) {
  // 상대가 먼저 쓴 일기 하나 (상대의 학습 언어 = 나의 모국어로 쓰여 있음 → 내가 첨삭할 수 있음)
  const content =
    lang === 'ko'
      ? '오늘은 친구랑 한강에 갔어요.\n라면을 먹었어요.'
      : '今日は放課後に友達とカフェに行きました。\nケーキがとてもおいしかったです。';
  db.diaries.push({
    id: uid(), match_id: match.id, author_id: 'partner', title: null, content,
    status: 'sent', created_at: now(), corrected_at: null, read_at: null,
  });
}

async function myProfile() {
  return getJSON(PROFILE_KEY);
}

export const mockApi = {
  // ---- 인증·프로필 ----
  async loginWithGoogle() {
    await wait(600);
    return 'mock-jwt-token';
  },
  async logout() {
    await removeKey(PROFILE_KEY); // 로그아웃하면 가입 화면부터 다시 볼 수 있게
    Object.assign(db, { waiting: false, match: null, pastMatches: [], diaries: [], corrections: [], vocab: [] });
    return null;
  },
  async createProfile({ nickname, native_lang }) {
    await wait();
    if (TAKEN_NICKNAMES.includes(nickname.toLowerCase())) fail(409, 'NICKNAME_DUPLICATED');
    if (!['ko', 'ja'].includes(native_lang)) fail(400, 'INVALID_INPUT');
    const profile = { id: ME, nickname, native_lang, created_at: now() };
    await setJSON(PROFILE_KEY, profile);
    return profile;
  },
  async getMyProfile() {
    await wait(250);
    return myProfile();
  },

  // ---- 매칭 ----
  async requestMatch() {
    await wait();
    if (db.match) fail(400, 'ALREADY_MATCHED');
    db.waiting = true;
    return { status: 'waiting', match: null };
  },
  async getMyMatch() {
    await wait(250);
    if (db.waiting) {
      const me = await myProfile();
      db.waiting = false;
      db.match = { id: uid(), partner: partnerFor(me.native_lang), started_at: now() };
      seedDiary(db.match, me.native_lang);
      return { status: 'waiting', match_id: null, partner: null, started_at: null };
    }
    if (db.match) return { status: 'matched', match_id: db.match.id, partner: db.match.partner, started_at: db.match.started_at };
    return { status: 'none', match_id: null, partner: null, started_at: null };
  },
  async cancelWaiting() {
    await wait(250);
    if (!db.waiting) fail(409, 'NOT_WAITING');
    db.waiting = false;
    return null;
  },
  async endMatch(rating = null) {
    await wait();
    if (rating !== null && (rating < 1 || rating > 5)) fail(400, 'INVALID_INPUT');
    if (!db.match) fail(400, 'NO_ACTIVE_MATCH');
    const ended_at = now();
    db.pastMatches.unshift({ ...db.match, ended_at });
    const match_id = db.match.id;
    db.match = null;
    return { match_id, ended_at, rated: rating !== null };
  },
  async getPastMatches() {
    await wait(250);
    return db.pastMatches.map((m) => ({
      match_id: m.id, partner: m.partner, started_at: m.started_at, ended_at: m.ended_at,
      diary_count: db.diaries.filter((d) => d.match_id === m.id).length,
    }));
  },

  // ---- 일기 ----
  async sendDiary({ title, content }) {
    await wait();
    const me = await myProfile();
    if (!me) fail(400, 'INVALID_INPUT');
    if (title && title.length > 30) fail(400, 'INVALID_INPUT');
    if (!content || !meetsServerLength(content)) fail(400, 'INVALID_INPUT');
    const language = learningLang(me.native_lang);
    const check = checkDiaryInput(content, language, MIN_LINES); // 분량은 위에서 서버 규칙으로 검사함
    if (check.invalidChars.length > 0) fail(400, 'INVALID_LANGUAGE');
    if (!check.canSend) fail(400, 'INVALID_INPUT');
    // 서버 없이 화면을 확인할 수 있게, 활성 매칭이 없으면 가짜 매칭을 바로 만들어 준다
    if (!db.match) {
      db.match = { id: uid(), partner: partnerFor(me.native_lang), started_at: now() };
    }
    const diary = {
      id: uid(), match_id: db.match.id, author_id: ME, mine: true, title: title || null, language, content,
      status: 'sent', created_at: now(), corrected_at: null, read_at: null,
    };
    db.diaries.push(diary);
    return diary;
  },
  // month: '2026-11' → 내가 쓴 날짜(일)
  async getDiaryCalendar(month) {
    await wait(150);
    const days = [...new Set(
      db.diaries
        .filter((d) => d.author_id === ME && d.created_at.startsWith(month))
        .map((d) => new Date(d.created_at).getDate()),
    )].sort((x, y) => x - y);
    return { month, days };
  },
  async getDiaries(matchId, { offset = 0, limit = 20 } = {}) {
    await wait(250);
    return db.diaries
      .filter((d) => d.match_id === matchId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(offset, offset + limit);
  },
  async getDiary(id) {
    await wait(250);
    const d = db.diaries.find((x) => x.id === id);
    if (!d) fail(404, 'NOT_FOUND');
    const active = db.match?.id === d.match_id;
    return { ...d, match_status: active ? 'active' : 'ended', corrections: db.corrections.filter((c) => c.diary_id === id) };
  },
  async markDiaryRead(id) {
    await wait(150);
    const d = db.diaries.find((x) => x.id === id);
    if (!d || d.author_id === ME) fail(403, 'NOT_PARTNER_DIARY');
    d.read_at = d.read_at ?? now();
    return { read_at: d.read_at };
  },

  // ---- 첨삭 ----
  async submitCorrections(diaryId, items) {
    await wait();
    const d = db.diaries.find((x) => x.id === diaryId);
    if (!d || d.author_id === ME) fail(403, 'NOT_PARTNER_DIARY');
    if (db.match?.id !== d.match_id) fail(400, 'MATCH_ENDED');
    if (d.status === 'corrected') fail(400, 'ALREADY_CORRECTED');
    if (!Array.isArray(items) || items.length > 20) fail(400, 'INVALID_INPUT');
    for (const it of items) {
      if (!it.original_text || !it.corrected_text || !d.content.includes(it.original_text)) fail(400, 'INVALID_INPUT');
    }
    const created_at = now();
    items.forEach((it) =>
      db.corrections.push({ id: uid(), diary_id: diaryId, original_text: it.original_text, corrected_text: it.corrected_text, explanation: it.explanation || null, created_at }),
    );
    d.status = 'corrected';
    d.corrected_at = created_at;
    return { diary_id: diaryId, status: 'corrected', corrected_at: created_at, count: items.length };
  },

  // ---- 단어장·학습 ----
  // from: 결과 단어의 언어(학습 언어). 'ja' 면 일본어 단어를 한국어 뜻으로 찾는다
  async searchDictionary(q, from) {
    await wait(250);
    const query = (q ?? '').trim();
    const rows = DICTIONARY.filter((w) => !query || w.ko.includes(query) || w.ja.includes(query));
    const results = rows.slice(0, 20).map((w) =>
      from === 'ja'
        ? { term: w.ja, reading: w.reading, meaning: w.ko }
        : { term: w.ko, reading: null, meaning: w.ja },
    );
    return { results };
  },
  async saveVocab(item) {
    await wait();
    if (db.vocab.some((v) => v.term === item.term)) fail(409, 'VOCAB_DUPLICATED');
    if (!item.term || !item.meaning || !['search', 'manual', 'correction'].includes(item.source)) fail(400, 'INVALID_INPUT');
    if (item.source === 'correction' && !item.correction_id) fail(400, 'INVALID_INPUT');
    const v = {
      id: uid(), term: item.term, reading: item.reading ?? null, meaning: item.meaning,
      wrong_text: item.wrong_text ?? null, source: item.source, correction_id: item.correction_id ?? null,
      study_count: 0, is_mastered: false, last_studied_at: null, created_at: now(),
    };
    db.vocab.unshift(v);
    return v;
  },
  async getVocab(source) {
    await wait(250);
    if (source === 'correction') return db.vocab.filter((v) => v.source === 'correction');
    if (source === 'study') return db.vocab.filter((v) => v.source !== 'correction');
    return [...db.vocab];
  },
  async deleteVocab(id) {
    await wait(200);
    db.vocab = db.vocab.filter((v) => v.id !== id);
    return null;
  },
  async updateVocabStudy(id, patch) {
    await wait(200);
    const v = db.vocab.find((x) => x.id === id);
    if (!v) fail(404, 'NOT_FOUND');
    Object.assign(v, patch);
    return v;
  },
};
