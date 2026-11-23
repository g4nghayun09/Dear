// [개발용] 기능 시연 화면 (담당: 강태인)
// 1:1 매칭(FR-006~008)과 학습 언어 입력 제한(FR-010)이 서버와 함께 제대로 동작하는지 폰 한 대로 보여 줍니다.
// 필요 조건: 서버 backend/dear/.env 의 DEV_AUTH=true, 앱 .env 의 EXPO_PUBLIC_API_URL, 개발 모드(Expo Go)
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import LanguageCheckNotice from '../components/LanguageCheckNotice';
import { request } from '../lib/api/client';
import { USE_MOCK } from '../lib/config';
import { getDevUserId, setDevUserId } from '../lib/devUser';
import useDiaryInputCheck from '../lib/useDiaryInputCheck';
import { colors, radius } from '../lib/theme';

const OK = '#3B7D4F';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// 시연 전용 API. asUser = 이 요청만 해당 테스트 사용자로 보냄 (X-User-Id)
const devApi = {
  prepareTestUsers: () => request('/api/dev/test-users', { method: 'POST', auth: false }),
  languageCheck: (content, lang) => request('/api/dev/language-check', { method: 'POST', body: { content, lang }, auth: false }),
  requestMatchAs: (id) => request('/api/matches', { method: 'POST', asUser: id }),
  getMyMatchAs: (id) => request('/api/matches/me', { asUser: id }),
  cancelWaitingAs: (id) => request('/api/matches/queue', { method: 'DELETE', asUser: id }),
  endMatchAs: (id) => request('/api/matches/me/end', { method: 'POST', asUser: id }),
};

function summarize(res, err) {
  if (err) return `오류 ${err.status} ${err.code ?? ''}`;
  if (res === null || res === undefined) return '완료 (응답 본문 없음)';
  if (res.status === 'matched') return `matched · 상대: ${res.partner?.nickname} · 매칭 #${res.match_id}`;
  if (res.status) return res.status;
  if (res.ended_at) return `해제됨 · 매칭 #${res.match_id}`;
  return JSON.stringify(res);
}

// u = { ko1, ja, ko2 } 테스트 사용자 번호
const MATCH_STEPS = [
  {
    title: '민지(한국어)가 매칭 신청',
    expect: '대기열에 들어감 → waiting',
    run: (u) => devApi.requestMatchAs(u.ko1),
    check: (res) => res?.status === 'waiting',
  },
  {
    title: '지호(한국어)가 매칭 신청',
    expect: '같은 한국어끼리는 연결되지 않음 → waiting',
    run: (u) => devApi.requestMatchAs(u.ko2),
    check: (res) => res?.status === 'waiting',
  },
  {
    title: 'はると(일본어)가 매칭 신청',
    expect: '가장 오래 기다린 민지와 바로 연결 → matched',
    run: (u) => devApi.requestMatchAs(u.ja),
    check: (res) => res?.status === 'matched' && res.partner?.nickname === '민지',
  },
  {
    title: '민지의 매칭 상태 조회',
    expect: 'matched, 상대는 はると (이메일 등 개인정보는 안 보임)',
    run: (u) => devApi.getMyMatchAs(u.ko1),
    check: (res) => res?.status === 'matched' && res.partner?.nickname === 'はると' && !('email' in res.partner),
  },
  {
    title: '민지가 한 번 더 매칭 신청',
    expect: '이미 상대가 있어서 거절 → 409 ALREADY_MATCHED',
    run: (u) => devApi.requestMatchAs(u.ko1),
    check: (res, err) => err?.code === 'ALREADY_MATCHED',
  },
  {
    title: '지호가 대기 취소',
    expect: '대기열에서 빠짐 → 204',
    run: (u) => devApi.cancelWaitingAs(u.ko2),
    check: (res, err) => !err && res === null,
  },
  {
    title: '지호가 한 번 더 대기 취소',
    expect: '대기 중이 아님 → 409 NOT_WAITING',
    run: (u) => devApi.cancelWaitingAs(u.ko2),
    check: (res, err) => err?.code === 'NOT_WAITING',
  },
  {
    title: '민지가 매칭 해제',
    expect: '매칭 종료 (일기는 지워지지 않음)',
    run: (u) => devApi.endMatchAs(u.ko1),
    check: (res) => !!res?.ended_at,
  },
  {
    title: 'はると의 매칭 상태 조회',
    expect: '상대가 해제해서 → none (다시 매칭 신청 가능)',
    run: (u) => devApi.getMyMatchAs(u.ja),
    check: (res) => res?.status === 'none',
  },
];

