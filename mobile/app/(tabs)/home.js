// P-006 홈 (교환일기장)
// 담당: 미정 (추천: 강하윤)
import ScreenPlaceholder from '../../src/components/ScreenPlaceholder';

export default function HomeScreen() {
  return (
    <ScreenPlaceholder
      id="P-006"
      title="홈 (교환일기장)"
      owner="미정 (추천: 강하윤)"
      requirements="FR-007, FR-012, FR-021"
      apis="API-007, API-010"
      links={[
        { label: "일기 쓰기", href: "/diary/write" },
        { label: "일기 상세 (예: 1번)", href: "/diary/1" }
      ]}
    />
  );
}
