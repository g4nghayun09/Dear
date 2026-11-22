import { ActivityIndicator, View } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabBook, TabHome, TabMail, TabUser } from '../../components/Icons';
import { useAuth } from '../../lib/auth';
import { colors } from '../../lib/theme';
import { useT } from '../../lib/i18n';

// 로그인 + 가입을 마친 사용자만 들어오는 영역. 하단 탭: 홈 / 교환일기 / 단어장 / 마이
export default function TabsLayout() {
  const { isLoggedIn, profile, loading } = useAuth();
  const insets = useSafeAreaInsets();
  const t = useT();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!isLoggedIn) return <Redirect href="/login" />;
  if (!profile) return <Redirect href="/signup" />;

  const icon = (Icon) =>
    function TabIcon({ color, focused }) {
      return <Icon color={color} filled={focused} />;
    };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: { fontSize: 10 },
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: colors.line,
          height: 62 + insets.bottom,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 8),
        },
        sceneStyle: { backgroundColor: '#fff' },
      }}
    >
      <Tabs.Screen name="home" options={{ title: t('tabs.home'), tabBarIcon: icon(TabHome) }} />
      <Tabs.Screen name="exchange" options={{ title: t('tabs.exchange'), tabBarIcon: icon(TabMail) }} />
      <Tabs.Screen name="vocab" options={{ title: t('tabs.vocab'), tabBarIcon: icon(TabBook) }} />
      <Tabs.Screen name="mypage" options={{ title: t('tabs.mypage'), tabBarIcon: icon(TabUser) }} />
      {/* 일기 쓰기: 탭 막대에는 보이지 않지만 하단 탭은 그대로 보임. 홈 탭이 켜진 것으로 표시 */}
      <Tabs.Screen name="write" options={{ href: null }} />
    </Tabs>
  );
}
