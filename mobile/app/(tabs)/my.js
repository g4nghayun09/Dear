// P-014 마이페이지
// 담당: 미정
import ScreenPlaceholder from '../../src/components/ScreenPlaceholder';

export default function MyScreen() {
  return (
    <ScreenPlaceholder
      id="P-014"
      title="마이페이지"
      owner="미정"
      requirements="FR-004, FR-008"
      apis="API-005, API-008, API-003"
      links={[
        { label: "지난 교환일기", href: "/my/history" },
        { label: "로그아웃 → 로그인", href: "/auth/login", replace: true }
      ]}
    />
  );
}
