const internalOrigin = 'https://mystery-mango.invalid';

export function safeNextPath(value: string | null): string {
  if (!value || value.length > 2048) return '/';
  try {
    const decoded = decodeURIComponent(value);
    if ([value, decoded].some((path) => !path.startsWith('/') || path.startsWith('//') || path.includes('\\') || [...path].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127))) return '/';
    const url = new URL(value, internalOrigin);
    return url.origin === internalOrigin ? `${url.pathname}${url.search}${url.hash}` : '/';
  } catch {
    return '/';
  }
}

export function kakaoAuthorizeUrl(value: string): string {
  try {
    const url = new URL(value);
    if (url.origin === 'https://kauth.kakao.com' && url.pathname === '/oauth/authorize' && !url.username && !url.password && !url.hash) return url.href;
  } catch {
    // Invalid authorization responses must never become navigation targets.
  }
  throw new Error('카카오 로그인을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.');
}

export function kakaoErrorMessage(code: string | null): string {
  switch (code) {
    case 'cancelled':
      return '카카오 로그인을 취소했어요. 다시 로그인할 수 있습니다.';
    case 'expired':
      return '로그인 요청이 만료됐어요. 카카오 로그인을 다시 시작해 주세요.';
    case 'unavailable':
      return '지금은 카카오 로그인을 이용할 수 없어요. 잠시 후 다시 시도해 주세요.';
    case 'failed':
      return '카카오 로그인을 완료하지 못했어요. 잠시 후 다시 시도해 주세요.';
    default:
      return '';
  }
}
