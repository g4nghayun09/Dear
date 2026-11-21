// [개발용] 기능 시연 화면 (담당: 강태인)
// 1:1 매칭(FR-006~008)과 학습 언어 입력 제한(FR-010)이 제대로 동작하는지 폰 한 대로 보여 줍니다.
// 필요 조건: 서버 .env 의 DEV_AUTH=true, 앱은 개발 모드(Expo Go)
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../src/components/Button';
import LanguageCheckNotice from '../src/components/LanguageCheckNotice';
import useDiaryInputCheck from '../src/hooks/useDiaryInputCheck';
import { devApi } from '../src/lib/api';
import { languageName } from '../src/lib/languageCheck';
import { colors, radius, space, text } from '../src/theme/tokens';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// 서버 응답(또는 오류)을 한 줄로 요약
function summarize(res, err) {
  if (err) return `오류 ${err.status} ${err.code}`;
  if (res === null) return '완료 (응답 본문 없음)';
  if (Array.isArray(res)) return res.map((u) => `${u.userId}번 ${u.nickname}(${u.nativeLang})`).join(', ');
  if (res.status === 'MATCHED') return `MATCHED · 상대: ${res.partner?.nickname} · 매칭 #${res.matchId}`;
  if (res.status) return res.status;
  if (res.endedAt) return `해제됨 · 매칭 #${res.matchId}`;
  return JSON.stringify(res);
}

