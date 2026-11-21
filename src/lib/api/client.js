import { API_URL } from '../config';
import { getToken } from '../tokenStorage';
import { getDevUserId } from '../devUser';

// 서버 오류. status = HTTP 상태, code = 명세 오류 코드(ALREADY_MATCHED 등) 또는 DB 오류 코드
export class ApiError extends Error {
  constructor(status, message, code = null, body = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

let onUnauthorized = null;
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

function toQuery(params) {
  if (!params) return '';
  const pairs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
  return pairs.length ? `?${pairs.join('&')}` : '';
}

/**
 * 공통 요청 함수
 * 오류 응답은 { code, message } 형식 (명세 공통 규칙)
 */
// asUser: [개발용] 이 요청만 해당 테스트 사용자로 보냄 (기능 시연 화면 src/app/dev.js)
export async function request(path, { method = 'GET', body, query, auth = true, timeout = 15000, asUser } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    // [개발용] 로그인 완성 전 테스트: 서버 DEV_AUTH=true 일 때 X-User-Id 로 사용자 구분 (배포 빌드에서는 꺼짐)
    const devId = __DEV__ ? (asUser ? String(asUser) : getDevUserId()) : null;
    if (devId) headers['X-User-Id'] = devId;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  let res;
  try {
    res = await fetch(`${API_URL}${path}${toQuery(query)}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (e) {
    throw new ApiError(0, e.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR', e.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR');
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 204) return null;

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    if (res.status === 401 && auth && onUnauthorized) onUnauthorized();
    const obj = data && typeof data === 'object' ? data : {};
    // code 가 없고 message 에 오류 코드만 들어 있는 경우도 처리 (예: { message: "ALREADY_MATCHED" })
    const code = obj.code || (/^[A-Z_]+$/.test(obj.message || '') ? obj.message : null);
    throw new ApiError(res.status, obj.message || `HTTP ${res.status}`, code, data);
  }
  return data;
}
