// 교환일기 상세 (시안: iPhone 13 & 36) — 일기 본문 + 첨삭 결과(있으면)
// 첨삭하기·단어 모음·평가는 담당 화면이 생기면 이 아래에 붙인다.
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import DearLogo from '../../../components/DearLogo';
import { Bell, ChevronLeft } from '../../../components/Icons';
import { api } from '../../../lib/api';
import { errorMessage } from '../../../lib/errorMessage';
import { useLanguage } from '../../../lib/i18n';
import { colors } from '../../../lib/theme';

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

const TEXT = {
  ko: { untitled: '제목 없음', corrections: '첨삭', me: '나' },
  ja: { untitled: 'タイトルなし', corrections: '添削', me: '自分' },
};

export default function DiaryDetailScreen() {
  const { id, partner } = useLocalSearchParams();
  const [uiLang] = useLanguage();
  const tx = TEXT[uiLang] ?? TEXT.ko;
  const [diary, setDiary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .getDiary(id)
      .then((d) => {
        if (cancelled) return;
        setDiary(d);
        // 친구 일기를 처음 열면 읽음 표시 (서버에 아직 없으면 조용히 넘어감)
        if (d && !d.mine && !d.read_at) api.markDiaryRead?.(id)?.catch?.(() => {});
      })
      .catch((e) => !cancelled && setError(errorMessage(e)));
    return () => {
      cancelled = true;
    };
  }, [id]);

  const corrections = diary?.corrections ?? [];

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <DearLogo width={64} />
        <Bell />
      </View>

      <Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button">
        <ChevronLeft />
        <Text style={styles.backTitle} numberOfLines={1}>{diary?.title || tx.untitled}</Text>
      </Pressable>

      {!diary && !error && <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />}
      {!!error && <Text style={styles.error}>{error}</Text>}

      {diary && (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.paper}>
            <Text style={styles.paperTitle}>{diary.title || tx.untitled}</Text>
            <Text style={styles.meta}>
              {diary.mine ? tx.me : partner}  {formatDate(diary.created_at)}
            </Text>
            <Text style={styles.body}>{diary.content}</Text>
          </View>

          {corrections.length > 0 && (
            <View style={styles.paper}>
              <Text style={styles.paperTitle}>{tx.corrections}</Text>
              {corrections.map((c) => (
                <View key={c.id} style={styles.correction}>
                  <Text style={styles.original}>{c.original_text}</Text>
                  <Text style={styles.fixed}>→ {c.corrected_text}</Text>
                  {!!c.explanation && <Text style={styles.explain}>{c.explanation}</Text>}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 22 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingTop: 22, paddingBottom: 12 },
  backTitle: { flex: 1, fontSize: 14, color: colors.text },
  content: { paddingHorizontal: 18, paddingBottom: 24, gap: 14 },
  paper: { backgroundColor: colors.paper, borderRadius: 14, padding: 20, gap: 6 },
  paperTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  meta: { fontSize: 10, color: colors.placeholder },
  body: { marginTop: 10, fontSize: 13, lineHeight: 21, color: colors.text },
  correction: { marginTop: 8, gap: 2 },
  original: { fontSize: 12, color: colors.placeholder, textDecorationLine: 'line-through' },
  fixed: { fontSize: 13, color: colors.highlight },
  explain: { fontSize: 11, color: colors.text },
  error: { margin: 18, fontSize: 12, color: colors.error },
});
