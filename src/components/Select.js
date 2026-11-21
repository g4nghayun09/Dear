import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CaretDown } from './Icons';
import { colors, radius } from '../lib/theme';

// 시안의 '국가 및 언어 설정' 드롭다운. 펼치면 아래에 목록이 겹쳐서 나타남.
export default function Select({ value, options, onChange, placeholder = '선택하기' }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={[styles.field, open && styles.fieldOpen]}
      >
        <Text style={[styles.text, !selected && styles.placeholder]}>{selected ? selected.label : placeholder}</Text>
        <CaretDown up={open} />
      </Pressable>

      {open && (
        <View style={styles.menu}>
          {options.map((o, i) => (
            <Pressable
              key={o.value}
              onPress={() => {
                onChange(o.value);
                setOpen(false);
              }}
              style={({ pressed }) => [styles.option, i > 0 && styles.optionDivider, pressed && styles.optionPressed]}
            >
              <Text style={styles.optionText}>{o.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { zIndex: 10 },
  field: {
    height: 49,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
  },
  fieldOpen: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  text: { fontSize: 12, color: colors.text },
  placeholder: { color: colors.placeholder },
  menu: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: radius.input,
    borderBottomRightRadius: radius.input,
    backgroundColor: colors.background,
    overflow: 'hidden',
    elevation: 4,
  },
  option: { height: 49, justifyContent: 'center', paddingHorizontal: 16 },
  optionDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  optionPressed: { backgroundColor: '#F6F1F1' },
  optionText: { fontSize: 12, color: colors.text },
});
