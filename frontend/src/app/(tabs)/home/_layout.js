import { Stack } from 'expo-router';

// 홈 탭 안의 화면들: 홈(달력) → 일기 쓰기. 하단 탭은 그대로 보이고 홈 탭이 켜진 채로 유지된다.
export default function HomeStackLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'none', contentStyle: { backgroundColor: '#fff' } }} />;
}
