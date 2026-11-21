import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import DearLogo from './DearLogo';
import { colors } from '../lib/theme';

// 로그인·가입 화면 공통 상단 로고 + 슬로건 (시안 기준 화면 높이의 약 23% 지점)
export default function Brand() {
  const { height } = useWindowDimensions();
  return (
    <View style={[styles.wrap, { top: height * 0.233 }]} pointerEvents="none">
      <DearLogo width={127} />
      <Text style={styles.slogan}>너의 언어로 쓰는 나의 하루, 우리의 디어</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  slogan: { marginTop: 16, fontSize: 13, color: colors.text, letterSpacing: -0.2 },
});
