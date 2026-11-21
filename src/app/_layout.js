import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../lib/auth';
import { hydrateLanguage } from '../lib/i18n';

export default function RootLayout() {
  // 기기에 저장된 마지막 UI 언어(모국어 설정)를 불러옴
  useEffect(() => {
    hydrateLanguage();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: '#fff' } }} />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
