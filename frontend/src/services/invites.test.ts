import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { captureInvitePath, clearReceivedInvite, receivedInvite } from './invites';
describe('초대 로그인 왕복', () => {
  let saved: Map<string, string>;
  beforeEach(() => {
    saved = new Map();
    vi.stubGlobal('sessionStorage', { getItem: (k: string) => saved.get(k) ?? null, setItem: (k: string, v: string) => saved.set(k, v), removeItem: (k: string) => saved.delete(k) });
    vi.stubGlobal('window', { location: { origin: 'https://mystery.example' } });
  });
  afterEach(() => vi.unstubAllGlobals());
  it('인증 복귀 주소에는 초대 원문을 남기지 않고 현재 탭에 보존한다', () => {
    const token = 'a'.repeat(43);
    expect(captureInvitePath(`/rooms/abc?invite=${token}`)).toBe('/rooms/abc');
    expect(receivedInvite('abc')).toBe(token);
    clearReceivedInvite('abc');
    expect(receivedInvite('abc')).toBe('');
  });
  it('만료된 초대 원문은 복구하지 않는다', () => {
    saved.set('mango:received-invite:abc', JSON.stringify({ token: 'a'.repeat(43), expires: Date.now() - 1 }));
    expect(receivedInvite('abc')).toBe('');
    expect(saved.size).toBe(0);
  });
  it('방 경로가 아닌 곳과 잘못된 토큰은 보관하지 않는다', () => {
    captureInvitePath('/account?invite=' + 'a'.repeat(43));
    captureInvitePath('/rooms/abc?invite=invalid');
    expect(saved.size).toBe(0);
  });
});
