import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../lib/theme';

// 단어장 카드: 사전에서 찾은 단어(기본형) / 상대가 첨삭해 준 단어 — 전체보기·일기별 보기에서 같이 씀
export default function VocabCard({ item, tagLabel }) {
  return (
    <View style={styles.card}>
      {!!tagLabel && (
        <View style={styles.tag}>
          <Text style={styles.tagText}>{tagLabel}</Text>
        </View>
      )}
      <View style={styles.row}>
        <View style={styles.termBox}>
          <Text style={styles.term}>{item.term}</Text>
          {!!item.reading && <Text style={styles.reading}>{item.reading}</Text>}
        </View>
        <Text style={styles.meaning} numberOfLines={1}>{item.meaning}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: '#E7DEDE', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: '#fff' },
  tag: { alignSelf: 'flex-start', backgroundColor: '#DCE8F6', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  tagText: { fontSize: 11, color: colors.text },
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 8, gap: 12 },
  termBox: { flexShrink: 1 },
  term: { fontSize: 18, fontWeight: '600', color: colors.text },
  reading: { marginTop: 2, fontSize: 10, color: colors.placeholder },
  meaning: { fontSize: 16, color: colors.text, flexShrink: 1, textAlign: 'right' },
});
