import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import DearLogo from '../components/DearLogo';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { errorMessage } from '../lib/errorMessage';
import { colors } from '../lib/theme';
import { useT } from '../lib/i18n';

// 임시 홈. 매칭 상태(API-007)로 P-005/P-006 분기를 확인하는 용도 — 화면 시안이 오면 교체
const STATUS_KEYS = { none: 'home.statusNone', waiting: 'home.statusWaiting', matched: 'home.statusMatched' };

export default function HomeScreen() {
  const { isLoggedIn, profile, loading, signOut } = useAuth();
  const [match, setMatch] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const t = useT();

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
      <Text style={styles.hello}>{t('home.hello', { nickname: profile.nickname })}</Text>
      <Text style={styles.meta}>
        {t('home.nativeLangLabel')} {t(`signup.langName.${profile.native_lang}`)}
      </Text>

      {!match ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <Text style={styles.meta}>
          {t(STATUS_KEYS[match.status])}
          {match.partner ? ` · ${match.partner.nickname}` : ''}
        </Text>
      )}
      {!!error && <Text style={styles.error}>{error}</Text>}

      {match && match.status !== 'matched' && (
        // 매칭 신청·대기는 P-005 매칭 화면(src/app/match.js)에서 처리
        <Pressable onPress={() => router.push('/match')} disabled={busy} style={styles.primary}>
          <Text style={styles.primaryText}>{t(match.status === 'waiting' ? 'home.refresh' : 'home.requestMatch')}</Text>
        </Pressable>
      )}
      <Pressable onPress={signOut} style={styles.logout}>
        <Text style={styles.logoutText}>{t('home.logout')}</Text>
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
