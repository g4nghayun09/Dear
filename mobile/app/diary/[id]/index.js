// P-009 일기 상세
// 담당: 미정 (추천: 강하윤)
import ScreenPlaceholder from '../../../src/components/ScreenPlaceholder';

export default function DiaryDetailScreen() {
  return (
    <ScreenPlaceholder
      id="P-009"
      title="일기 상세"
      owner="미정 (추천: 강하윤)"
      requirements="FR-013, FR-022"
      apis="API-011, API-018"
      links={[
        { label: "첨삭하기 (상대 일기)", href: "/diary/1/correct" },
        { label: "첨삭 보기 (내 일기)", href: "/diary/1/result" }
      ]}
    />
  );
}
