import axios from 'axios';

export const http = axios.create({ baseURL: '/api/v1', withCredentials: true, timeout: 20000 });
export const sessionExpiredEvent = 'mango:session-expired';
export const sessionRestoredEvent = 'mango:session-restored';
let csrf: Promise<{ token: string; headerName: string }> | undefined;
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0)) csrf = undefined;
    if (axios.isAxiosError(error) && error.response?.status === 401 && !['/auth/login', '/auth/register'].includes(error.config?.url ?? '')) {
      window.dispatchEvent(new Event(sessionExpiredEvent));
    }
    return Promise.reject(error);
  }
);
export const resetCsrf = () => {
  csrf = undefined;
};
export const getCsrf = () =>
  (csrf ??= http
    .get<{ token: string; headerName: string }>('/auth/csrf')
    .then((r) => r.data)
    .catch((error) => {
      csrf = undefined;
      throw error;
    }));
export const get = <T>(path: string) => http.get<T>(path).then((r) => r.data);
export async function command<T = Record<string, unknown>>(method: 'POST' | 'PUT' | 'DELETE', path: string, body: unknown, key?: string): Promise<T> {
  const token = await getCsrf();
  const response = await http.request<T>({ method, url: path, data: body ?? {}, headers: { [token.headerName]: token.token, ...(key ? { 'Idempotency-Key': key } : {}) } });
  return response.data;
}
export function errorMessage(error: unknown): string {
  if (axios.isAxiosError<{ message?: string; code?: string; traceId?: string }>(error)) {
    const data = error.response?.data;
    if (data?.message) return `${data.message}${data.traceId ? ` (문의 번호: ${data.traceId})` : ''}`;
    if (!error.response) return '서버에 연결하지 못했습니다. 연결을 확인하고 다시 시도해 주세요.';
    if (error.response.status === 401) return '로그인이 필요합니다.';
    if (error.response.status === 403) return '이 작업을 할 수 있는 권한이 없습니다.';
    if (error.response.status === 404) return '요청한 내용을 찾을 수 없습니다.';
  }
  return error instanceof Error ? error.message : '요청을 처리하지 못했습니다. 다시 시도해 주세요.';
}

/** A failed action keeps its key; a changed action or a successful action gets a new one. */
export class ActionIdentity {
  private fingerprint = '';
  private key = '';
  forAction(method: string, path: string, body: unknown): string {
    const fingerprint = JSON.stringify([method, path, body ?? {}]);
    if (fingerprint !== this.fingerprint || !this.key) {
      this.fingerprint = fingerprint;
      this.key = crypto.randomUUID();
    }
    return this.key;
  }
  complete() {
    this.key = '';
    this.fingerprint = '';
  }
}
