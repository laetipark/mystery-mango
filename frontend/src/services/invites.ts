const createdInvites = new Map<string, string>();

/** The browser keeps the raw capability; the server receives it once to hash it. */
export function createInviteToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
export function rememberCreatedInvite(roomId: string, token: string) {
  createdInvites.set(roomId, token);
}
export function getCreatedInvite(roomId: string): string {
  return createdInvites.get(roomId) ?? '';
}
export function forgetCreatedInvite(roomId: string) {
  createdInvites.delete(roomId);
}

const receivedPrefix = 'mango:received-invite:';
/** Only this browser tab keeps the invitation through the external login round trip. */
export function keepReceivedInvite(roomId: string, token: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return;
  try {
    sessionStorage.setItem(`${receivedPrefix}${roomId}`, JSON.stringify({ token, expires: Date.now() + 86400000 }));
  } catch {
    /* A blocked storage must not prevent existing signed-in invites. */
  }
}
export function receivedInvite(roomId: string): string {
  try {
    const item = JSON.parse(sessionStorage.getItem(`${receivedPrefix}${roomId}`) ?? 'null') as { token: string; expires: number } | null;
    if (item && item.expires > Date.now()) return item.token;
    sessionStorage.removeItem(`${receivedPrefix}${roomId}`);
  } catch {
    /* Malformed/disabled storage has no capability. */
  }
  return '';
}
export function clearReceivedInvite(roomId: string) {
  try {
    sessionStorage.removeItem(`${receivedPrefix}${roomId}`);
  } catch {
    /* Storage unavailable. */
  }
}
export function captureInvitePath(path: string): string {
  const url = new URL(path, window.location.origin);
  const match = /^\/rooms\/([^/]+)$/.exec(url.pathname);
  if (match && url.searchParams.has('invite')) keepReceivedInvite(match[1], url.searchParams.get('invite') ?? '');
  url.searchParams.delete('invite');
  return `${url.pathname}${url.search}${url.hash}`;
}
