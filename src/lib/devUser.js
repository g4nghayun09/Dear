// [개발용] 로그인 기능 완성 전, 테스트 사용자 번호로 서버를 부르기 위한 값 (담당: 강태인)
// 값이 있으면 client.js 가 X-User-Id 헤더를 붙여 보냅니다. 서버 .env 의 DEV_AUTH=true 일 때만 동작.
// 배포 빌드(APK)에서는 __DEV__ 가 false 라서 항상 꺼집니다.
let devUserId = null;

export function setDevUserId(id) {
  devUserId = __DEV__ && id ? String(id) : null;
}

export function getDevUserId() {
  return __DEV__ ? devUserId : null;
}
