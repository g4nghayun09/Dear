import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Redirect, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Brand from '../components/Brand';
import Select from '../components/Select';
import { ChevronLeft } from '../components/Icons';
import ConfirmModal from '../components/ConfirmModal';
import { useAuth } from '../lib/auth';
import { errorMessage } from '../lib/errorMessage';
import { NICKNAME_MAX, validateNickname } from '../lib/validation';
import { colors, radius } from '../lib/theme';

// 국가 선택 = 모국어(native_lang). 학습 언어는 반대 언어
const LANG_OPTIONS = [
  { value: 'ko', label: 'South Korea' },
  { value: 'ja', label: 'Japan' },
];
const LANG_NAME = { ko: '한국어', ja: '일본어' };

function confirmMessage(lang) {
  if (!lang) return '';
  const learn = lang === 'ko' ? '일본어' : '한국어';
  const partner = lang === 'ko' ? '일본인' : '한국인';
  return `${learn}로 일기를 쓰고 ${partner} 친구와 매칭돼요.\n가입 후에는 바꿀 수 없어요.`;
}

export default function SignupScreen() {
  const { isLoggedIn, profile, loading, signup, signOut } = useAuth();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [nickname, setNickname] = useState('');
  const [nativeLang, setNativeLang] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!loading && !isLoggedIn) return <Redirect href="/login" />;
  if (!loading && profile) return <Redirect href="/home" />;

  const trimmed = nickname.trim();
  
  const onBack = async () => {
    await signOut(); // 가입을 취소하면 로그인 화면으로
    router.replace('/login');
  };

  // 시작하기 → 입력 확인 → 모국어 확인 모달(P-004)
  const onSubmit = () => {
    const nicknameError = validateNickname(trimmed);
    if (nicknameError) return setError(nicknameError);
    if (!nativeLang) return setError('국가 및 언어를 선택해 주세요.');
    setError('');
    setConfirming(true);
  };

  // 모달에서 확인 → API-004
  const onConfirm = async () => {
    setSaving(true);
    try {
      await signup({ nickname: trimmed, native_lang: nativeLang });
      setConfirming(false);
      router.replace('/home');
    } catch (e) {
      setConfirming(false);
      setError(errorMessage(e, 'profile'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Brand />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.sheetArea, { top: height * 0.44 }]}
      >
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 30 }]}>
          <Pressable onPress={onBack} style={styles.header} hitSlop={12} accessibilityRole="button" accessibilityLabel="뒤로">
            <ChevronLeft />
            <Text style={styles.headerText}>가입하기</Text>
          </Pressable>

          <Text style={styles.label}>닉네임</Text>
          <TextInput
            value={nickname}
            onChangeText={(t) => setNickname(t.slice(0, NICKNAME_MAX))}
            placeholder="디어"
            placeholderTextColor={colors.placeholder}
            style={styles.input}
            maxLength={NICKNAME_MAX}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="done"
          />

          <Text style={[styles.label, styles.labelGap]}>국가 및 언어 설정</Text>
          <Select value={nativeLang} options={LANG_OPTIONS} onChange={setNativeLang} />

          <Text style={styles.error}>{error}</Text>

          <View style={styles.spacer} />

          <Pressable
            onPress={onSubmit}
            disabled={saving || confirming}
            accessibilityRole="button"
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonText}>시작하기</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <ConfirmModal
        visible={confirming}
        title={`모국어가 ${LANG_NAME[nativeLang] ?? ''}인가요?`}
        message={confirmMessage(nativeLang)}
        confirmText="확인"
        cancelText="다시 선택"
        loading={saving}
        onCancel={() => setConfirming(false)}
        onConfirm={onConfirm}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  sheetArea: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  sheet: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: 40,
    paddingTop: 36,
    // 시안의 옅은 위쪽 그림자
    shadowColor: colors.sheetShadow,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'flex-start' },
  headerText: { fontSize: 14, color: colors.text },
  label: { marginTop: 30, marginBottom: 10, fontSize: 12, color: colors.text },
  labelGap: { marginTop: 28 },
  input: {
    height: 49,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: 16,
    fontSize: 12,
    color: colors.text,
    ...Platform.select({ web: { outlineStyle: 'none' }, default: {} }),
  },
  error: { marginTop: 10, minHeight: 16, fontSize: 12, color: colors.error },
  spacer: { flex: 1, minHeight: 12 },
  button: {
    height: 55,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: { opacity: 0.8 },
  buttonText: { fontSize: 14, color: colors.primaryText, fontWeight: '500' },
});
