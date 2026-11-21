// 일기 작성 화면의 학습 언어 안내 + 경고 문구 (FR-010, 담당: 강태인)
// useDiaryInputCheck 결과(check)를 그대로 넘기면 됩니다.
import { StyleSheet, Text, View } from 'react-native';
import { languageName, MAX_LENGTH } from '../lib/languageCheck';
import { colors, radius, space, text } from '../theme/tokens';

export default function LanguageCheckNotice({ lang, check }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.guide}>
        <Text style={styles.guideText}>
          {lang === 'ja' ? '🇯🇵' : '🇰🇷'} {languageName(lang)}로 작성해요 · {languageName(lang)} 키보드로 바꿔 주세요
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={[styles.warning, !check.message && styles.hidden]} accessibilityLiveRegion="polite">
          {check.message ?? ' '}
        </Text>
        <Text style={[styles.counter, check.length > MAX_LENGTH && styles.counterOver]}>
          {check.length}/{MAX_LENGTH}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[2] },
  guide: {
    backgroundColor: colors.primarySubtle,
    borderRadius: radius.sm,
    paddingVertical: space[2],
    paddingHorizontal: space[3],
  },
  guideText: { ...text.label, color: colors.primary },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: space[3] },
  warning: { ...text.caption, color: colors.error, flex: 1 },
  hidden: { opacity: 0 },
  counter: { ...text.caption, color: colors.textSecondary },
  counterOver: { color: colors.error },
});
