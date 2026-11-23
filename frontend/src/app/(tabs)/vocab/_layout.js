import { Stack } from 'expo-router';

// 단어장 탭 안의 화면들: 목록(전체보기 / 일기별 보기) → 일기별 보기에서 날짜를 누르면 그날 단어 목록
export default function VocabStackLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'none', contentStyle: { backgroundColor: '#fff' } }} />;
}
