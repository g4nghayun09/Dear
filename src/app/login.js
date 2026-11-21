import { useState } from 'react';
import { Alert, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Redirect } from 'expo-router';
import Brand from '../components/Brand';
import GoogleButton from '../components/GoogleButton';
import { useAuth } from '../lib/auth';
import { errorMessage } from '../lib/errorMessage';
import { colors } from '../lib/theme';

export default function LoginScreen() {
  const { isLoggedIn, profile, loading, signInWithGoogle } = useAuth();
  const { height } = useWindowDimensions();
  const [busy, setBusy] = useState(false);

  if (!loading && isLoggedIn) return <Redirect href={profile ? '/home' : '/signup'} />;

  const onGoogle = async () => {
    setBusy(true);
    try {
      await signInWithGoogle();
      // 성공하면 로그인 상태가 바뀌면서 위의 Redirect가 가입하기/홈으로 보냄
    } catch (e) {
      Alert.alert('로그인 실패', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Brand />
      {/* 시안: 화면 아래에서 약 16% 위 */}
      <View style={[styles.bottom, { bottom: height * 0.159 }]}>
        <GoogleButton onPress={onGoogle} loading={busy} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  bottom: { position: 'absolute', left: 45, right: 45 },
});
