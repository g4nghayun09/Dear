import { useCallback, useEffect, useState } from 'react';
import { getJSON, setJSON } from '../tokenStorage';
import { DEFAULT_LANG, SUPPORTED_LANGS, translations } from './translations';

// 외부 라이브러리 없이 만든 가벼운 다국어 스토어.
// UI 언어는 회원가입 때 고른 모국어(native_lang)와 같은 값(ko|ja)을 그대로 씁니다.
const STORAGE_KEY = 'dear.lang';

let currentLang = DEFAULT_LANG;
let hydrated = false;
const listeners = new Set();

function notify() {
  listeners.forEach((fn) => fn(currentLang));
}

function resolvePath(dict, key) {
  return key.split('.').reduce((acc, part) => (acc == null ? acc : acc[part]), dict);
}

// 컴포넌트 밖(errorMessage.js, validation.js 등)에서도 그냥 불러 쓸 수 있는 순수 함수
export function t(key, params) {
  const lang = SUPPORTED_LANGS.includes(currentLang) ? currentLang : DEFAULT_LANG;
  let text = resolvePath(translations[lang], key);
  if (text == null) text = resolvePath(translations[DEFAULT_LANG], key); // 번역 누락 시 한국어로 대체
  if (text == null) return key; // 그래도 없으면 키 그대로 (개발 중 누락 확인용)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(new RegExp(`{{${k}}}`, 'g'), v);
    });
  }
  return text;
}

export function getLanguage() {
  return currentLang;
}

export async function setLanguage(lang) {
  if (!SUPPORTED_LANGS.includes(lang) || lang === currentLang) return;
  currentLang = lang;
  notify();
  try {
    await setJSON(STORAGE_KEY, lang);
  } catch {
    // 저장 실패해도 현재 세션 언어는 이미 반영됨
  }
}

// 기기에 저장해 둔 마지막 언어를 한 번 불러옴 (앱 시작 시 _layout.js에서 호출)
export async function hydrateLanguage() {
  if (hydrated) return;
  hydrated = true;
  try {
    const saved = await getJSON(STORAGE_KEY);
    if (saved && SUPPORTED_LANGS.includes(saved) && saved !== currentLang) {
      currentLang = saved;
      notify();
    }
  } catch {
    // 저장된 값이 없거나 읽기 실패 → 기본 언어 유지
  }
}

// 화면에서 쓰는 훅: 언어가 바뀌면 리렌더되고, t()/현재 언어/변경 함수를 돌려줌
export function useT() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((v) => v + 1);
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);
  return t;
}

export function useLanguage() {
  const [lang, setLangState] = useState(currentLang);
  useEffect(() => {
    const fn = (next) => setLangState(next);
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);
  const change = useCallback((next) => setLanguage(next), []);
  return [lang, change];
}
