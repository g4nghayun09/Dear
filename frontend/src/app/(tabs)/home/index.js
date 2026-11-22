import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Calendar from '../../../components/Calendar';
import DearLogo from '../../../components/DearLogo';
import { Bell } from '../../../components/Icons';
import { api } from '../../../lib/api';
import { colors } from '../../../lib/theme';
import { useT } from '../../../lib/i18n';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// 홈: 이번 달 달력(일기를 쓴 날은 파란 원) + 일기 쓰기 / 받은 일기 보기
export default function HomeScreen() {
  const t = useT();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const [markedDays, setMarkedDays] = useState([]);

  // 일기를 쓰고 돌아오면 달력이 바로 갱신되도록, 화면에 다시 들어올 때마다 불러옴
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      api
        .getDiaryCalendar(`${year}-${String(month).padStart(2, '0')}`)
        .then((res) => !cancelled && setMarkedDays(res?.days ?? []))
        .catch(() => {}); // 달력은 보조 정보라서 실패해도 화면은 그대로 둠
      return () => {
        cancelled = true;
      };
    }, [year, month]),
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <DearLogo width={64} />
        <Bell />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.date}>
          {MONTHS[month - 1]}. {month}. {now.getDate()}.
        </Text>
        <Calendar year={year} month={month} today={now.getDate()} markedDays={markedDays} />
      </ScrollView>

      <View style={styles.actions}>
        <Pressable onPress={() => router.push('/home/diary-write')} style={({ pressed }) => [styles.button, pressed && styles.pressed]} accessibilityRole="button">
          <Text style={styles.buttonText}>{t('diary.writeToday')}</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/exchange')} style={({ pressed }) => [styles.button, pressed && styles.pressed]} accessibilityRole="button">
          <Text style={styles.buttonText}>{t('diary.viewReceived')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 22 },
  content: { paddingHorizontal: 18, paddingBottom: 12 },
  date: { textAlign: 'center', fontSize: 14, color: colors.text, marginTop: 28, marginBottom: 26 },
  actions: { paddingHorizontal: 18, paddingTop: 22, paddingBottom: 16, gap: 10, borderTopWidth: 1, borderTopColor: colors.line },
  button: { height: 52, borderRadius: 10, borderWidth: 1.2, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  pressed: { opacity: 0.6 },
  buttonText: { fontSize: 14, color: colors.text },
});
