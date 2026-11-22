import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../lib/auth';
import { colors } from '../lib/theme';

// 첫 진입: 로그인/가입 상태에 따라 알맞은 화면으로 보냄
export default function Index() {
  const { isLoggedIn, profile, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!isLoggedIn) return <Redirect href="/login" />;
  if (!profile) return <Redirect href="/signup" />;
  return <Redirect href="/home" />;
}
