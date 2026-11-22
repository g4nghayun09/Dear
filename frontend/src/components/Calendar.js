import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../lib/theme';
import { useT } from '../lib/i18n';

const CELL = 46;

/**
 * 한 달 달력 (홈 화면)
 *  year, month : 표시할 달 (month 는 1~12)
 *  today       : 오늘이면 테두리로 표시할 일(day). 다른 달이면 null
 *  markedDays  : 일기를 쓴 날(일) 배열 → 파란 원
 */
export default function Calendar({ year, month, today = null, markedDays = [] }) {
  const t = useT();
  const marked = new Set(markedDays);
  const firstWeekday = new Date(year, month - 1, 1).getDay(); // 0=일요일
  const daysInMonth = new Date(year, month, 0).getDate();

  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <View>
      <View style={styles.row}>
        {[0, 1, 2, 3, 4, 5, 6].map((d) => (
          <View key={d} style={styles.cell}>
            <Text style={styles.weekday}>{t(`calendar.d${d}`)}</Text>
          </View>
        ))}
      </View>
      {weeks.map((week, wi) => (
        <View key={wi} style={[styles.row, styles.weekRow]}>
          {week.map((day, di) => (
            <View key={di} style={styles.cell}>
              {day !== null && (
                <View
                  style={[
                    styles.day,
                    marked.has(day) && styles.marked,
                    day === today && styles.today,
                  ]}
                  accessibilityLabel={`${month}/${day}`}
                >
                  <Text style={[styles.dayText, marked.has(day) && styles.markedText]}>{day}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  weekRow: { marginTop: 6 },
  cell: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  weekday: { fontSize: 11, color: colors.text, marginBottom: 6 },
  day: { width: CELL, height: CELL, borderRadius: CELL / 2, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  marked: { backgroundColor: colors.calendarMark },
  today: { borderColor: colors.primary },
  dayText: { fontSize: 12, color: colors.text },
  markedText: { color: '#FFFFFF' },
});
