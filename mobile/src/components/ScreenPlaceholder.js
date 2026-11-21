// 아직 구현 전인 화면의 자리표시. 담당자가 이 컴포넌트를 지우고 실제 화면을 만들면 됩니다.
import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, space, text } from '../theme/tokens';

export default function ScreenPlaceholder({ id, title, owner, requirements, apis, links = [] }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.id}>{id}</Text>
        <Text style={styles.title}>{title}</Text>

        <View style={styles.card}>
          <Row label="담당" value={owner} />
          <Row label="요구사항" value={requirements} />
          <Row label="API" value={apis} />
        </View>

        {links.length > 0 && (
          <View style={styles.links}>
            <Text style={styles.linksLabel}>화면 이동 (테스트용)</Text>
            {links.map((l) => (
              <Link key={l.href} href={l.href} replace={l.replace} style={styles.link}>
                {l.label} →
              </Link>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value ?? '-'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { padding: space[5], gap: space[4] },
  id: { ...text.label, color: colors.primary },
  title: { ...text.h1, color: colors.textPrimary },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space[4],
    gap: space[3],
  },
  row: { flexDirection: 'row', gap: space[3] },
  rowLabel: { ...text.label, color: colors.textSecondary, width: 64 },
  rowValue: { ...text.body, color: colors.textPrimary, flex: 1 },
  links: { gap: space[2] },
  linksLabel: { ...text.caption, color: colors.textSecondary },
  link: {
    ...text.body,
    color: colors.primary,
    backgroundColor: colors.primarySubtle,
    borderRadius: radius.sm,
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    overflow: 'hidden',
  },
});
