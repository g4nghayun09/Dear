import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SearchIcon } from './Icons';
import { api } from '../lib/api';
import { colors } from '../lib/theme';
import { useT } from '../lib/i18n';

/**
 * 사전 찾아보기 (P-008)
 * 내 모국어(뜻)로 검색 → 학습 언어 단어를 고르면 onPick(단어) 로 돌려준다.
 *  lang : 결과 단어의 언어(학습 언어) 'ja' | 'ko'
 */
export default function DictionaryModal({ visible, lang, onPick, onClose }) {
  const t = useT();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return undefined;
    let cancelled = false;
    setLoading(true);
    setError('');
    // 글자를 칠 때마다 바로 부르지 않고 잠깐 기다림
    const timer = setTimeout(async () => {
      try {
        const res = await api.searchDictionary(query.trim(), lang);
        if (!cancelled) setResults(res?.results ?? []);
      } catch {
        if (!cancelled) {
          setResults([]);
          setError(t('error.dictionaryUnavailable'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [visible, query, lang, t]);

  const close = () => {
    setQuery('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={styles.box}>
          <View style={styles.searchBox}>
            <SearchIcon size={20} color={colors.text} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('diary.dictSearchPlaceholder')}
              placeholderTextColor={colors.placeholder}
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
          </View>

          <View style={styles.list}>
            {loading && results.length === 0 ? (
              <ActivityIndicator color={colors.primary} style={styles.center} />
            ) : (
              <FlatList
                data={results}
                keyExtractor={(item, i) => `${item.term}-${i}`}
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                ListEmptyComponent={
                  <Text style={styles.empty}>{error || t('diary.dictEmpty')}</Text>
                }
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => {
                      setQuery('');
                      onPick(item);
                    }}
                    style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                    accessibilityRole="button"
                  >
                    {!!item.pos && (
                      <View style={styles.tag}>
                        <Text style={styles.tagText}>{item.pos}</Text>
                      </View>
                    )}
                    <View style={styles.cardRow}>
                      <View style={styles.termBox}>
                        <Text style={styles.term}>{item.term}</Text>
                        {!!item.reading && <Text style={styles.reading}>{item.reading}</Text>}
                      </View>
                      <Text style={styles.meaning}>{item.meaning}</Text>
                    </View>
                  </Pressable>
                )}
              />
            )}
          </View>

          <Pressable onPress={close} style={({ pressed }) => [styles.cancel, pressed && styles.cardPressed]} accessibilityRole="button">
            <Text style={styles.cancelText}>{t('common.cancel')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  box: { width: '100%', maxWidth: 420, maxHeight: '82%', backgroundColor: '#fff', borderRadius: 24, padding: 20 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F2F2F2', borderRadius: 14, paddingHorizontal: 14, height: 44 },
  searchInput: { flex: 1, fontSize: 13, color: colors.text, ...Platform.select({ web: { outlineStyle: 'none' }, default: {} }) },
  list: { marginTop: 14, flexShrink: 1, minHeight: 120 },
  center: { marginTop: 30 },
  empty: { textAlign: 'center', fontSize: 12, color: colors.placeholder, marginTop: 30 },
  card: { borderWidth: 1, borderColor: '#ECECEC', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#fff' },
  cardPressed: { opacity: 0.6 },
  tag: { alignSelf: 'flex-start', backgroundColor: '#DCE8F6', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  tagText: { fontSize: 11, color: colors.text },
  cardRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 6 },
  termBox: { flexShrink: 1 },
  term: { fontSize: 17, fontWeight: '600', color: colors.text },
  reading: { fontSize: 10, color: colors.text },
  meaning: { fontSize: 13, color: colors.text, marginLeft: 12 },
  cancel: { marginTop: 14, height: 48, borderRadius: 14, backgroundColor: colors.subtleButton, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 14, color: colors.text, fontWeight: '600' },
});
