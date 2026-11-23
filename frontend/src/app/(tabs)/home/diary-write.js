import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import DearLogo from '../../../components/DearLogo';
import DiaryBodyInput from '../../../components/DiaryBodyInput';
import DictionaryModal from '../../../components/DictionaryModal';
import { Bell } from '../../../components/Icons';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth';
import { errorMessage } from '../../../lib/errorMessage';
import { MAX_LENGTH, MIN_LINES, checkDiaryInput } from '../../../lib/languageCheck';
import { colors } from '../../../lib/theme';
import { DIARY_TITLE_MAX, learningLang } from '../../../lib/validation';
import { useLanguage, useT } from '../../../lib/i18n';

// 매칭 문구 (FR-006·007 일기 쓰고 매칭하기, 담당: 강태인)
const MATCH_TEXT = {
  ko: {
    match: '매칭',
    waiting: '교환일기 친구를 찾는 중이에요. 연결되면 일기가 바로 전송돼요.',
    cancelMatch: '매칭 취소',
  },
  ja: {
    match: 'マッチング',
    waiting: '交換日記の友だちを探しています。つながったらすぐに日記が送られます。',
    cancelMatch: 'マッチングをやめる',
  },
};
const POLL_MS = 5000; // 매칭 대기 중 상태 확인 간격

