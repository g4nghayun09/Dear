// P-014 마이 (시안: iPhone 13 & 24 / 40 / 41)  담당: 강태인
// - 내 정보(닉네임·이메일) + 로그아웃(확인 창)
// - 매칭 기록 목록(API-019): 진행 중인 매칭이 맨 위
// - 매칭을 누르면 나의 일기 / 친구 일기 미리보기, 진행 중이면 "교환 그만하기"(API-008)
// (매칭 시작은 교환일기 탭에서 함)
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ConfirmModal from '../../components/ConfirmModal';
import DearLogo from '../../components/DearLogo';
import { Bell, ChevronLeft } from '../../components/Icons';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { errorMessage } from '../../lib/errorMessage';
import { useLanguage } from '../../lib/i18n';
import { colors, radius } from '../../lib/theme';

const TEXT = {
  ko: {
    logout: '로그아웃',
    logoutConfirm: '로그아웃\n하시겠습니까?',
    cancel: '취소',
    ok: '확인',
    matchWith: (name) => `${name}님과의 매칭`,
    active: '교환 중',
    noMatches: '아직 매칭 기록이 없어요',
    myDiary: '나의 일기',
    friendDiary: '친구 일기',
    noDiary: '아직 일기가 없어요',
    untitled: '제목 없음',
    end: '교환 그만하기',
    endTitle: '교환을 그만할까요?',
    endMessage: (name) => `${name}님과의 매칭이 해제돼요.\n지금까지 주고받은 일기는 그대로 볼 수 있어요.`,
    endOk: '그만하기',
  },
  ja: {
    logout: 'ログアウト',
    logoutConfirm: 'ログアウト\nしますか？',
    cancel: 'キャンセル',
    ok: '確認',
    matchWith: (name) => `${name}さんとのマッチング`,
    active: '交換中',
    noMatches: 'まだマッチングの記録がありません',
    myDiary: '自分の日記',
    friendDiary: '友だちの日記',
    noDiary: 'まだ日記がありません',
    untitled: 'タイトルなし',
    end: '交換をやめる',
    endTitle: '交換をやめますか？',
    endMessage: (name) => `${name}さんとのマッチングが解除されます。\nこれまでの日記はそのまま見られます。`,
    endOk: 'やめる',
  },
};

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}

function ChevronRight() {
  return (
    <View style={{ transform: [{ rotate: '180deg' }] }}>
      <ChevronLeft size={14} color={colors.text} />
    </View>
  );
}

