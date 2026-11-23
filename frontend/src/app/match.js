// P-005 매칭 대기 (FR-006, FR-007, 담당: 강태인)
// API-006 매칭 신청 / API-007 상태 조회 / API-020 대기 취소
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import DearLogo from '../components/DearLogo';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { getDevUserId } from '../lib/devUser';
import { errorMessage } from '../lib/errorMessage';
import { useLanguage } from '../lib/i18n';
import { colors, radius } from '../lib/theme';

const POLL_MS = 5000; // 대기 중일 때 5초마다 상태 확인

const TEXT = {
  ko: {
    noneTitle: '교환일기 친구를 찾아볼까요?',
    noneDesc: '모국어가 다른 친구와 1:1로 연결돼요',
    find: '상대 찾기',
    waitingTitle: '상대를 기다리는 중',
    waitingDesc: (time) => `${time ? `${time}부터 ` : ''}기다리고 있어요. 상대가 들어오면 바로 연결돼요.`,
    refresh: '새로고침',
    cancel: '대기 취소',
    matchedTitle: (name) => `${name} 님과 연결됐어요!`,
    matchedDesc: '이제 서로의 언어로 교환일기를 써 보세요',
    start: '교환일기 시작',
    retry: '다시 시도',
  },
  ja: {
    noneTitle: '交換日記の友だちを探しましょうか？',
    noneDesc: '母語がちがう友だちと1対1でつながります',
    find: '相手を探す',
    waitingTitle: '相手を待っています',
    waitingDesc: (time) => `${time ? `${time}から` : ''}待っています。相手が来たらすぐにつながります。`,
    refresh: '更新',
    cancel: '待機をやめる',
    matchedTitle: (name) => `${name}さんとつながりました！`,
    matchedDesc: 'お互いの言語で交換日記を書いてみましょう',
    start: '交換日記をはじめる',
    retry: 'もう一度',
  },
};

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function MatchScreen() {
  const { isLoggedIn, profile, loading } = useAuth();
  const [uiLang] = useLanguage();
  const tx = TEXT[uiLang] ?? TEXT.ko;
  const devMode = !!getDevUserId(); // [개발용] 테스트 사용자로 들어온 경우 로그인 검사 생략

  const [match, setMatch] = useState(null); // { status: 'none'|'waiting'|'matched', ... }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const mounted = useRef(true);

  const load = useCallback(async () => {
    try {
      const res = await api.getMyMatch(); // API-007
      if (mounted.current) {
        setError('');
        setMatch(res);
      }
    } catch (e) {
      if (mounted.current) setError(errorMessage(e));
    }
  }, []);

  const run = useCallback(
    async (fn) => {
      setBusy(true);
      setError('');
      try {
        await fn();
        await load();
      } catch (e) {
        if (!mounted.current) return;
        if (e.code === 'ALREADY_MATCHED' || e.code === 'NOT_WAITING') await load(); // 상태가 이미 바뀜 → 다시 조회
        else setError(errorMessage(e));
      } finally {
        if (mounted.current) setBusy(false);
      }
    },
    [load],
  );

  useEffect(() => {
    mounted.current = true;
    load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  // 대기 중이면 주기적으로 상태 확인 (상대가 들어오면 자동으로 연결 화면으로)
  useEffect(() => {
    if (match?.status !== 'waiting') return undefined;
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [match?.status, load]);

  if (!devMode && !loading && !isLoggedIn) return <Redirect href="/login" />;
  if (!devMode && !loading && isLoggedIn && !profile) return <Redirect href="/signup" />;

  const findPartner = () => run(() => api.requestMatch()); // API-006 (대기 중에 다시 누르면 새로고침)
  const cancel = () => run(() => api.cancelWaiting()); // API-020
  const status = match?.status;

  return (
    <SafeAreaView style={styles.screen}>
      <DearLogo width={90} />

      <View style={styles.center}>
        {!match && !error && <ActivityIndicator color={colors.primary} />}

        {status === 'none' && (
          <>
            <Text style={styles.title}>{tx.noneTitle}</Text>
            <Text style={styles.desc}>{tx.noneDesc}</Text>
          </>
        )}

        {status === 'waiting' && (
          <>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.title}>{tx.waitingTitle}</Text>
            <Text style={styles.desc}>{tx.waitingDesc(formatTime(match.waiting_since))}</Text>
          </>
        )}

        {status === 'matched' && (
          <>
            <Text style={styles.title}>{tx.matchedTitle(match.partner?.nickname ?? '')}</Text>
            <Text style={styles.desc}>{tx.matchedDesc}</Text>
          </>
        )}

        {!!error && <Text style={styles.error}>{error}</Text>}
      </View>

      <View style={styles.actions}>
        {status === 'none' && <PillButton title={tx.find} onPress={findPartner} loading={busy} />}
        {status === 'waiting' && (
          <>
            <PillButton title={tx.refresh} variant="outline" onPress={findPartner} loading={busy} />
            <PillButton title={tx.cancel} variant="text" onPress={cancel} disabled={busy} />
          </>
        )}
        {status === 'matched' && <PillButton title={tx.start} onPress={() => router.replace('/exchange')} />}
        {!match && !!error && <PillButton title={tx.retry} variant="outline" onPress={load} />}
      </View>
    </SafeAreaView>
  );
}

function PillButton({ title, onPress, loading, disabled, variant = 'primary' }) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={loading || disabled}
      style={({ pressed }) => [
        styles.btn,
        isPrimary && styles.btnPrimary,
        variant === 'outline' && styles.btnOutline,
        (pressed || disabled) && { opacity: 0.6 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.primaryText : colors.primary} />
      ) : (
        <Text style={[styles.btnText, isPrimary && styles.btnTextPrimary]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, alignItems: 'center', paddingHorizontal: 32, paddingVertical: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  title: { fontSize: 18, fontWeight: '600', color: colors.text, textAlign: 'center' },
  desc: { fontSize: 13, color: colors.text, textAlign: 'center', lineHeight: 20 },
  error: { fontSize: 12, color: colors.error, textAlign: 'center' },
  actions: { alignSelf: 'stretch', gap: 10 },
  btn: { height: 48, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: colors.primary },
  btnOutline: { borderWidth: 1, borderColor: colors.border },
  btnText: { fontSize: 14, color: colors.text },
  btnTextPrimary: { color: colors.primaryText, fontWeight: '500' },
});