const SAMPLES = {
  ja: [
    { label: '올바른 일본어', value: '今日は放課後に友達とカフェに行きました。\nケーキがとてもおいしかったです！' },
    { label: '한글이 섞임', value: '今日は학교に行きました。\nたのしかったです。' },
    { label: '1줄뿐', value: '今日は学校に行きました。' },
  ],
  ko: [
    { label: '올바른 한국어', value: '오늘은 친구랑 한강에 갔어요.\n라면이 정말 맛있었어요!' },
    { label: '한자가 섞임', value: '오늘은 学校에 갔어요.\n재밌었어요.' },
    { label: '1줄뿐', value: '오늘은 학교에 갔어요.' },
  ],
};

function connectionError(e) {
  if (e.code === 'BAD_RESPONSE') return '서버가 아닌 곳에서 응답이 왔어요. 앱 .env 의 EXPO_PUBLIC_API_URL 이 http:// 로 시작하는지 확인해 주세요. (예: http://localhost:8080)';
  if (e.status === 404 || e.status === 401) return '시연 API가 꺼져 있어요. backend/dear/.env 에 DEV_AUTH=true 를 넣고 서버를 다시 켜 주세요.';
  return `서버와 연결하지 못했어요 (${e.code ?? e.status}). 앱 .env 의 서버 주소와 Wi-Fi를 확인해 주세요.`;
}

export default function DevScreen() {
  if (!__DEV__) return <Redirect href="/" />;
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 4 }}>
          <Text style={styles.eyebrow}>개발용 · 담당 강태인</Text>
          <Text style={styles.title}>기능 시연</Text>
          <Text style={styles.desc}>1:1 매칭과 학습 언어 입력 제한이 서버와 함께 제대로 동작하는지 확인합니다.</Text>
        </View>

        {USE_MOCK && (
          <Text style={styles.error}>
            지금은 mock 모드예요(서버 없이 가짜 데이터). 시연하려면 앱 .env 에 EXPO_PUBLIC_API_URL=http://PC의IP:8080 을 넣고 Expo를 다시 켜 주세요.
          </Text>
        )}

        <MatchDemo />
        <LanguageDemo />
        <TestUserPanel />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── 1. 매칭 자동 시연 ──
