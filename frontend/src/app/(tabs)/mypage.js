import { Pressable, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import ComingSoon from '../../components/ComingSoon';
import { useAuth } from '../../lib/auth';
import { colors } from '../../lib/theme';
import { useT } from '../../lib/i18n';

// 마이 — 프로필·매칭 해제 화면이 생기기 전까지 로그아웃만 둔다
export default function MyPageScreen() {
  const t = useT();
  const { profile, signOut } = useAuth();

  const onLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <ComingSoon title={profile?.nickname ?? t('tabs.mypage')}>
      <Pressable onPress={onLogout} style={styles.logout} accessibilityRole="button">
        <Text style={styles.logoutText}>{t('home.logout')}</Text>
      </Pressable>
    </ComingSoon>
  );
}

const styles = StyleSheet.create({
  logout: { marginTop: 16, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 999, borderWidth: 1, borderColor: colors.border },
  logoutText: { fontSize: 13, color: colors.text },
});
