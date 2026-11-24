// P-014 마이 (시안: iPhone 13 & 24 / 40 / 41)  담당: 강태인
// - 내 정보(닉네임·이메일) + 로그아웃(확인 창)
// - 매칭 기록 목록(API-019): 진행 중인 매칭이 맨 위
// - 매칭을 누르면 나의 일기 / 친구 일기 미리보기, 진행 중이면 "교환 그만하기"(API-008)
// (매칭 시작은 교환일기 탭에서 함)
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ConfirmModal from '../../components/ConfirmModal';
import DearLogo from '../../components/DearLogo';
import { Bell, ChevronLeft } from '../../components/Icons';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { errorMessage } from '../../lib/errorMessage';
import { t, useLanguage } from '../../lib/i18n';
import { colors, radius } from '../../lib/theme';
import { learningLang } from '../../lib/validation';

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
    keyboardGuideTitle: (name) => `${name} 자판 추가하기`,
    iosTab: 'iPhone',
    androidTab: '안드로이드',
    settingsSection: '키보드 설정 안내',
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
    keyboardGuideTitle: (name) => `${name}キーボードを追加する`,
    iosTab: 'iPhone',
    androidTab: 'Android',
    settingsSection: 'キーボード設定案内',
  },
};

// 학습 언어 자판 설정 안내 (시안엔 없지만 마이 화면에 추가) — 글은 UI 언어(=내 모국어)로, langName 자리엔 학습 언어 이름이 들어감
const KEYBOARD_GUIDE_STEPS = {
  ko: {
    ios: (langName) => [
      '설정 앱을 엽니다.',
      '일반 → 키보드 → 키보드로 들어갑니다.',
      '"새로운 키보드 추가..."를 누릅니다.',
      `${langName}를 선택합니다. (필요하면 입력 방식도 고를 수 있어요)`,
      '일기 쓸 때 키보드의 지구본(🌐) 아이콘을 눌러 전환하세요.',
    ],
    android: (langName) => [
      '설정 앱을 엽니다.',
      '시스템 → 언어 및 입력 → 화면 키보드 → Gboard로 들어갑니다. (제조사마다 경로가 조금 달라요)',
      '언어 → 언어 추가를 누릅니다.',
      `${langName}를 선택합니다.`,
      '일기 쓸 때 스페이스바를 길게 누르거나 지구본 아이콘으로 전환하세요.',
    ],
  },
  ja: {
    ios: (langName) => [
      '設定アプリを開きます。',
      '一般 → キーボード → キーボードに入ります。',
      '「新しいキーボードを追加...」をタップします。',
      `${langName}を選択します。(入力方式も選べます)`,
      '日記を書くときはキーボードの地球儀(🌐)アイコンで切り替えてください。',
    ],
    android: (langName) => [
      '設定アプリを開きます。',
      'システム → 言語と入力 → 画面キーボード → Gboard に入ります。(メーカーによって経路が少し異なります)',
      '言語 → 言語を追加をタップします。',
      `${langName}を選択します。`,
      '日記を書くときはスペースキーを長押しするか、地球儀アイコンで切り替えてください。',
    ],
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
  const [keyboardGuideOpen, setKeyboardGuideOpen] = useState(false);

  const learnLang = learningLang(profile?.native_lang);
  const learnLangName = t(`signup.langName.${learnLang}`);

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

        <View style={styles.divider} />
        <Pressable
          onPress={() => setKeyboardGuideOpen(true)}
          style={({ pressed }) => [styles.footerLink, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <Text style={styles.footerLinkText}>{tx.settingsSection}</Text>
        </Pressable>
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

      <KeyboardGuideModal
        visible={keyboardGuideOpen}
        uiLang={uiLang}
        langName={learnLangName}
        tx={tx}
        onClose={() => setKeyboardGuideOpen(false)}
      />
    </SafeAreaView>
  );
}

// 학습 언어(상대 모국어) 자판을 기기에 추가하는 방법 안내 — iPhone / Android 탭
function KeyboardGuideModal({ visible, uiLang, langName, tx, onClose }) {
  const [platform, setPlatform] = useState(Platform.OS === 'android' ? 'android' : 'ios');
  const steps = (KEYBOARD_GUIDE_STEPS[uiLang] ?? KEYBOARD_GUIDE_STEPS.ko)[platform](langName);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{tx.keyboardGuideTitle(langName)}</Text>

          <View style={styles.osTabs}>
            {['ios', 'android'].map((p) => (
              <Pressable
                key={p}
                onPress={() => setPlatform(p)}
                style={[styles.osTab, platform === p && styles.osTabActive]}
                accessibilityRole="tab"
                accessibilityState={{ selected: platform === p }}
              >
                <Text style={[styles.osTabText, platform === p && styles.osTabTextActive]}>
                  {p === 'ios' ? tx.iosTab : tx.androidTab}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.guideList}>
            {steps.map((step, i) => (
              <View key={i} style={styles.guideStep}>
                <Text style={styles.guideStepNum}>{i + 1}</Text>
                <Text style={styles.guideStepText}>{step}</Text>
              </View>
            ))}
          </View>

          <Pressable onPress={onClose} style={({ pressed }) => [styles.cancel, pressed && styles.pressed]} accessibilityRole="button">
            <Text style={styles.cancelText}>{tx.cancel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
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
  list: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 24, gap: 12 },
  divider: { marginTop: 10, height: 1, backgroundColor: colors.line },
  footerLink: { paddingVertical: 4 },
  footerLinkText: { fontSize: 12, color: colors.placeholder },
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
  osTabs: { flexDirection: 'row', gap: 8, marginTop: 4 },
  osTab: { flex: 1, height: 36, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  osTabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  osTabText: { fontSize: 12, color: colors.text },
  osTabTextActive: { color: colors.primaryText, fontWeight: '600' },
  guideList: { marginTop: 8, gap: 12 },
  guideStep: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  guideStepNum: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: colors.paper, color: colors.text,
    fontSize: 11, fontWeight: '600', textAlign: 'center', lineHeight: 20,
  },
  guideStepText: { flex: 1, fontSize: 13, lineHeight: 19, color: colors.text },
});
