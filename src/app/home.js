import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import DearLogo from '../components/DearLogo';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { errorMessage } from '../lib/errorMessage';
import { colors } from '../lib/theme';

// 임시 홈. 매칭 상태(API-007)로 P-005/P-006 분기를 확인하는 용도 — 화면 시안이 오면 교체
const STATUS_TEXT = { none: '아직 교환 상대가 없어요', waiting: '상대를 찾는 중이에요', matched: '교환 중' };

export default function HomeScreen() {
  const { isLoggedIn, profile, loading, signOut } = useAuth();
  const [match, setMatch] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      setMatch(await api.getMyMatch());
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

  useEffect(() => {
    if (profile) refresh();
  }, [profile, refresh]);

  if (!loading && !isLoggedIn) return <Redirect href="/login" />;
  if (!loading && isLoggedIn && !profile) return <Redirect href="/signup" />;
  if (!profile) return null;

  const onRequest = async () => {
    setBusy(true);
    setError('');
    try {
      await api.requestMatch();
      await refresh();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <DearLogo width={90} />
      <Text style={styles.hello}>{profile.nickname}님, 반가워요!</Text>
      <Text style={styles.meta}>모국어 {profile.native_lang === 'ko' ? '한국어' : '日本語'}</Text>

      {!match ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <Text style={styles.meta}>
          {STATUS_TEXT[match.status]}
          {match.partner ? ` · ${match.partner.nickname}` : ''}
        </Text>
      )}
      {!!error && <Text style={styles.error}>{error}</Text>}

      {match && match.status !== 'matched' && (
        <Pressable onPress={match.status === 'waiting' ? refresh : onRequest} disabled={busy} style={styles.primary}>
          <Text style={styles.primaryText}>{match.status === 'waiting' ? '새로고침' : '매칭 신청'}</Text>
        </Pressable>
      )}
      <Pressable onPress={signOut} style={styles.logout}>
        <Text style={styles.logoutText}>로그아웃</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, gap: 12 },
  hello: { marginTop: 12, fontSize: 18, color: colors.text, fontWeight: '600' },
  meta: { fontSize: 13, color: colors.text },
  error: { fontSize: 12, color: colors.error },
  primary: { marginTop: 16, paddingVertical: 12, paddingHorizontal: 28, borderRadius: 999, backgroundColor: colors.primary },
  primaryText: { fontSize: 13, color: colors.primaryText },
  logout: { marginTop: 8, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 999, borderWidth: 1, borderColor: colors.border },
  logoutText: { fontSize: 13, color: colors.text },
});
