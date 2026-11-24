import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../lib/auth';
import { hydrateLanguage } from '../lib/i18n';
import { injectWebFont } from '../lib/webFont';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Asimovian: require('../../assets/fonts/Asimovian-Regular.ttf'),
  });

  // 기기에 저장된 마지막 UI 언어(모국어 설정)를 불러옴
  useEffect(() => {
    hydrateLanguage();
  }, []);

  // 웹에서는 @font-face로 등록해서 로고와 같은 Asimovian 글꼴이 적용되게 한다
  useEffect(() => {
    if (Platform.OS === 'web') injectWebFont();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: '#fff' } }} />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