export default function MyPageScreen() {
  const [uiLang] = useLanguage();
  const tx = TEXT[uiLang] ?? TEXT.ko;
  const { profile, signOut } = useAuth();

  const [matches, setMatches] = useState(null); // null = 불러오는 중
  const [error, setError] = useState('');
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [selected, setSelected] = useState(null); // 누른 매칭
  const [endTarget, setEndTarget] = useState(null); // 해제 확인 창을 띄운 매칭
  const [ending, setEnding] = useState(false);

  // API-007 + API-019: 화면에 들어올 때마다 매칭 기록을 다시 불러옴
  const load = useCallback(async () => {
    try {
      const [current, past] = await Promise.all([api.getMyMatch(), api.getPastMatches()]);
      const list = (past ?? []).map((m) => ({ ...m, status: m.status ?? 'ended' }));
      if (current?.status === 'matched' && !list.some((m) => m.match_id === current.match_id)) {
        list.unshift({ match_id: current.match_id, status: 'active', partner: current.partner, started_at: current.started_at });
      }
      list.sort((a, b) => (a.status === 'active' ? -1 : 0) - (b.status === 'active' ? -1 : 0));
      setMatches(list);
      setError('');
    } catch (e) {
      setMatches([]);
      setError(errorMessage(e));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onLogout = async () => {
    setLogoutOpen(false);
    await signOut();
    router.replace('/login');
  };

  // API-008 매칭 해제
  const onEndMatch = async () => {
    setEnding(true);
    try {
      await api.endMatch();
    } catch (e) {
      if (e.code !== 'NO_ACTIVE_MATCH') setError(errorMessage(e)); // 상대가 먼저 해제했으면 그냥 갱신
    } finally {
      setEnding(false);
      setEndTarget(null);
      load();
    }
  };

  const partnerName = (m) => m?.partner?.nickname ?? '?';

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <DearLogo width={64} />
        <Bell />
      </View>

      <View style={styles.profile}>
        <View style={styles.flex}>
          <Text style={styles.name}>{profile?.nickname ?? ''}</Text>
          {!!profile?.email && <Text style={styles.email}>{profile.email}</Text>}
        </View>
        <Pressable onPress={() => setLogoutOpen(true)} style={({ pressed }) => [styles.logout, pressed && styles.pressed]} accessibilityRole="button">
          <Text style={styles.logoutText}>{tx.logout}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {matches === null && <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />}

        {matches?.map((m) => (
          <Pressable
            key={m.match_id}
            onPress={() => setSelected(m)}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Text style={styles.cardText}>{tx.matchWith(partnerName(m))}</Text>
            {m.status === 'active' && <Text style={styles.badge}>{tx.active}</Text>}
            <ChevronRight />
          </Pressable>
        ))}

        {matches?.length === 0 && !error && <Text style={styles.empty}>{tx.noMatches}</Text>}
        {!!error && <Text style={styles.error}>{error}</Text>}

      </ScrollView>

      <MatchDetailModal
        match={selected}
        tx={tx}
        onClose={() => setSelected(null)}
        onEnd={() => {
          // 모달 두 개를 겹치지 않도록 상세 창을 닫고 확인 창을 띄움
          setEndTarget(selected);
          setSelected(null);
        }}
        partnerName={partnerName}
      />

      <ConfirmModal
        visible={logoutOpen}
        title={tx.logoutConfirm}
        cancelText={tx.cancel}
        confirmText={tx.ok}
        onCancel={() => setLogoutOpen(false)}
        onConfirm={onLogout}
      />

      <ConfirmModal
        visible={!!endTarget}
        title={tx.endTitle}
        message={tx.endMessage(partnerName(endTarget))}
        cancelText={tx.cancel}
        confirmText={tx.endOk}
        onCancel={() => setEndTarget(null)}
        onConfirm={onEndMatch}
        loading={ending}
      />
    </SafeAreaView>
  );
}

// 시안 iPhone 13 & 40: 매칭을 누르면 나의 일기 / 친구 일기 (가장 최근 1개씩)
function MatchDetailModal({ match, tx, onClose, onEnd, partnerName }) {
  const [diaries, setDiaries] = useState(null);

  const visible = !!match;
  // 매칭을 누를 때마다 그 매칭의 일기를 불러옴
  useEffect(() => {
    if (!match) return undefined;
    let cancelled = false;
    setDiaries(null);
    api
      .getDiaries(match.match_id)
      .then((list) => !cancelled && setDiaries(list ?? []))
      .catch(() => !cancelled && setDiaries([]));
    return () => {
      cancelled = true;
    };
  }, [match]);

  const mine = diaries?.find((d) => d.mine);
  const friend = diaries?.find((d) => !d.mine);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{tx.matchWith(partnerName(match))}</Text>

          <Text style={styles.section}>{tx.myDiary}</Text>
          <DiaryCard diary={mine} loading={diaries === null} tx={tx} />

          <Text style={styles.section}>{tx.friendDiary}</Text>
          <DiaryCard diary={friend} loading={diaries === null} tx={tx} />

          {match?.status === 'active' && (
            <Pressable onPress={onEnd} style={({ pressed }) => [styles.endLink, pressed && styles.pressed]} accessibilityRole="button">
              <Text style={styles.endLinkText}>{tx.end}</Text>
            </Pressable>
          )}

          <Pressable onPress={onClose} style={({ pressed }) => [styles.cancel, pressed && styles.pressed]} accessibilityRole="button">
            <Text style={styles.cancelText}>{tx.cancel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function DiaryCard({ diary, loading, tx }) {
  return (
    <View style={styles.diary}>
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : diary ? (
        <>
          <View style={styles.flex}>
            <Text style={styles.diaryTitle} numberOfLines={1}>{diary.title || tx.untitled}</Text>
            <Text style={styles.diaryDate}>{formatDate(diary.created_at)}</Text>
          </View>
          <ChevronRight />
        </>
      ) : (
        <Text style={styles.diaryDate}>{tx.noDiary}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  pressed: { opacity: 0.6 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 22 },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 28,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  name: { fontSize: 17, fontWeight: '600', color: colors.text },
  email: { marginTop: 4, fontSize: 11, color: colors.placeholder },
  logout: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.placeholder },
  logoutText: { fontSize: 10, color: colors.text },
  list: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 24, gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E7DEDE',
    backgroundColor: '#fff',
  },
  cardText: { flex: 1, fontSize: 13, color: colors.text },
  badge: {
    fontSize: 10,
    color: colors.primaryText,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  empty: { marginTop: 24, textAlign: 'center', fontSize: 13, color: colors.placeholder },
  error: { textAlign: 'center', fontSize: 12, color: colors.error },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  sheet: { width: '100%', maxWidth: 340, backgroundColor: '#fff', borderRadius: 16, padding: 18, gap: 10 },
  sheetTitle: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 4 },
  section: { marginTop: 6, fontSize: 12, color: colors.text },
  diary: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E7DEDE',
  },
  diaryTitle: { fontSize: 13, color: colors.text },
  diaryDate: { marginTop: 4, fontSize: 10, color: colors.placeholder },
  endLink: { alignSelf: 'center', marginTop: 8, padding: 6 },
  endLinkText: { fontSize: 12, color: colors.error, textDecorationLine: 'underline' },
  cancel: { marginTop: 8, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.subtleButton },
  cancelText: { fontSize: 13, color: colors.text },
});
