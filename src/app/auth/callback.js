import { useEffect, useRef } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { errorMessage } from '../../lib/errorMessage';
import { colors } from '../../lib/theme';

// 서버가 로그인 후 dear://auth/callback?token=… 으로 앱을 다시 열었을 때 (주로 안드로이드)
// 로그인 버튼 쪽에서 이미 토큰을 처리했으면 그냥 첫 화면으로 넘어감
export default function AuthCallback() {
  const { token, error } = useLocalSearchParams();
  const { isLoggedIn, acceptToken } = useAuth();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    (async () => {
      try {
        if (error) throw new Error(String(error));
        if (token && !isLoggedIn) await acceptToken(String(token));
      } catch (e) {
        Alert.alert('로그인 실패', errorMessage(e));
      }
      router.replace('/');
    })();
  }, [token, error, isLoggedIn, acceptToken]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}
