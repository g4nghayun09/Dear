// P-001 스플래시: 저장된 로그인 상태에 따라 첫 화면을 고릅니다. (FR-005)
// 담당: 강하윤
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { api, getDevUserId } from '../src/lib/api';
import { getToken } from '../src/lib/auth';
import { colors, space, text } from '../src/theme/tokens';

export default function SplashScreen() {
  useEffect(() => {
    (async () => {
      try {
        // 로그인 토큰이 없으면 로그인으로. (개발용 테스트 사용자 번호가 있으면 통과)
        if (!(await getToken()) && !getDevUserId()) return router.replace('/auth/login');

        const me = await api.getMe(); // API-005
        if (!me.nickname) return router.replace('/auth/profile');
        if (!me.nativeLang) return router.replace('/auth/language');

        const match = await api.getMyMatch(); // API-007
        router.replace(match.status === 'MATCHED' ? '/home' : '/match');
      } catch {
        // 토큰 만료, 서버 꺼짐 등 → 로그인부터
        router.replace('/auth/login');
      }
    })();
  }, []);

  return (
    <View style={styles.wrap}>
      <Text style={styles.logo}>Dear .</Text>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space[4], backgroundColor: colors.bg },
  logo: { ...text.h1, fontSize: 28, color: colors.textPrimary },
});
