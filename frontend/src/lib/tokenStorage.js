import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// 로그인 토큰(JWT)을 기기의 안전한 저장소에 보관 (웹은 localStorage)
const KEY = 'dear.accessToken';
const isWeb = Platform.OS === 'web';

export async function getToken() {
  if (isWeb) return globalThis.localStorage?.getItem(KEY) ?? null;
  return SecureStore.getItemAsync(KEY);
}

export async function setToken(token) {
  if (isWeb) return globalThis.localStorage?.setItem(KEY, token);
  return SecureStore.setItemAsync(KEY, token);
}

export async function clearToken() {
  if (isWeb) return globalThis.localStorage?.removeItem(KEY);
  return SecureStore.deleteItemAsync(KEY);
}

// mock 모드에서 가짜 데이터 보관용
export async function getJSON(key) {
  const raw = isWeb ? globalThis.localStorage?.getItem(key) : await SecureStore.getItemAsync(key);
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function setJSON(key, value) {
  const raw = JSON.stringify(value);
  if (isWeb) return globalThis.localStorage?.setItem(key, raw);
  return SecureStore.setItemAsync(key, raw);
}

export async function removeKey(key) {
  if (isWeb) return globalThis.localStorage?.removeItem(key);
  return SecureStore.deleteItemAsync(key);
}
