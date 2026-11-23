// 교환일기 탭 (시안: iPhone 13 & 22 나의 일기 / 35 친구 일기)
// - 교환 상대가 없으면: 안내 문구 (매칭은 홈 → 일기 쓰기 → "매칭" 버튼에서 함)
// - 교환 중이면: 나의 일기 / 친구 일기 목록 → 누르면 일기 상세
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import DearLogo from '../../../components/DearLogo';
import { Bell } from '../../../components/Icons';
import { api } from '../../../lib/api';
import { errorMessage } from '../../../lib/errorMessage';
import { useLanguage } from '../../../lib/i18n';
import { colors, radius } from '../../../lib/theme';

const TEXT = {
  ko: {
    mine: '나의 일기',
    friend: '친구 일기',
    me: '나',
    untitled: '제목 없음',
    emptyMine: '아직 보낸 일기가 없어요.\n홈에서 오늘의 일기를 써 보세요.',
    emptyFriend: '아직 받은 일기가 없어요',
    corrected: '첨삭',
    noMatchTitle: '아직 교환 상대가 없어요',
    noMatchDesc: '홈에서 오늘의 일기를 쓰고 매칭해 보세요.',
    waitingTitle: '교환일기 친구를 찾는 중이에요',
    waitingDesc: '연결되면 일기가 바로 전송돼요.',
  },
  ja: {
    mine: '自分の日記',
    friend: '友だちの日記',
    me: '自分',
    untitled: 'タイトルなし',
    emptyMine: 'まだ送った日記がありません。\nホームで今日の日記を書いてみましょう。',
    emptyFriend: 'まだ届いた日記がありません',
    corrected: '添削',
    noMatchTitle: 'まだ交換相手がいません',
    noMatchDesc: 'ホームで今日の日記を書いてマッチングしてみましょう。',
    waitingTitle: '交換日記の友だちを探しています',
    waitingDesc: 'つながったらすぐに日記が送られます。',
  },
};

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function ExchangeScreen() {
  const [uiLang] = useLanguage();
  const tx = TEXT[uiLang] ?? TEXT.ko;

  const [match, setMatch] = useState(null); // API-007 응답, null = 확인 중
  const [diaries, setDiaries] = useState(null);
  const [tab, setTab] = useState('mine'); // mine | friend
  const [error, setError] = useState('');

  const loadDiaries = useCallback(async (matchId) => {
    try {
      setDiaries((await api.getDiaries(matchId)) ?? []);
    } catch (e) {
      setDiaries([]);
      setError(errorMessage(e));
    }
  }, []);

  // 탭에 들어올 때마다: 매칭 상태 확인 → 교환 중이면 일기 목록
  const load = useCallback(async () => {
    setError('');
    try {
      const res = await api.getMyMatch();
      setMatch(res);
      if (res?.status === 'matched') loadDiaries(res.match_id);
    } catch (e) {
      setMatch({ status: 'none' });
      setError(errorMessage(e));
    }
  }, [loadDiaries]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const header = (
    <View style={styles.header}>
      <DearLogo width={64} />
      <Bell />
    </View>
  );

  if (!match) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        {header}
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  // 교환 상대가 없으면 안내만 (매칭은 홈의 일기 쓰기에서)
  if (match.status !== 'matched') {
    const waiting = match.status === 'waiting';
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        {header}
        <View style={styles.noMatch}>
          <Text style={styles.noMatchTitle}>{waiting ? tx.waitingTitle : tx.noMatchTitle}</Text>
          <Text style={styles.empty}>{error || (waiting ? tx.waitingDesc : tx.noMatchDesc)}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const partner = match.partner?.nickname ?? '';
  const list = (diaries ?? []).filter((d) => (tab === 'mine' ? d.mine : !d.mine));

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {header}

      <View style={styles.tabs}>
        {['mine', 'friend'].map((key) => (
          <Pressable key={key} onPress={() => setTab(key)} style={styles.tab} accessibilityRole="tab" accessibilityState={{ selected: tab === key }}>
            <Text style={[styles.tabText, tab === key && styles.tabActive]}>{key === 'mine' ? tx.mine : tx.friend}</Text>
          </Pressable>
        ))}
      </View>

      {diaries === null ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(d) => String(d.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>{error || (tab === 'mine' ? tx.emptyMine : tx.emptyFriend)}</Text>
          }
          renderItem={({ item }) => {
            const isNew = !item.mine && !item.read_at;
            const corrected = String(item.status ?? '').toLowerCase() === 'corrected';
            return (
              <Pressable
                onPress={() => router.push({ pathname: '/exchange/[id]', params: { id: String(item.id), partner } })}
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <View style={styles.flex}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.title || tx.untitled}</Text>
                  <Text style={styles.cardMeta}>
                    {item.mine ? tx.me : partner}  {formatDate(item.created_at)}
                  </Text>
                </View>
                {isNew && <Text style={styles.badge}>New</Text>}
                {!isNew && corrected && <Text style={styles.badge}>{tx.corrected}</Text>}
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  pressed: { opacity: 0.6 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 22 },
  tabs: { flexDirection: 'row', gap: 18, paddingHorizontal: 18, paddingTop: 26, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  tab: { paddingVertical: 4 },
  tabText: { fontSize: 13, color: colors.placeholder },
  tabActive: { color: colors.text, fontWeight: '600' },
  list: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 24, gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E7DEDE',
    backgroundColor: '#fff',
  },
  cardTitle: { fontSize: 14, color: colors.text },
  cardMeta: { marginTop: 4, fontSize: 10, color: colors.placeholder },
  badge: {
    fontSize: 10,
    color: '#4A7BB7',
    backgroundColor: '#E5EEF8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  noMatch: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 28 },
  noMatchTitle: { fontSize: 15, fontWeight: '600', color: colors.text, textAlign: 'center' },
  empty: { marginTop: 40, textAlign: 'center', fontSize: 13, lineHeight: 20, color: colors.placeholder },
});
