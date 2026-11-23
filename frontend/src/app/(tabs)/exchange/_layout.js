import { Stack } from 'expo-router';

// 교환일기 탭 안의 화면들: 목록(나의 일기 / 친구 일기) → 일기 상세. 하단 탭은 그대로 보인다.
export default function ExchangeStackLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'none', contentStyle: { backgroundColor: '#fff' } }} />;
}