// 매칭 시연 단계. u = { ko1, ja, ko2 } 테스트 사용자 번호
const MATCH_STEPS = [
  {
    title: '민지(한국어)가 매칭 신청',
    expect: '대기열에 들어감 → WAITING',
    run: (u) => devApi.requestMatchAs(u.ko1),
    check: (res) => res?.status === 'WAITING',
  },
  {
    title: '지호(한국어)가 매칭 신청',
    expect: '같은 한국어끼리는 연결되지 않음 → WAITING',
    run: (u) => devApi.requestMatchAs(u.ko2),
    check: (res) => res?.status === 'WAITING',
  },
  {
    title: 'はると(일본어)가 매칭 신청',
    expect: '가장 오래 기다린 민지와 바로 연결 → MATCHED',
    run: (u) => devApi.requestMatchAs(u.ja),
    check: (res) => res?.status === 'MATCHED' && res.partner?.nickname === '민지',
  },
  {
    title: '민지의 매칭 상태 조회',
    expect: 'MATCHED, 상대는 はると (이메일 등 개인정보는 안 보임)',
    run: (u) => devApi.getMyMatchAs(u.ko1),
    check: (res) => res?.status === 'MATCHED' && res.partner?.nickname === 'はると' && !('email' in res.partner),
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
    check: (res) => !!res?.endedAt,
  },
  {
    title: 'はると의 매칭 상태 조회',
    expect: '상대가 해제해서 → NONE (다시 매칭 신청 가능)',
    run: (u) => devApi.getMyMatchAs(u.ja),
    check: (res) => res?.status === 'NONE',
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

export default function DemoScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.eyebrow}>개발용 · 담당 강태인</Text>
          <Text style={styles.title}>기능 시연</Text>
          <Text style={styles.desc}>1:1 매칭과 학습 언어 입력 제한이 서버와 함께 제대로 동작하는지 확인합니다.</Text>
        </View>

        <MatchDemo />
        <LanguageDemo />

        <Button title="매칭 대기 화면으로" variant="text" onPress={() => router.push('/match')} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── 1. 매칭 시연 ──
function MatchDemo() {
  const [users, setUsers] = useState(null);
  const [results, setResults] = useState([]); // [{ ok, summary }]
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);

  const runAll = async () => {
    setRunning(true);
    setError(null);
    setResults([]);
    try {
      // 테스트 사용자 준비 + 이전 시연 기록 초기화
      const list = await devApi.prepareTestUsers();
      setUsers(list);
      const byEmail = Object.fromEntries(list.map((x) => [x.email, x.userId]));
      const u = {
        ko1: byEmail['test.ko1@example.com'],
        ja: byEmail['test.ja1@example.com'],
        ko2: byEmail['test.ko2@example.com'],
      };

      for (const step of MATCH_STEPS) {
        let res;
        let err;
        try {
          res = await step.run(u);
        } catch (e) {
          err = e;
        }
        const ok = step.check(res, err);
        setResults((prev) => [...prev, { ok, summary: summarize(res, err) }]);
        await wait(500); // 한 단계씩 보이도록
      }
    } catch (e) {
      setError(
        e.status === 404
          ? '시연 API가 꺼져 있어요. 서버 demo/.env 에 DEV_AUTH=true 를 넣고 서버를 다시 켜 주세요.'
          : `서버와 연결하지 못했어요 (${e.code}). 서버 주소와 Wi-Fi를 확인해 주세요.`,
      );
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

      <Button title={results.length ? '처음부터 다시 시연' : '자동 시연 시작'} onPress={runAll} loading={running} />
      {error && <Text style={styles.error}>{error}</Text>}

      {users && (
        <Text style={styles.meta}>테스트 사용자: {users.map((x) => `${x.userId}번 ${x.nickname}`).join(' · ')}</Text>
      )}

      <View style={styles.steps}>
        {MATCH_STEPS.map((step, i) => {
          const r = results[i];
          return (
            <View key={step.title} style={styles.step}>
              <Text style={[styles.badge, r ? (r.ok ? styles.badgeOk : styles.badgeFail) : styles.badgeWait]}>
                {r ? (r.ok ? '통과' : '실패') : `${i + 1}`}
              </Text>
              <View style={styles.stepBody}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepExpect}>기대: {step.expect}</Text>
                {r && <Text style={[styles.stepResult, !r.ok && styles.error]}>결과: {r.summary}</Text>}
              </View>
            </View>
          );
        })}
      </View>

      {done && (
        <Text style={[styles.total, passed === MATCH_STEPS.length ? styles.totalOk : styles.error]}>
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

  const agree = useMemo(() => (server ? server.valid === check.canSend : null), [server, check.canSend]);

  const change = (value) => {
    setContent(value);
    setServer(null);
  };

  const askServer = async () => {
    setBusy(true);
    try {
      setServer(await devApi.languageCheck(content, lang));
    } catch (e) {
      setServer({ failed: true, message: e.status === 404 ? '시연 API가 꺼져 있어요 (DEV_AUTH=true 필요)' : `연결 실패 (${e.code})` });
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

      <View style={styles.toggle}>
        {['ja', 'ko'].map((l) => (
          <Button
            key={l}
            title={l === 'ja' ? '한국인 (일본어로 쓰기)' : '일본인 (한국어로 쓰기)'}
            variant={lang === l ? 'primary' : 'secondary'}
            style={styles.toggleButton}
            onPress={() => {
              setLang(l);
              change('');
            }}
          />
        ))}
      </View>

      <View style={styles.samples}>
        {SAMPLES[lang].map((s) => (
          <Button key={s.label} title={s.label} variant="secondary" style={styles.sample} onPress={() => change(s.value)} />
        ))}
      </View>

      <TextInput
        value={content}
        onChangeText={change}
        multiline
        placeholder={`${languageName(lang)}로 일기를 써 보세요`}
        placeholderTextColor={colors.textTertiary}
        style={styles.input}
      />
      <LanguageCheckNotice lang={lang} check={check} />

      <View style={styles.compare}>
        <Text style={styles.compareRow}>
          앱 검사: <Text style={check.canSend ? styles.okText : styles.error}>{check.canSend ? '보낼 수 있음' : '보낼 수 없음'}</Text>
          {'  '}({check.lines}줄 · {check.length}자)
        </Text>
        {server && !server.failed && (
          <Text style={styles.compareRow}>
            서버 검사: <Text style={server.valid ? styles.okText : styles.error}>{server.valid ? '보낼 수 있음' : '보낼 수 없음'}</Text>
            {server.errorCode ? `  (${server.errorCode}: ${server.message})` : ''}
          </Text>
        )}
        {server?.failed && <Text style={styles.error}>{server.message}</Text>}
        {agree !== null && (
          <Text style={[styles.total, agree ? styles.totalOk : styles.error]}>
            {agree ? '앱과 서버 결과가 같아요' : '앱과 서버 결과가 달라요 (규칙 확인 필요)'}
          </Text>
        )}
      </View>

      <Button title="서버에서도 검사하기" variant="secondary" onPress={askServer} loading={busy} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { padding: space[5], gap: space[5], paddingBottom: space[10] },
  header: { gap: space[1] },
  eyebrow: { ...text.label, color: colors.primary },
  title: { ...text.h1, color: colors.textPrimary },
  desc: { ...text.body, color: colors.textSecondary },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space[4],
    gap: space[3],
  },
  cardTitle: { ...text.h2, color: colors.textPrimary },
  cardDesc: { ...text.caption, color: colors.textSecondary },
  meta: { ...text.caption, color: colors.textSecondary },
  error: { ...text.caption, color: colors.error },
  okText: { color: colors.success },
  steps: { gap: space[3] },
  step: { flexDirection: 'row', gap: space[3], alignItems: 'flex-start' },
  badge: {
    ...text.caption,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'center',
    paddingVertical: 2,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  badgeWait: { backgroundColor: colors.disabledBg, color: colors.textSecondary },
  badgeOk: { backgroundColor: colors.successSubtle, color: colors.success },
  badgeFail: { backgroundColor: colors.errorSubtle, color: colors.error },
  stepBody: { flex: 1, gap: 2 },
  stepTitle: { ...text.label, color: colors.textPrimary },
  stepExpect: { ...text.caption, color: colors.textSecondary },
  stepResult: { ...text.caption, color: colors.success },
  total: { ...text.label },
  totalOk: { color: colors.success },
  toggle: { gap: space[2] },
  toggleButton: { minHeight: 44 },
  samples: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  sample: { minHeight: 36, paddingHorizontal: space[3] },
  input: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: space[3],
    textAlignVertical: 'top',
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    ...text.diary,
  },
  compare: { gap: space[1] },
  compareRow: { ...text.caption, color: colors.textPrimary },
});