// 일기 작성 (P-007): 학습 언어로 쓰고, 모르는 단어는 사전에서 찾아 넣고, 상대에게 보낸다
// 교환 상대가 없으면 "매칭" 버튼: 매칭 신청 → 연결되면 이 일기를 바로 전송한다
export default function WriteScreen() {
  const t = useT();
  const { profile } = useAuth();
  const lang = learningLang(profile.native_lang); // 일기를 쓸 언어(학습 언어)
  const langName = t(`signup.langName.${lang}`);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  // 커서 위치는 평소에는 입력칸에 맡기고(IME 입력 중 커서가 튀지 않게), 단어를 넣은 직후에만 지정한다
  const selectionRef = useRef(null);
  const [forcedSelection, setForcedSelection] = useState(undefined);
  const [words, setWords] = useState([]); // 사전에서 넣은 단어 (주황색 표시)
  const [dictOpen, setDictOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [uiLang] = useLanguage();
  const mtx = MATCH_TEXT[uiLang] ?? MATCH_TEXT.ko;
  const [matchStatus, setMatchStatus] = useState(null); // null(확인 중) | none | waiting | matched
  const mounted = useRef(true);
  const draft = useRef({ title: '', content: '' }); // 매칭을 기다리는 동안 보낼 일기

  // 입력은 막지 않고(한글/일본어 조합 중에 글자가 깨지지 않게), 보내기만 막는다
  const [visualLines, setVisualLines] = useState(0); // 입력칸에 보이는 줄 수 (자동 줄바꿈 포함)
  const check = useMemo(() => checkDiaryInput(content, lang, visualLines), [content, lang, visualLines]);

  // 입력 상태에 따른 안내 문구
  let hint = '';
  if (check.problem === 'invalid_chars') hint = t('diary.invalidChars', { lang: langName, chars: check.invalidChars.slice(0, 5).join(' ') });
  else if (check.problem === 'too_long') hint = t('diary.tooLong', { max: MAX_LENGTH });
  else if (check.problem === 'too_few_lines') hint = t('diary.tooFewLines', { min: MIN_LINES });

  // 사전에서 고른 단어를 커서 위치에 넣는다
  const insertWord = (item) => {
    const start = selectionRef.current?.start ?? content.length;
    const end = selectionRef.current?.end ?? start;
    setContent(content.slice(0, start) + item.term + content.slice(end));
    setWords((prev) => (prev.includes(item.term) ? prev : [...prev, item.term]));
    const pos = start + item.term.length;
    selectionRef.current = { start: pos, end: pos };
    setForcedSelection({ start: pos, end: pos });
    setDictOpen(false);
  };

  // API-007: 들어올 때 교환 상대가 있는지 확인 (없으면 버튼이 "매칭")
  useEffect(() => {
    mounted.current = true;
    api
      .getMyMatch()
      .then((res) => mounted.current && setMatchStatus(res?.status ?? 'none'))
      .catch(() => mounted.current && setMatchStatus('none'));
    return () => {
      mounted.current = false;
    };
  }, []);

  // API-009 일기 전송
  const sendNow = useCallback(async ({ title: t0, content: c0 }) => {
    await api.sendDiary({ title: t0, content: c0 });
    router.replace('/home'); // 홈 달력에 오늘이 파랗게 표시됨
  }, []);

  // 매칭 대기 중: 상대가 들어오면 기다리던 일기를 바로 전송
  useEffect(() => {
    if (matchStatus !== 'waiting') return undefined;
    const timer = setInterval(async () => {
      try {
        const res = await api.getMyMatch();
        if (!mounted.current || res?.status !== 'matched') return;
        clearInterval(timer);
        setMatchStatus('matched');
        await sendNow(draft.current);
      } catch (e) {
        if (mounted.current) setError(errorMessage(e));
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [matchStatus, sendNow]);

  const onSend = async () => {
    setSending(true);
    setError('');
    draft.current = { title: title.trim(), content };
    try {
      if (matchStatus === 'matched') {
        await sendNow(draft.current);
        return;
      }
      // API-006 매칭 신청: 바로 연결되면 전송, 아니면 대기
      let status = 'waiting';
      try {
        status = (await api.requestMatch())?.status ?? 'waiting';
      } catch (e) {
        if (e.code !== 'ALREADY_MATCHED') throw e;
        status = 'matched';
      }
      if (status === 'matched') {
        setMatchStatus('matched');
        await sendNow(draft.current);
      } else {
        setMatchStatus('waiting');
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      if (mounted.current) setSending(false);
    }
  };

  // API-020 매칭 대기 취소 (쓴 일기는 그대로 남음)
  const onCancelMatch = async () => {
    try {
      await api.cancelWaiting();
    } catch (e) {
      if (e.code !== 'NOT_WAITING') setError(errorMessage(e));
    }
    setMatchStatus('none');
  };

  const waiting = matchStatus === 'waiting';

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <DearLogo width={64} />
        <Bell />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => setDictOpen(true)} style={({ pressed }) => [styles.dictButton, pressed && styles.pressed]} accessibilityRole="button">
            <Text style={styles.dictText}>{t('diary.dictionary')}</Text>
          </Pressable>

          <View style={styles.card}>
            <TextInput
              value={title}
              onChangeText={(v) => setTitle(v.slice(0, DIARY_TITLE_MAX))}
              placeholder={t('diary.titlePlaceholder')}
              placeholderTextColor={colors.placeholder}
              maxLength={DIARY_TITLE_MAX}
              style={styles.title}
              autoCorrect={false}
            />
            <View style={styles.bodyGap} />
            <DiaryBodyInput
              value={content}
              onChangeText={setContent}
              selection={forcedSelection}
              onSelectionChange={(sel) => {
                selectionRef.current = sel;
                setForcedSelection(undefined);
              }}
              highlights={words}
              onLineCountChange={setVisualLines}
              placeholder={t('diary.bodyPlaceholder', { lang: langName })}
              minHeight={300}
            />
          </View>

          <Text style={[styles.hint, waiting && !error && styles.waiting, !(hint || error || waiting) && styles.hidden]} accessibilityLiveRegion="polite">
            {error || (waiting ? mtx.waiting : hint) || ' '}
          </Text>
          <Text style={styles.counter}>
            {check.length}/{MAX_LENGTH}
          </Text>
        </ScrollView>

        <View style={styles.actions}>
          <Pressable
            onPress={waiting ? onCancelMatch : () => router.back()}
            disabled={sending}
            style={[styles.action, styles.cancel]}
            accessibilityRole="button"
          >
            <Text style={styles.cancelText}>{waiting ? mtx.cancelMatch : t('common.cancel')}</Text>
          </Pressable>
          <Pressable
            onPress={onSend}
            disabled={!check.canSend || sending || waiting || matchStatus === null}
            style={[styles.action, styles.send, (!check.canSend || sending || waiting || matchStatus === null) && styles.disabled]}
            accessibilityRole="button"
          >
            {sending || waiting ? (
              <ActivityIndicator color={colors.primaryText} />
            ) : (
              <Text style={styles.sendText}>{matchStatus === 'matched' ? t('diary.send') : mtx.match}</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <DictionaryModal visible={dictOpen} lang={lang} onPick={insertWord} onClose={() => setDictOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 22, paddingBottom: 14 },
  content: { paddingHorizontal: 18, paddingBottom: 8 },
  dictButton: { height: 44, borderRadius: 10, borderWidth: 1, borderColor: '#E2DADA', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  dictText: { fontSize: 13, color: colors.text },
  pressed: { opacity: 0.6 },
  card: { marginTop: 14, backgroundColor: colors.paper, borderRadius: 14, borderWidth: 1, borderColor: '#E7DEDE', paddingHorizontal: 22, paddingTop: 22, paddingBottom: 26 },
  title: { fontSize: 14, fontWeight: '700', color: colors.text, padding: 0, ...Platform.select({ web: { outlineStyle: 'none' }, default: {} }) },
  bodyGap: { height: 26 },
  hint: { marginTop: 10, fontSize: 12, color: colors.error, minHeight: 16 },
  hidden: { opacity: 0 },
  waiting: { color: colors.text },
  counter: { alignSelf: 'flex-end', marginTop: 2, fontSize: 11, color: colors.placeholder },
  actions: { flexDirection: 'row', gap: 12, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 14 },
  action: { flex: 1, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cancel: { backgroundColor: colors.subtleButton },
  cancelText: { fontSize: 14, color: colors.text, fontWeight: '600' },
  send: { backgroundColor: colors.primary },
  sendText: { fontSize: 14, color: colors.primaryText, fontWeight: '600' },
  disabled: { opacity: 0.4 },
});
