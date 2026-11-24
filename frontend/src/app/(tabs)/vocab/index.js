// 단어장 (시안: iPhone 13 & 23 전체보기 / 30·31 일기별 보기)
// - 전체보기: 사전에서 찾은 단어 + 상대가 첨삭해 준 단어를 한 목록으로
// - 일기별 보기: 이번 달 달력에서 날짜를 고르면 그날 보낸 일기에서 나온 단어만 (날짜 상세는 [day].js)
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Calendar from '../../../components/Calendar';
import DearLogo from '../../../components/DearLogo';
import VocabCard from '../../../components/VocabCard';
import { Bell } from '../../../components/Icons';
import { api } from '../../../lib/api';
import { errorMessage } from '../../../lib/errorMessage';
import { useT } from '../../../lib/i18n';
import { colors } from '../../../lib/theme';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function VocabScreen() {
  const t = useT();
  const [tab, setTab] = useState('all'); // all | byDiary
  const [vocab, setVocab] = useState(null); // null = 불러오는 중
  const [diaryDays, setDiaryDays] = useState([]); // 이번 달에 내가 일기를 쓴 날(일) — 달력 표시 기준
  const [error, setError] = useState('');

  const now = useMemo(() => new Date(), []);
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const [selectedDay, setSelectedDay] = useState(now.getDate());

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      api
        .getVocab()
        .then((res) => !cancelled && setVocab(res ?? []))
        .catch((e) => {
          if (cancelled) return;
          setVocab([]);
          setError(errorMessage(e));
        });
      // 달력은 "단어가 있는 날"이 아니라 "일기를 쓴 날" 기준으로 표시 (홈 화면과 같은 기준)
      api
        .getDiaryCalendar(`${year}-${String(month).padStart(2, '0')}`)
        .then((res) => !cancelled && setDiaryDays(res?.days ?? []))
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }, [year, month]),
  );

  const onDayPress = (day) => {
    if (diaryDays.includes(day)) {
      router.push({ pathname: '/vocab/[day]', params: { day: String(day) } });
    } else {
      setSelectedDay(day);
    }
  };

  // 실제 품사(명사/동사/형용사 등)만 보여주고, 모르면 태그 자체를 안 보여준다
  const tagLabel = (item) => item.pos || null;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <DearLogo width={64} />
        <Bell />
      </View>

      <View style={styles.tabs}>
        {['all', 'byDiary'].map((key) => (
          <Pressable key={key} onPress={() => setTab(key)} style={styles.tab} accessibilityRole="tab" accessibilityState={{ selected: tab === key }}>
            <Text style={[styles.tabText, tab === key && styles.tabActive]}>
              {key === 'all' ? t('vocab.allView') : t('vocab.byDiaryView')}
            </Text>
          </Pressable>
        ))}
      </View>

      {vocab === null ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
      ) : tab === 'all' ? (
        <FlatList
          data={vocab}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={<Text style={styles.empty}>{error || t('vocab.emptyAll')}</Text>}
          renderItem={({ item }) => <VocabCard item={item} tagLabel={tagLabel(item)} />}
        />
      ) : (
        <View style={styles.calendarWrap}>
          <Text style={styles.date}>
            {MONTHS[month - 1]}. {month}. {now.getDate()}.
          </Text>
          <Calendar
            year={year}
            month={month}
            today={now.getDate()}
            markedDays={diaryDays}
            selectedDay={selectedDay}
            onDayPress={onDayPress}
          />
          {!diaryDays.includes(selectedDay) && <Text style={styles.empty}>{error || t('vocab.noDiaryThatDay')}</Text>}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 22 },
  tabs: { flexDirection: 'row', gap: 18, paddingHorizontal: 18, paddingTop: 26, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  tab: { paddingVertical: 4 },
  tabText: { fontSize: 13, color: colors.placeholder },
  tabActive: { color: colors.text, fontWeight: '600' },
  list: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 24 },
  empty: { marginTop: 40, textAlign: 'center', fontSize: 13, lineHeight: 20, color: colors.placeholder },
  calendarWrap: { paddingHorizontal: 18, paddingTop: 10 },
  date: { textAlign: 'center', fontSize: 14, color: colors.text, marginTop: 18, marginBottom: 26 },
});
