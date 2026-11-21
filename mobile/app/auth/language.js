// P-004 모국어 선택 (+ 확인 모달)
// 담당: 강하윤
import ScreenPlaceholder from '../../src/components/ScreenPlaceholder';

export default function AuthLanguageScreen() {
  return (
    <ScreenPlaceholder
      id="P-004"
      title="모국어 선택 (+ 확인 모달)"
      owner="강하윤"
      requirements="FR-002"
      apis="API-004"
      links={[
        { label: "시작하기 → 매칭 대기", href: "/match", replace: true }
      ]}
    />
  );
}