function MatchDemo() {
  const [users, setUsers] = useState(null);
  const [results, setResults] = useState([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');

  const runAll = async () => {
    setRunning(true);
    setError('');
    setResults([]);
    try {
      const list = await devApi.prepareTestUsers(); // 테스트 사용자 준비 + 이전 시연 기록 초기화
      if (!Array.isArray(list)) {
        // 서버가 아닌 곳(주소 오류·mock 모드)에서 응답이 온 경우
        throw Object.assign(new Error('BAD_RESPONSE'), { code: 'BAD_RESPONSE' });
      }
      setUsers(list);
      const byEmail = Object.fromEntries(list.map((x) => [x.email, x.user_id]));
      const u = { ko1: byEmail['test.ko1@example.com'], ja: byEmail['test.ja1@example.com'], ko2: byEmail['test.ko2@example.com'] };

      for (const step of MATCH_STEPS) {
        let res;
        let err;
        try {
          res = await step.run(u);
        } catch (e) {
          err = e;
        }
        setResults((prev) => [...prev, { ok: step.check(res, err), summary: summarize(res, err) }]);
        await wait(500); // 한 단계씩 보이도록
      }
    } catch (e) {
      setError(connectionError(e));
    } finally {
      setRunning(false);
    }
  };

  const done = results.length === MATCH_STEPS.length;
  const passed = results.filter((r) => r.ok).length;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>1. 1:1 매칭</Text>
      <Text style={styles.cardDesc}>
        테스트 사용자 3명(민지·지호: 한국어, はると: 일본어)으로 신청 → 연결 → 중복 방지 → 취소 → 해제를 차례로 실행합니다.
      </Text>
      <Btn title={results.length ? '처음부터 다시 시연' : '자동 시연 시작'} onPress={runAll} loading={running} />
      {!!error && <Text style={styles.error}>{error}</Text>}
      {users && <Text style={styles.meta}>테스트 사용자: {users.map((x) => `${x.user_id}번 ${x.nickname}`).join(' · ')}</Text>}

      <View style={{ gap: 12 }}>
        {MATCH_STEPS.map((step, i) => {
          const r = results[i];
          return (
            <View key={step.title} style={styles.step}>
              <Text style={[styles.badge, r ? (r.ok ? styles.badgeOk : styles.badgeFail) : styles.badgeWait]}>
                {r ? (r.ok ? '통과' : '실패') : `${i + 1}`}
              </Text>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.meta}>기대: {step.expect}</Text>
                {r && <Text style={[styles.meta, { color: r.ok ? OK : colors.error }]}>결과: {r.summary}</Text>}
              </View>
            </View>
          );
        })}
      </View>

      {done && (
        <Text style={[styles.total, { color: passed === MATCH_STEPS.length ? OK : colors.error }]}>
          {MATCH_STEPS.length}단계 중 {passed}단계 통과
        </Text>
      )}
    </View>
  );
}

