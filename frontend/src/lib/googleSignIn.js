import * as Google from 'expo-auth-session/providers/google';
import { USE_MOCK } from './config';
import { ApiError } from './api/client';

/*
 * 구글 로그인에서 ID 토큰을 받아오는 훅 (서버 POST /auth/google 에 이 토큰을 보냄)
 *
 * .env 설정
 *  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID      웹 / Expo Go
 *  EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID  안드로이드 빌드
 *  EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID      iOS 빌드
 *  EXPO_PUBLIC_DEV_LOGIN_EMAIL           (개발용) 구글 없이 이 이메일로 로그인. 서버를 dev 프로필로 실행해야 함
 *
 * 서버의 GOOGLE_CLIENT_ID 에는 위에서 쓰는 클라이언트 ID 를 쉼표로 모두 넣어야 한다.
 */
const WEB = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const ANDROID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const IOS = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const DEV_EMAIL = (process.env.EXPO_PUBLIC_DEV_LOGIN_EMAIL || '').trim();

// 값이 앱 실행 중에 바뀌지 않으므로 훅을 조건부로 호출해도 안전하다
const USE_GOOGLE = !USE_MOCK && !DEV_EMAIL && !!(WEB || ANDROID || IOS);

/** @returns {{ getIdToken: () => Promise<string|null> }} null 이면 사용자가 창을 닫은 것 */
export function useGoogleIdToken() {
  if (USE_MOCK) return { getIdToken: async () => 'mock-id-token' };
  if (DEV_EMAIL) return { getIdToken: async () => `dev:${DEV_EMAIL}:${DEV_EMAIL}` };
  if (!USE_GOOGLE) {
    return {
      getIdToken: async () => {
        throw new ApiError(0, 'GOOGLE_CLIENT_ID_MISSING', 'LOGIN_FAILED');
      },
    };
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [, , promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: WEB,
    androidClientId: ANDROID,
    iosClientId: IOS,
  });

  return {
    getIdToken: async () => {
      const result = await promptAsync();
      if (result.type === 'success') {
        const idToken = result.params?.id_token;
        if (!idToken) throw new ApiError(401, 'no id_token', 'LOGIN_FAILED');
        return idToken;
      }
      if (result.type === 'error') throw new ApiError(401, result.error?.message || 'google error', 'LOGIN_FAILED');
      return null; // cancel / dismiss
    },
  };
}
