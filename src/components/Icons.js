import Svg, { Path } from 'react-native-svg';
import { colors } from '../lib/theme';

export function ChevronLeft({ size = 16, color = colors.primary }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Path d="M10 3L5 8l5 5" stroke={color} strokeWidth={1.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// 드롭다운의 작고 둥근 아래 화살표
export function CaretDown({ size = 10, color = colors.primary, up = false }) {
  return (
    <Svg width={size} height={size * 0.8} viewBox="0 0 10 8" style={up ? { transform: [{ rotate: '180deg' }] } : null}>
      <Path d="M1.2 1.2C.6 1.2.2 1.9.6 2.4l3.6 4.6c.4.5 1.2.5 1.6 0l3.6-4.6c.4-.5 0-1.2-.6-1.2C7.6 1.2 6.4.8 5 2 3.6.8 2.4 1.2 1.2 1.2z" fill={color} />
    </Svg>
  );
}
