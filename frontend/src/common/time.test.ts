import { describe, expect, it } from 'vitest';
import { clockText, secondsUntil, activityPath } from './time';
import { ActionIdentity } from '~/services/api';

describe('server deadline display', () => {
  it('never displays negative time and rounds remaining partial seconds up', () => {
    expect(secondsUntil('2026-01-01T00:00:01Z', Date.parse('2026-01-01T00:00:00.900Z'))).toBe(1);
    expect(secondsUntil('2026-01-01T00:00:01Z', Date.parse('2026-01-01T00:00:02Z'))).toBe(0);
    expect(clockText(125)).toBe('2:05');
  });
  it('restores the correct active destination', () => {
    expect(activityPath('GAME', 'a')).toBe('/games/a');
    expect(activityPath('PROPOSED', 'b')).toBe('/match?proposal=b');
  });
});
describe('idempotent retries', () => {
  it('reuses the key only for retries of the same unresolved action', () => {
    const keys = new ActionIdentity();
    const first = keys.forAction('POST', '/investigations', { targetId: 'a' });
    expect(keys.forAction('POST', '/investigations', { targetId: 'a' })).toBe(first);
    expect(keys.forAction('POST', '/investigations', { targetId: 'b' })).not.toBe(first);
    keys.complete();
    expect(keys.forAction('POST', '/investigations', { targetId: 'a' })).not.toBe(first);
  });
});
