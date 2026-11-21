// P-011 첨삭 결과
// 담당: 홍재나
import ScreenPlaceholder from '../../../src/components/ScreenPlaceholder';

export default function DiaryDetailResultScreen() {
  return (
    <ScreenPlaceholder
      id="P-011"
      title="첨삭 결과"
      owner="홍재나"
      requirements="FR-015, FR-018"
      apis="API-011, API-014"
      links={[
        { label: "단어장", href: "/words" }
      ]}
    />
  );
}
