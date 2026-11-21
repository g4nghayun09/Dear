// P-017 지난 교환일기
// 담당: 미정
import ScreenPlaceholder from '../../src/components/ScreenPlaceholder';

export default function MyHistoryScreen() {
  return (
    <ScreenPlaceholder
      id="P-017"
      title="지난 교환일기"
      owner="미정"
      requirements="FR-022"
      apis="API-019, API-010"
      links={[
        { label: "일기 상세 (읽기 전용)", href: "/diary/1" }
      ]}
    />
  );
}
