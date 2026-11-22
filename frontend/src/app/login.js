import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Redirect, router } from 'expo-router';
import Brand from '../components/Brand';
import GoogleButton from '../components/GoogleButton';
import { useAuth } from '../lib/auth';
import { useGoogleIdToken } from '../lib/googleSignIn';
import { errorMessage } from '../lib/errorMessage';
import { colors } from '../lib/theme';
import { useT } from '../lib/i18n';

export default function LoginScreen() {
  const { isLoggedIn, profile, loading, signInWithGoogle } = useAuth();
  const { height } = useWindowDimensions();
  const [busy, setBusy] = useState(false);
  const t = useT();
  const { getIdToken } = useGoogleIdToken();

  if (!loading && isLoggedIn) return <Redirect href={profile ? '/home' : '/signup'} />;

  const onGoogle = async () => {
    setBusy(true);
    try {
      await signInWithGoogle(await getIdToken());
      // 성공하면 로그인 상태가 바뀌면서 위의 Redirect가 가입하기/홈으로 보냄
    } catch (e) {
      Alert.alert(t('login.failTitle'), errorMessage(e));
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
        {/* [개발용] 기능 시연 화면 (Expo Go 에서만 보임, APK 에서는 숨김) */}
        {__DEV__ && (
          <Pressable onPress={() => router.push('/dev')} style={styles.dev}>
            <Text style={styles.devText}>개발용 · 기능 시연</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  bottom: { position: 'absolute', left: 45, right: 45 },
  dev: { marginTop: 16, alignSelf: 'center', padding: 8 },
  devText: { fontSize: 12, color: colors.placeholder, textDecorationLine: 'underline' },
});
