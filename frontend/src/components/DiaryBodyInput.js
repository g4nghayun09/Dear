import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../lib/theme';

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// 본문을 highlights(사전에서 넣은 단어) 기준으로 잘라서 [{ text, mark }] 로 돌려줌
export function splitByWords(text, highlights) {
  const words = [...new Set(highlights)].filter(Boolean).sort((a, b) => b.length - a.length);
  if (!words.length || !text) return [{ text, mark: false }];
  const parts = text.split(new RegExp(`(${words.map(escapeRegExp).join('|')})`, 'g'));
  return parts.filter((p) => p !== '').map((p) => ({ text: p, mark: words.includes(p) }));
}

/**
 * 일기 본문 입력칸
 * TextInput 은 글자 일부만 색을 바꿀 수 없어서, 같은 글자를 색 입힌 Text 로 아래에 깔고
 * 그 위에 글자가 투명한 TextInput 을 겹친다. (두 글자 스타일이 같아야 줄이 어긋나지 않음)
 */
// onLineCountChange(n): 화면에 보이는 줄 수 (자동 줄바꿈 포함) — 2줄 이상 규칙에 씀 (강태인)
export default function DiaryBodyInput({ value, onChangeText, selection, onSelectionChange, highlights = [], placeholder, minHeight = 240, onLineCountChange }) {
  return (
    <View style={[styles.wrap, { minHeight }]}>
      {/* 아래층: 보이는 글자 (사전 단어는 주황색). 끝의 공백은 마지막 줄 높이를 유지하려는 용도 */}
      <Text
        style={styles.text}
        pointerEvents="none"
        accessible={false}
        onLayout={(e) => onLineCountChange?.(value ? Math.max(1, Math.round(e.nativeEvent.layout.height / LINE_HEIGHT)) : 0)}
      >
        {splitByWords(value, highlights).map((seg, i) => (
          <Text key={i} style={seg.mark ? styles.mark : null}>{seg.text}</Text>
        ))}
        {' '}
      </Text>
      {/* 위층: 실제 입력. 글자는 투명, 커서만 보임 */}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        selection={selection}
        onSelectionChange={(e) => onSelectionChange?.(e.nativeEvent.selection)}
        multiline
        scrollEnabled={false}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        selectionColor={colors.primary}
        cursorColor={colors.primary}
        autoCorrect={false}
        style={[styles.text, styles.input]}
      />
    </View>
  );
}

const LINE_HEIGHT = 24;
const textStyle = { fontSize: 14, lineHeight: LINE_HEIGHT, color: colors.text, padding: 0, margin: 0 };

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  text: textStyle,
  mark: { color: colors.highlight, fontWeight: '600' },
  input: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    color: 'transparent',
    textAlignVertical: 'top',
    ...Platform.select({ web: { outlineStyle: 'none', resize: 'none', caretColor: colors.primary, overflow: 'hidden' }, default: {} }),
  },
});
