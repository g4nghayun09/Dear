// 홈(P-006) 위쪽의 교환 상대 정보 (FR-007, 담당: 강태인)
// 사용 예: const match = await api.getMyMatch();  <MatchHeader match={match} />
import { StyleSheet, Text, View } from 'react-native';
import { colors, space, text } from '../theme/tokens';

function daysSince(iso) {
  if (!iso) return 0;
  const start = new Date(iso);
  return Math.max(0, Math.floor((Date.now() - start.getTime()) / 86400000));
}

export default function MatchHeader({ match }) {
  if (!match || match.status !== 'MATCHED') return null;
  const { partner, startedAt } = match;
  const isJa = partner.nativeLang === 'ja';

  return (
    <View style={styles.wrap}>
      <Text style={styles.name}>Dear. {partner.nickname}</Text>
      <Text style={styles.meta}>
        {isJa ? '🇯🇵 일본어' : '🇰🇷 한국어'} 원어민 · D+{daysSince(startedAt)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: space[1],
    paddingVertical: space[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  name: { ...text.h1, color: colors.textPrimary },
  meta: { ...text.caption, color: colors.textSecondary },
});
