import { useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import DearLogo from '../../components/DearLogo';
import DiaryBodyInput from '../../components/DiaryBodyInput';
import DictionaryModal from '../../components/DictionaryModal';
import { Bell } from '../../components/Icons';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { errorMessage } from '../../lib/errorMessage';
import { MAX_LENGTH, MIN_LINES, checkDiaryInput } from '../../lib/languageCheck';
import { colors } from '../../lib/theme';
import { DIARY_TITLE_MAX, learningLang } from '../../lib/validation';
import { useT } from '../../lib/i18n';

// 일기 작성 (P-007): 학습 언어로 쓰고, 모르는 단어는 사전에서 찾아 넣고, 상대에게 보낸다
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

  // 입력은 막지 않고(한글/일본어 조합 중에 글자가 깨지지 않게), 보내기만 막는다
  const check = useMemo(() => checkDiaryInput(content, lang), [content, lang]);

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

  const onSend = async () => {
    setSending(true);
    setError('');
    try {
      await api.sendDiary({ title: title.trim(), content });
      router.replace('/home'); // 홈 달력에 오늘이 파랗게 표시됨
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSending(false);
    }
  };

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
              placeholder={t('diary.bodyPlaceholder', { lang: langName })}
              minHeight={300}
            />
          </View>

          <Text style={[styles.hint, !(hint || error) && styles.hidden]} accessibilityLiveRegion="polite">
            {error || hint || ' '}
          </Text>
          <Text style={styles.counter}>
            {check.length}/{MAX_LENGTH}
          </Text>
        </ScrollView>

        <View style={styles.actions}>
          <Pressable onPress={() => router.back()} disabled={sending} style={[styles.action, styles.cancel]} accessibilityRole="button">
            <Text style={styles.cancelText}>{t('common.cancel')}</Text>
          </Pressable>
          <Pressable
            onPress={onSend}
            disabled={!check.canSend || sending}
            style={[styles.action, styles.send, (!check.canSend || sending) && styles.disabled]}
            accessibilityRole="button"
          >
            <Text style={styles.sendText}>{t('diary.send')}</Text>
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
  counter: { alignSelf: 'flex-end', marginTop: 2, fontSize: 11, color: colors.placeholder },
  actions: { flexDirection: 'row', gap: 12, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 14 },
  action: { flex: 1, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cancel: { backgroundColor: colors.subtleButton },
  cancelText: { fontSize: 14, color: colors.text, fontWeight: '600' },
  send: { flex: 1.5, backgroundColor: colors.primary },
  sendText: { fontSize: 14, color: colors.primaryText, fontWeight: '600' },
  disabled: { opacity: 0.4 },
});
