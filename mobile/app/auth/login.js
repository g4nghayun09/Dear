// P-002 구글 로그인
// 담당: 강하윤
import ScreenPlaceholder from '../../src/components/ScreenPlaceholder';

export default function AuthLoginScreen() {
  return (
    <ScreenPlaceholder
      id="P-002"
      title="구글 로그인"
      owner="강하윤"
      requirements="FR-001, FR-003"
      apis="API-001"
      links={[
        { label: "닉네임 설정 (처음 로그인)", href: "/auth/profile" },
        { label: "홈 (가입 완료 + 매칭 있음)", href: "/home" },
        { label: "매칭 대기 (가입 완료 + 매칭 없음)", href: "/match" },
        { label: "기능 시연 (개발용)", href: "/demo" }
      ]}
    />
  );
}
