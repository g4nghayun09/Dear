// P-012 단어장
// 담당: 홍재나
import ScreenPlaceholder from '../../src/components/ScreenPlaceholder';

export default function WordsScreen() {
  return (
    <ScreenPlaceholder
      id="P-012"
      title="단어장"
      owner="홍재나"
      requirements="FR-019"
      apis="API-015, API-016"
      links={[
        { label: "학습하기", href: "/words/study" }
      ]}
    />
  );
}
