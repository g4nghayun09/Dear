// 단어장 — 일기별 보기에서 날짜를 눌렀을 때 (시안: iPhone 13 & 29)
// 그 날 보낸 내 일기에서 나온 단어만 보여줌
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import DearLogo from '../../../components/DearLogo';
import VocabCard from '../../../components/VocabCard';
import { Bell, ChevronLeft } from '../../../components/Icons';
import { api } from '../../../lib/api';
import { errorMessage } from '../../../lib/errorMessage';
import { useT } from '../../../lib/i18n';
import { colors } from '../../../lib/theme';

export default function VocabDayScreen() {
  const t = useT();
  const { day } = useLocalSearchParams();
  const [items, setItems] = useState(null); // null = 불러오는 중
  const [error, setError] = useState('');

  const now = new Date();
  const dayNum = Number(day);
  const title = `${now.getFullYear()}.${now.getMonth() + 1}.${dayNum}`;

  useEffect(() => {
    let cancelled = false;
    api
      .getVocab()
      .then((res) => {
        if (cancelled) return;
        const rows = (res ?? []).filter((v) => {
          const d = new Date(v.created_at);
          return !Number.isNaN(d.getTime()) && d.getFullYear() === now.getFullYear() && d.getMonth() + 1 === now.getMonth() + 1 && d.getDate() === dayNum;
        });
        setItems(rows);
      })
      .catch((e) => {
        if (cancelled) return;
        setItems([]);
        setError(errorMessage(e));
      });
    return () => {
      cancelled = true;
    };
  }, [dayNum]);

  const tagLabel = (item) => (item.source === 'correction' ? t('vocab.correctionTag') : t('diary.dictBasicForm'));

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <DearLogo width={64} />
        <Bell />
      </View>

      <Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button">
        <ChevronLeft />
        <Text style={styles.backTitle}>{title}</Text>
      </Pressable>

      {items === null ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={<Text style={styles.empty}>{error || t('vocab.noWordsThatDay')}</Text>}
          renderItem={({ item }) => <VocabCard item={item} tagLabel={tagLabel(item)} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 22 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingTop: 22, paddingBottom: 12 },
  backTitle: { fontSize: 14, color: colors.text },
  list: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 24 },
  empty: { marginTop: 40, textAlign: 'center', fontSize: 13, lineHeight: 20, color: colors.placeholder },
});
