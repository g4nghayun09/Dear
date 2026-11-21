// P-005 매칭 대기 (FR-006, FR-007, 담당: 강태인)
// API-006 매칭 신청 / API-007 상태 조회 / API-020 대기 취소
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../src/components/Button';
import { api, getDevUserId, setDevUserId } from '../src/lib/api';
import { colors, radius, space, text } from '../src/theme/tokens';

const POLL_MS = 5000; // 대기 중일 때 5초마다 상태 확인

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function MatchScreen() {
  const [status, setStatus] = useState(null); // null(불러오는 중) | NONE | WAITING
  const [waitingSince, setWaitingSince] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  // 서버 응답 하나를 화면 상태로 바꿉니다
  const apply = useCallback((res) => {
    if (!mounted.current) return;
    if (res.status === 'MATCHED') {
      router.replace('/home');
      return;
    }
    setStatus(res.status);
    setWaitingSince(res.waitingSince ?? null);
  }, []);

  const handleError = useCallback((e) => {
    if (!mounted.current) return;
    if (e.code === 'UNAUTHORIZED') return router.replace('/auth/login');
    if (e.code === 'PROFILE_REQUIRED') return router.replace('/auth/profile');
    if (e.code === 'ALREADY_MATCHED') return router.replace('/home');
    if (e.code === 'NOT_WAITING') {
      setStatus('NONE');
      return;
    }
    setError(e.code === 'NETWORK_ERROR' ? '서버와 연결하지 못했어요. Wi-Fi와 서버 주소를 확인해 주세요.' : e.message);
  }, []);

  const load = useCallback(async () => {
    try {
      setError(null);
      apply(await api.getMyMatch()); // API-007
    } catch (e) {
      handleError(e);
    }
  }, [apply, handleError]);

  const run = useCallback(
    async (fn) => {
      setBusy(true);
      setError(null);
      try {
        const res = await fn();
        if (res) apply(res);
      } catch (e) {
        handleError(e);
      } finally {
        if (mounted.current) setBusy(false);
      }
    },
    [apply, handleError],
  );

  // 처음 들어왔을 때 상태 확인
  useEffect(() => {
    mounted.current = true;
    load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  // 대기 중이면 주기적으로 상태 확인 (상대가 들어오면 자동으로 홈으로 이동)
  useEffect(() => {
    if (status !== 'WAITING') return undefined;
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [status, load]);

  const findPartner = () => run(() => api.requestMatch()); // API-006 (대기 중에 다시 누르면 새로고침)
  const cancel = () =>
    run(async () => {
      await api.cancelWaiting(); // API-020
      return { status: 'NONE' };
    });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.logo}>Dear .</Text>

        <View style={styles.center}>
          <Text style={styles.illust}>✉️</Text>

          {status === null && <ActivityIndicator color={colors.primary} />}

          {status === 'NONE' && (
            <>
              <Text style={styles.title}>교환일기 친구를 찾아볼까요?</Text>
              <Text style={styles.desc}>모국어가 다른 친구와 1:1로 연결돼요</Text>
            </>
          )}

          {status === 'WAITING' && (
            <>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.title}>상대를 기다리는 중</Text>
              <Text style={styles.desc}>
                {formatTime(waitingSince)}부터 기다리고 있어요. 상대가 들어오면 바로 연결돼요.
              </Text>
            </>
          )}

          {error && <Text style={styles.error}>{error}</Text>}
        </View>

        <View style={styles.actions}>
          {status === 'NONE' && <Button title="상대 찾기" onPress={findPartner} loading={busy} />}
          {status === 'WAITING' && (
            <>
              <Button title="새로고침" variant="secondary" onPress={findPartner} loading={busy} />
              <Button title="대기 취소" variant="text" onPress={cancel} disabled={busy} />
            </>
          )}
          {status === null && error && <Button title="다시 시도" variant="secondary" onPress={load} />}
        </View>

        {__DEV__ && <DevUserPanel onChange={load} />}
      </View>
    </SafeAreaView>
  );
}

// [개발용] 폰마다 다른 테스트 사용자로 바꾸는 칸. APK(배포 빌드)에서는 보이지 않습니다.
function DevUserPanel({ onChange }) {
  const [value, setValue] = useState(getDevUserId() ?? '');
  return (
    <View style={styles.dev}>
      <Text style={styles.devLabel}>테스트 사용자 번호 (개발용)</Text>
      <View style={styles.devRow}>
        <TextInput
          value={value}
          onChangeText={setValue}
          keyboardType="number-pad"
          placeholder="예: 1"
          style={styles.devInput}
        />
        <Button
          title="적용"
          variant="secondary"
          style={styles.devButton}
          onPress={() => {
            setDevUserId(value.trim());
            onChange();
          }}
        />
      </View>
      <Button title="기능 시연 화면 열기" variant="text" onPress={() => router.push('/demo')} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, paddingHorizontal: space[5], paddingVertical: space[4], gap: space[6] },
  logo: { ...text.h2, color: colors.textPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space[3] },
  illust: { fontSize: 64 },
  title: { ...text.h1, color: colors.textPrimary, textAlign: 'center' },
  desc: { ...text.body, color: colors.textSecondary, textAlign: 'center' },
  error: { ...text.caption, color: colors.error, textAlign: 'center' },
  actions: { gap: space[2] },
  dev: {
    gap: space[2],
    padding: space[3],
    borderRadius: radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  devLabel: { ...text.caption, color: colors.textSecondary },
  devRow: { flexDirection: 'row', gap: space[2] },
  devInput: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: space[3],
    backgroundColor: colors.surface,
    color: colors.textPrimary,
  },
  devButton: { minHeight: 44, paddingHorizontal: space[5] },
});
