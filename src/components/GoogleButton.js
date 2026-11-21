import { ActivityIndicator, Image, Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius } from '../lib/theme';
import { useT } from '../lib/i18n';

export default function GoogleButton({ onPress, loading }) {
  const t = useT();
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={t('login.googleA11y')}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Image source={require('../../assets/images/google-g.png')} style={styles.icon} />
      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.label} />
      ) : (
        <Text style={styles.label}>{t('login.googleButton')}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 63,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 14,
  },
  pressed: { opacity: 0.6 },
  icon: { width: 35, height: 36, resizeMode: 'contain' },
  label: { flex: 1, textAlign: 'center', fontSize: 14, color: colors.text },
});
