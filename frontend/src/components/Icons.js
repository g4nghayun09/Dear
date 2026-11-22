import Svg, { Circle, Path } from 'react-native-svg';
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

// ---- 하단 탭 / 상단 아이콘 (선 스타일, 활성 탭은 채움) ----
export function TabHome({ size = 28, color = colors.primary, filled = false }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M3.5 11.2 12 3.8l8.5 7.4V20a.8.8 0 0 1-.8.8H15v-5.5H9v5.5H4.3a.8.8 0 0 1-.8-.8z"
        fill={filled ? color : 'none'} stroke={color} strokeWidth={1.6} strokeLinejoin="round"
      />
    </Svg>
  );
}

export function TabMail({ size = 28, color = colors.primary, filled = false }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M3.5 9.5 12 3.5l8.5 6V19a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1z"
        fill={filled ? color : 'none'} stroke={color} strokeWidth={1.6} strokeLinejoin="round"
      />
      <Path d="m3.8 10 8.2 6 8.2-6" fill="none" stroke={filled ? '#fff' : color} strokeWidth={1.6} strokeLinejoin="round" />
    </Svg>
  );
}

export function TabBook({ size = 28, color = colors.primary, filled = false }) {
  const f = filled ? color : 'none';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 4.5h3.6V20H4z" fill={f} stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
      <Path d="M9.6 4.5h3.6V20H9.6z" fill={f} stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
      <Path d="m15.4 5.6 3.4-.9 3.1 14.4-3.4.9z" fill={f} stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
    </Svg>
  );
}

export function TabUser({ size = 28, color = colors.primary, filled = false }) {
  const f = filled ? color : 'none';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={8} r={4} fill={f} stroke={color} strokeWidth={1.6} />
      <Path d="M4.5 20c.4-4 3.5-6 7.5-6s7.1 2 7.5 6z" fill={f} stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
    </Svg>
  );
}

export function Bell({ size = 22, color = colors.primary }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 2.8c-3.4 0-5.8 2.6-5.8 6v3.2c0 1.2-.6 2.3-1.5 3.2l-.7.7c-.5.5-.2 1.4.6 1.4h14.8c.8 0 1.1-.9.6-1.4l-.7-.7c-.9-.9-1.5-2-1.5-3.2V8.8c0-3.4-2.4-6-5.8-6zM9.6 19.2a2.5 2.5 0 0 0 4.8 0z"
        fill={color}
      />
    </Svg>
  );
}

export function SearchIcon({ size = 22, color = colors.primary }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={10.5} cy={10.5} r={6.5} fill="none" stroke={color} strokeWidth={1.7} />
      <Path d="m15.5 15.5 5 5" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}
