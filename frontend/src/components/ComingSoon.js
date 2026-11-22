import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DearLogo from './DearLogo';
import { colors } from '../lib/theme';
import { useT } from '../lib/i18n';

// 아직 만들어지지 않은 탭 화면의 자리 표시. 담당자가 화면을 만들면 이 파일 대신 교체한다.
export default function ComingSoon({ title, children }) {
  const t = useT();
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <DearLogo width={64} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.soon}>{t('tabs.soon')}</Text>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 18, paddingTop: 22 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  title: { fontSize: 16, color: colors.text, fontWeight: '600' },
  soon: { fontSize: 12, color: colors.placeholder },
});
