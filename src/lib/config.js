// Spring 서버 주소. .env 의 EXPO_PUBLIC_API_URL 로 설정
//  - 비워 두면 mock 모드: 서버 없이 가짜 데이터로 화면을 확인할 수 있음
//  - 휴대폰(Expo Go)에서 테스트할 때는 localhost 대신 PC의 IP 주소를 써야 함 (예: http://192.168.0.10:8080)
const rawUrl = (process.env.EXPO_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');

export const API_URL = rawUrl;
export const USE_MOCK = !rawUrl || process.env.EXPO_PUBLIC_USE_MOCK === 'true';

if (USE_MOCK) {
  console.log('[Dear] mock 모드로 실행 중 — 서버 없이 가짜 데이터를 사용합니다.');
}
