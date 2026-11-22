// 일기 작성 화면의 학습 언어 안내 + 경고 문구 (FR-010, 담당: 강태인)
// useDiaryInputCheck 결과(check)를 그대로 넘기면 됩니다. 문구는 앱 UI 언어(모국어)로 나옵니다.
import { StyleSheet, Text, View } from 'react-native';
import { MAX_LENGTH, MIN_LINES } from '../lib/languageCheck';
import { useLanguage } from '../lib/i18n';
import { colors, radius } from '../lib/theme';

const TEXT = {
  ko: {
    name: { ja: '일본어', ko: '한국어' },
    guide: (n) => `${n}로 작성해요 · 키보드를 ${n}로 바꿔 주세요`,
    invalid_chars: (n, chars) => `${n}로만 쓸 수 있어요 (쓸 수 없는 글자: ${chars})`,
    too_long: () => `${MAX_LENGTH}자 이하로 써 주세요`,
    too_few_lines: () => `${MIN_LINES}줄 이상 써 주세요`,
  },
  ja: {
    name: { ja: '日本語', ko: '韓国語' },
    guide: (n) => `${n}で書きましょう · キーボードを${n}に切り替えてください`,
    invalid_chars: (n, chars) => `${n}だけで書けます（使えない文字：${chars}）`,
    too_long: () => `${MAX_LENGTH}文字以内で書いてください`,
    too_few_lines: () => `${MIN_LINES}行以上書いてください`,
  },
};

export function languageCheckMessage(check, lang, uiLang) {
  const tx = TEXT[uiLang] ?? TEXT.ko;
  if (!check.problem) return null;
  return tx[check.problem](tx.name[lang], check.invalidChars.slice(0, 5).join(' '));
}

export default function LanguageCheckNotice({ lang, check }) {
  const [uiLang] = useLanguage();
  const tx = TEXT[uiLang] ?? TEXT.ko;
  const message = languageCheckMessage(check, lang, uiLang);

  return (
    <View style={styles.wrap}>
      <View style={styles.guide}>
        <Text style={styles.guideText}>
          {lang === 'ja' ? '🇯🇵' : '🇰🇷'} {tx.guide(tx.name[lang])}
        </Text>
      </View>
      <View style={styles.row}>
        <Text style={[styles.warning, !message && styles.hidden]} accessibilityLiveRegion="polite">
          {message ?? ' '}
        </Text>
        <Text style={[styles.counter, check.length > MAX_LENGTH && styles.counterOver]}>
          {check.length}/{MAX_LENGTH}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  guide: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.input, paddingVertical: 8, paddingHorizontal: 12 },
  guideText: { fontSize: 12, color: colors.text },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  warning: { flex: 1, fontSize: 12, color: colors.error },
  hidden: { opacity: 0 },
  counter: { fontSize: 12, color: colors.placeholder },
  counterOver: { color: colors.error },
});
