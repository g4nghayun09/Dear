// 로그인 토큰(JWT) 저장소. 폰의 안전한 저장 공간(expo-secure-store)에 보관합니다.
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'dear.accessToken';

export async function saveToken(token) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

// API-003 로그아웃: 서버 호출 없이 토큰만 지웁니다.
export async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
