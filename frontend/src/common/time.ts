export function secondsUntil(endsAt: string, now: number): number {
  return Math.max(0, Math.ceil((Date.parse(endsAt) - now) / 1000));
}
export function clockText(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
export const phaseNames: Record<string, string> = { READING: '개인 자료 읽기', INVESTIGATION: '단서 조사', DISCUSSION: '함께 토론', VOTE: '범인 투표', ENDING: '엔딩' };
export const difficultyNames: Record<string, string> = { EASY: '입문', MEDIUM: '보통', HARD: '어려움' };
export const activityPath = (kind: string, id: string | null) =>
  !id ? '/' : kind === 'GAME' ? `/games/${id}` : kind === 'ROOM' ? `/rooms/${id}` : `/match?${kind === 'PROPOSED' ? 'proposal' : 'ticket'}=${id}`;
