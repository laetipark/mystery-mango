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
