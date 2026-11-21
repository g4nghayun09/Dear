// P-003 닉네임 설정
// 담당: 강하윤
import ScreenPlaceholder from '../../src/components/ScreenPlaceholder';

export default function AuthProfileScreen() {
  return (
    <ScreenPlaceholder
      id="P-003"
      title="닉네임 설정"
      owner="강하윤"
      requirements="FR-001"
      apis="API-004"
      links={[
        { label: "다음: 모국어 선택", href: "/auth/language" }
      ]}
    />
  );
}
