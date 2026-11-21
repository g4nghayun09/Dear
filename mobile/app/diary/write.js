// P-007 일기 작성 (+ P-008 단어 검색 모달)
// 담당: 강하윤 / 입력 제한 강태인 / 단어 검색 미정(추천: 홍재나)
import ScreenPlaceholder from '../../src/components/ScreenPlaceholder';

export default function DiaryWriteScreen() {
  return (
    <ScreenPlaceholder
      id="P-007"
      title="일기 작성 (+ P-008 단어 검색 모달)"
      owner="강하윤 / 입력 제한 강태인 / 단어 검색 미정(추천: 홍재나)"
      requirements="FR-009, FR-010, FR-011, FR-016, FR-017"
      apis="API-009, API-013, API-014"
      links={[
        { label: "보내기 → 홈", href: "/home", replace: true }
      ]}
    />
  );
}
