import { describe, expect, it } from 'vitest';
import { kakaoAuthorizeUrl, kakaoErrorMessage, safeNextPath } from './auth';

describe('로그인 뒤 이동 경로', () => {
  it('모집방 초대 등 내부 경로와 쿼리를 유지한다', () => {
    expect(safeNextPath('/rooms/room-id?invite=abc_-123')).toBe('/rooms/room-id?invite=abc_-123');
    expect(safeNextPath('/scenarios#catalog')).toBe('/scenarios#catalog');
    expect(safeNextPath('/scenarios?genre=detective%20fiction')).toBe('/scenarios?genre=detective%20fiction');
  });

  it.each([null, '', 'https://outside.example', '//outside.example', '/\\outside.example', '/%2Foutside.example', '/%5coutside.example', '/\noutside.example', '/%0doutside.example', '/bad%encoding'])(
    '외부 주소나 모호한 경로 %j 대신 홈으로 이동한다',
    (path) => expect(safeNextPath(path)).toBe('/')
  );
});

describe('카카오 인증 화면 이동', () => {
  it('공식 HTTPS 인증 경로만 허용한다', () => {
    const url = 'https://kauth.kakao.com/oauth/authorize?client_id=example&state=test';
    expect(kakaoAuthorizeUrl(url)).toBe(url);
  });

  it.each([
    'http://kauth.kakao.com/oauth/authorize',
    'https://kauth.kakao.com.attacker.example/oauth/authorize',
    'https://kauth.kakao.com@attacker.example/oauth/authorize',
    'https://user@kauth.kakao.com/oauth/authorize',
    'https://kauth.kakao.com:8443/oauth/authorize',
    'https://kauth.kakao.com/other',
    'https://kauth.kakao.com/oauth/authorize#unexpected',
    '//kauth.kakao.com/oauth/authorize',
    'javascript:alert(1)',
    '/login'
  ])('예상하지 않은 인증 주소 %s를 거부한다', (url) => {
    expect(() => kakaoAuthorizeUrl(url)).toThrow('카카오 로그인을 시작하지 못했습니다.');
  });
});

describe('카카오 로그인 결과 안내', () => {
  it('취소와 만료를 구분하고 알 수 없는 쿼리를 그대로 표시하지 않는다', () => {
    expect(kakaoErrorMessage('cancelled')).toContain('취소');
    expect(kakaoErrorMessage('expired')).toContain('만료');
    expect(kakaoErrorMessage('failed')).toContain('완료하지 못했어요');
    expect(kakaoErrorMessage('unavailable')).toContain('이용할 수 없어요');
    expect(kakaoErrorMessage('<script>')).toBe('');
    expect(kakaoErrorMessage(null)).toBe('');
  });
});
