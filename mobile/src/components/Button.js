// 디자인 시스템의 Button/Primary, Button/Secondary, Button/Text
// <Button title="상대 찾기" onPress={...} loading={busy} />
// <Button title="새로고침" variant="secondary" />
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, space, text } from '../theme/tokens';

export default function Button({ title, onPress, variant = 'primary', disabled = false, loading = false, style }) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && pressedStyles[variant],
        isDisabled && variant !== 'text' && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.textInverse : colors.primary} />
      ) : (
        <Text style={[styles.label, labelStyles[variant], isDisabled && styles.labelDisabled]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space[4],
  },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  text: { minHeight: 44, backgroundColor: 'transparent' },
  disabled: { backgroundColor: colors.disabledBg, borderColor: colors.disabledBg },
  label: { ...text.body, fontWeight: '600' },
  labelDisabled: { color: colors.textTertiary },
});

const pressedStyles = StyleSheet.create({
  primary: { backgroundColor: colors.primaryPressed },
  secondary: { backgroundColor: colors.primarySubtle },
  text: { opacity: 0.6 },
});

const labelStyles = StyleSheet.create({
  primary: { color: colors.textInverse },
  secondary: { color: colors.textPrimary },
  text: { color: colors.primary },
});
