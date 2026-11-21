import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../lib/theme';
import { useT } from '../lib/i18n';

export default function ConfirmModal({ visible, title, message, confirmText, cancelText, onConfirm, onCancel, loading }) {
  const t = useT();
  const confirm = confirmText ?? t('common.confirm');
  const cancel = cancelText ?? t('common.cancel');
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.box}>
          <Text style={styles.title}>{title}</Text>
          {!!message && <Text style={styles.message}>{message}</Text>}
          <View style={styles.row}>
            <Pressable onPress={onCancel} disabled={loading} style={[styles.btn, styles.cancel]}>
              <Text style={styles.cancelText}>{cancel}</Text>
            </Pressable>
            <Pressable onPress={onConfirm} disabled={loading} style={[styles.btn, styles.ok]}>
              {loading ? <ActivityIndicator color={colors.primaryText} /> : <Text style={styles.okText}>{confirm}</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', padding: 40 },
  box: { width: '100%', maxWidth: 320, backgroundColor: colors.background, borderRadius: 20, paddingTop: 28, paddingHorizontal: 22, paddingBottom: 20 },
  title: { fontSize: 15, fontWeight: '600', color: colors.text, textAlign: 'center' },
  message: { marginTop: 10, fontSize: 12, lineHeight: 18, color: colors.text, textAlign: 'center' },
  row: { flexDirection: 'row', gap: 10, marginTop: 22 },
  btn: { flex: 1, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  cancel: { borderWidth: 1, borderColor: colors.border },
  cancelText: { fontSize: 13, color: colors.text },
  ok: { backgroundColor: colors.primary },
  okText: { fontSize: 13, color: colors.primaryText, fontWeight: '500' },
});
