import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { api } from './api';
import { setUnauthorizedHandler } from './api/client';
import { clearToken, getToken, setToken } from './tokenStorage';
import { setLanguage } from './i18n';

WebBrowser.maybeCompleteAuthSession(); // 웹에서 로그인 팝업을 닫아 줌

const AuthContext = createContext(null);

/**
 * 로그인 상태
 *  token   : JWT (없으면 로그인 안 됨)
 *  profile : 내 프로필 (null 이면 가입 전 → 가입하기 화면)
 */
export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const reset = useCallback(async () => {
    await clearToken();
    setTokenState(null);
    setProfile(null);
  }, []);

  // API-005. null 이면 처음 로그인 → 가입하기
  const loadProfile = useCallback(async () => {
    const me = await api.getMyProfile();
    setProfile(me);
    if (me?.native_lang) setLanguage(me.native_lang); // 프로필의 모국어 = 앱 UI 언어
    return me;
  }, []);

  // 앱 시작: 저장된 토큰이 있으면 프로필까지 확인
  useEffect(() => {
    setUnauthorizedHandler(() => reset());
    (async () => {
      try {
        const saved = await getToken();
        if (saved) {
          setTokenState(saved);
          await loadProfile();
        }
      } catch (e) {
        // 401 은 reset 처리됨. 서버가 꺼져 있는 등 다른 오류는 일단 로그인 화면으로
        console.warn('[Dear] 로그인 상태 확인 실패', e.message);
        await reset();
      } finally {
        setLoading(false);
      }
    })();
    return () => setUnauthorizedHandler(null);
  }, [loadProfile, reset]);

  // 토큰을 받은 뒤 공통 처리 (로그인 버튼 / 콜백 화면)
  const acceptToken = useCallback(
    async (newToken) => {
      await setToken(newToken);
      setTokenState(newToken);
      try {
        await loadProfile();
      } catch (e) {
        await reset();
        throw e;
      }
    },
    [loadProfile, reset],
  );

  const signInWithGoogle = useCallback(async () => {
    const newToken = await api.loginWithGoogle();
    if (newToken) await acceptToken(newToken);
  }, [acceptToken]);

  // API-003. 서버 호출이 실패해도 앱에서는 로그아웃
  const signOut = useCallback(async () => {
    try {
      await api.logout();
    } catch (e) {
      console.warn('[Dear] logout', e.message);
    }
    await reset();
  }, [reset]);

  // API-004 프로필 생성 (닉네임 + 모국어)
  const signup = useCallback(async ({ nickname, native_lang }) => {
    const me = await api.createProfile({ nickname, native_lang });
    setProfile(me);
    if (me?.native_lang) setLanguage(me.native_lang);
    return me;
  }, []);

  const value = useMemo(
    () => ({ isLoggedIn: !!token, profile, loading, signInWithGoogle, acceptToken, signOut, signup, reloadProfile: loadProfile }),
    [token, profile, loading, signInWithGoogle, acceptToken, signOut, signup, loadProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth는 AuthProvider 안에서만 쓸 수 있어요.');
  return ctx;
}