// ── 2. 학습 언어 입력 제한 시연 ──
function LanguageDemo() {
  const [lang, setLang] = useState('ja');
  const [content, setContent] = useState('');
  const [server, setServer] = useState(null);
  const [busy, setBusy] = useState(false);
  const check = useDiaryInputCheck(content, lang);
  const agree = useMemo(() => (server && !server.failed ? server.valid === check.canSend : null), [server, check.canSend]);

  const change = (value) => {
    setContent(value);
    setServer(null);
  };

  const askServer = async () => {
    setBusy(true);
    try {
      const res = await devApi.languageCheck(content, lang);
      if (!res || typeof res !== 'object') throw Object.assign(new Error('BAD_RESPONSE'), { code: 'BAD_RESPONSE' });
      setServer(res);
    } catch (e) {
      setServer({ failed: true, message: connectionError(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>2. 학습 언어 입력 제한</Text>
      <Text style={styles.cardDesc}>
        입력은 막지 않고, 학습 언어가 아닌 글자가 섞이거나 2줄이 안 되면 보내기를 막습니다. 앱과 서버가 같은 결과를 내는지 비교합니다.
      </Text>

      <View style={{ gap: 8 }}>
        {['ja', 'ko'].map((l) => (
          <Btn
            key={l}
            title={l === 'ja' ? '한국인 (일본어로 쓰기)' : '일본인 (한국어로 쓰기)'}
            variant={lang === l ? 'primary' : 'outline'}
            onPress={() => {
              setLang(l);
              change('');
            }}
          />
        ))}
      </View>

      <View style={styles.samples}>
        {SAMPLES[lang].map((s) => (
          <Btn key={s.label} title={s.label} variant="outline" small onPress={() => change(s.value)} />
        ))}
      </View>

      <TextInput
        value={content}
        onChangeText={change}
        multiline
        placeholder={lang === 'ja' ? '일본어로 일기를 써 보세요' : '한국어로 일기를 써 보세요'}
        placeholderTextColor={colors.placeholder}
        style={styles.input}
      />
      <LanguageCheckNotice lang={lang} check={check} />

      <View style={{ gap: 4 }}>
        <Text style={styles.meta}>
          앱 검사: <Text style={{ color: check.canSend ? OK : colors.error }}>{check.canSend ? '보낼 수 있음' : '보낼 수 없음'}</Text>
          {'  '}({check.lines}줄 · {check.length}자)
        </Text>
        {server && !server.failed && (
          <Text style={styles.meta}>
            서버 검사: <Text style={{ color: server.valid ? OK : colors.error }}>{server.valid ? '보낼 수 있음' : '보낼 수 없음'}</Text>
            {server.error_code ? `  (${server.error_code}: ${server.message})` : ''}
          </Text>
        )}
        {server?.failed && <Text style={styles.error}>{server.message}</Text>}
        {agree !== null && (
          <Text style={[styles.total, { color: agree ? OK : colors.error }]}>
            {agree ? '앱과 서버 결과가 같아요' : '앱과 서버 결과가 달라요 (규칙 확인 필요)'}
          </Text>
        )}
      </View>

      <Btn title="서버에서도 검사하기" variant="outline" onPress={askServer} loading={busy} />
    </View>
  );
}

// ── 3. 테스트 사용자로 매칭 화면 열기 (폰 두 대로 실제 화면 시연) ──
function TestUserPanel() {
  const [value, setValue] = useState(getDevUserId() ?? '');
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>3. 매칭 화면 직접 써 보기</Text>
      <Text style={styles.cardDesc}>
        폰마다 다른 테스트 사용자 번호를 넣고 매칭 화면을 열면, 로그인 없이 실제 P-005 화면으로 매칭할 수 있어요. (번호는 1번 시연에서 확인)
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput
          value={value}
          onChangeText={setValue}
          keyboardType="number-pad"
          placeholder="예: 1"
          placeholderTextColor={colors.placeholder}
          style={[styles.input, { flex: 1, minHeight: 44 }]}
        />
        <Btn
          title="매칭 화면 열기"
          small
          onPress={() => {
            setDevUserId(value.trim());
            router.push('/match');
          }}
        />
      </View>
    </View>
  );
}

function Btn({ title, onPress, loading, variant = 'primary', small }) {
  const primary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.btn,
        small && styles.btnSmall,
        primary ? { backgroundColor: colors.primary } : { borderWidth: 1, borderColor: colors.border },
        pressed && { opacity: 0.6 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={primary ? colors.primaryText : colors.primary} />
      ) : (
        <Text style={{ fontSize: small ? 12 : 13, color: primary ? colors.primaryText : colors.text }}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  body: { padding: 20, gap: 20, paddingBottom: 48 },
  eyebrow: { fontSize: 12, fontWeight: '600', color: colors.primary },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  desc: { fontSize: 13, color: colors.text },
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, gap: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  cardDesc: { fontSize: 12, color: colors.text, opacity: 0.8, lineHeight: 18 },
  meta: { fontSize: 12, color: colors.text },
  error: { fontSize: 12, color: colors.error },
  step: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  badge: { fontSize: 11, fontWeight: '600', minWidth: 40, textAlign: 'center', paddingVertical: 2, borderRadius: radius.pill, overflow: 'hidden' },
  badgeWait: { backgroundColor: '#EEE8E8', color: colors.text },
  badgeOk: { backgroundColor: '#E3F1E7', color: OK },
  badgeFail: { backgroundColor: '#F7E1E0', color: colors.error },
  stepTitle: { fontSize: 13, fontWeight: '600', color: colors.text },
  total: { fontSize: 13, fontWeight: '600' },
  samples: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    padding: 12,
    textAlignVertical: 'top',
    color: colors.text,
    fontSize: 14,
  },
  btn: { minHeight: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  btnSmall: { minHeight: 36, paddingHorizontal: 14 },
});
