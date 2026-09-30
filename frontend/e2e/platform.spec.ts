import { randomUUID } from 'node:crypto';
import { test, expect, type Browser, type BrowserContext, type Locator, type Page as BrowserPage } from '@playwright/test';
import type { Game, Page, Proposal, Scenario, Ticket } from '../src/common/types';

type Player = { context: BrowserContext; page: BrowserPage; id: string; email: string };
const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:5173';
async function mutate<T>(player: Player, method: 'POST' | 'PUT' | 'DELETE', path: string, data: unknown = {}, key = randomUUID()): Promise<T> {
  const csrfResponse = await player.context.request.get(`${baseURL}/api/v1/auth/csrf`);
  expect(csrfResponse.ok()).toBeTruthy();
  const csrf: { token: string; headerName: string } = await csrfResponse.json();
  const result = await player.context.request.fetch(`${baseURL}/api/v1${path}`, { method, headers: { [csrf.headerName]: csrf.token, 'Idempotency-Key': key }, data });
  expect(result.ok(), `${method} ${path}: ${await result.text()}`).toBeTruthy();
  return (await result.json()) as T;
}
async function read<T>(player: Player, path: string): Promise<T> {
  const response = await player.context.request.get(`${baseURL}/api/v1${path}`);
  expect(response.ok(), `GET ${path}: ${await response.text()}`).toBeTruthy();
  return (await response.json()) as T;
}
async function players(browser: Browser, count = 4): Promise<Player[]> {
  const result: Player[] = [];
  for (let i = 0; i < count; i++) {
    const context = await browser.newContext({ baseURL });
    const page = await context.newPage();
    const email = `e2e-${randomUUID()}@example.test`;
    await page.goto('/register');
    await page.getByLabel('이름', { exact: true }).fill(`탐정 ${i + 1}`);
    await page.getByLabel('이메일', { exact: true }).fill(email);
    await page.getByLabel('비밀번호', { exact: true }).fill('MangoDev!2026');
    await page.getByRole('button', { name: '회원가입', exact: true }).click();
    await expect(page).toHaveURL(baseURL + '/');
    const response = await context.request.get(`${baseURL}/api/v1/auth/me`);
    const user: { id: string } = await response.json();
    result.push({ context, page, id: user.id, email });
  }
  expect(new Set(result.map((player) => player.id)).size).toBe(count);
  const sessions = await Promise.all(result.map((player) => player.context.cookies()));
  expect(new Set(sessions.map((cookies) => cookies.find((cookie) => /SESSION|JSESSIONID/i.test(cookie.name))?.value)).size).toBe(count);
  return result;
}
async function closePlayers(group: Player[]) {
  await Promise.all(group.map((player) => player.context.close()));
}
async function tabTo(page: BrowserPage, target: Locator) {
  await expect(target).toBeVisible();
  await expect(target).toBeEnabled();
  for (let step = 0; step < 40; step++) {
    await page.keyboard.press('Tab');
    if (await target.evaluate((element) => element === document.activeElement)) return;
  }
  throw new Error('주요 조작 요소에 Tab 키로 도달할 수 없습니다.');
}
async function finishGame(group: Player[], gameId: string) {
  const deadline = Date.now() + 120000;
  const acted = new Set<string>();
  while (Date.now() < deadline) {
    const snapshot = await read<Game>(group[0], `/games/${gameId}/snapshot`);
    if (snapshot.ending) return;
    if (snapshot.phase) {
      for (const player of group) {
        const own = await read<Game>(player, `/games/${gameId}/snapshot`);
        const key = `${player.id}:${own.phase?.id}`;
        if (acted.has(key)) continue;
        if (own.phase?.kind === 'READING' && !own.phase.ready) {
          await mutate(player, 'POST', `/games/${gameId}/phase-ready`);
          acted.add(key);
        } else if (own.phase?.kind === 'INVESTIGATION' && own.targets.some((target) => !target.investigated) && own.investigationsRemaining > 0) {
          const target = own.targets.find((item) => !item.investigated)!;
          const commandKey = randomUUID();
          await mutate(player, 'POST', `/games/${gameId}/investigations`, { targetId: target.id }, commandKey);
          const after = await read<Game>(player, `/games/${gameId}/snapshot`);
          await mutate(player, 'POST', `/games/${gameId}/investigations`, { targetId: target.id }, commandKey);
          const retry = await read<Game>(player, `/games/${gameId}/snapshot`);
          if (retry.phase?.id === after.phase?.id) expect(retry.investigationsRemaining).toBe(after.investigationsRemaining);
          expect(new Set(retry.clues.map((clue) => clue.id)).size).toBe(retry.clues.length);
          acted.add(key);
        } else if (own.phase?.kind === 'VOTE' && own.ballot) {
          await mutate(player, 'PUT', `/games/${gameId}/ballots/${own.ballot.id}/me`, { roleId: own.participants[0].roleId });
          acted.add(key);
        }
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
  throw new Error('게임이 120초 내 엔딩에 도달하지 않았습니다. E2E 프로필과 단계 시간 설정을 확인하세요.');
}

test('네 독립 로그인으로 모집방 → 비밀 역할 → 조사 → 투표 → 엔딩, 네트워크·새로고침 복구와 키보드 조작', async ({ browser }) => {
  const group = await players(browser);
  const pageErrors: string[] = [];
  for (const player of group) player.page.on('pageerror', (error) => pageErrors.push(error.message));
  try {
    const catalog = await read<Page<Scenario>>(group[0], '/scenarios?size=10');
    expect(catalog.items.length).toBeGreaterThanOrEqual(3);
    expect(JSON.stringify(catalog)).not.toContain('culpritRoleId');
    expect(JSON.stringify(catalog)).not.toContain('"secret"');
    const room = await mutate<{ roomId: string }>(group[0], 'POST', '/rooms', { scenarioVersionId: catalog.items[0].versionId, visibility: 'PUBLIC', mode: 'TEXT' });
    for (const player of group.slice(1)) await mutate(player, 'POST', `/rooms/${room.roomId}/join`);
    for (const [index, player] of group.entries()) {
      await player.page.goto(`/rooms/${room.roomId}`);
      const ready = player.page.getByRole('button', { name: '준비 완료', exact: true });
      if (index === 0) {
        await tabTo(player.page, ready);
        await expect(ready).toBeFocused();
        await player.page.keyboard.press('Enter');
      } else await ready.click();
      await expect(player.page.getByRole('button', { name: '준비 취소', exact: true })).toBeVisible();
    }
    await tabTo(group[0].page, group[0].page.getByTestId('start-game'));
    await expect(group[0].page.getByTestId('start-game')).toBeFocused();
    await group[0].page.keyboard.press('Enter');
    await expect(group[0].page).toHaveURL(/\/games\/[0-9a-f-]+$/);
    const gameId = group[0].page.url().split('/').pop()!;
    const roles = await Promise.all(group.map((player) => read<Game>(player, `/games/${gameId}/snapshot`)));
    expect(new Set(roles.map((role) => role.myRole.id)).size).toBe(4);
    for (let i = 0; i < group.length; i++) {
      await group[i].page.goto(`/games/${gameId}`);
      await expect(group[i].page.getByTestId('my-role')).toHaveText(roles[i].myRole.name);
      for (let j = 0; j < roles.length; j++) if (i !== j) expect(await group[i].page.locator('body').innerText()).not.toContain(roles[j].myRole.secret);
    }
    await group[1].page.reload();
    await expect(group[1].page.getByTestId('my-role')).toHaveText(roles[1].myRole.name);
    await expect.poll(async () => (await read<Game>(group[0], `/games/${gameId}/snapshot`)).phase?.actions.includes('CHAT'), { timeout: 20000 }).toBe(true);
    const returning = group[1];
    await returning.context.setOffline(true);
    expect(await returning.page.evaluate(() => navigator.onLine)).toBe(false);
    const unavailable = await returning.page.evaluate(async (path) => {
      try {
        await fetch(path);
        return false;
      } catch {
        return true;
      }
    }, `/api/v1/games/${gameId}/snapshot`);
    expect(unavailable).toBe(true);
    const missedMessage = `연결 복구 확인 ${randomUUID()}`;
    await mutate(group[0], 'POST', `/games/${gameId}/messages`, { text: missedMessage });
    await expect(returning.page.getByText('실시간 연결 복구 중', { exact: false })).toBeVisible();
    await returning.page.waitForTimeout(8500);
    const recovered = returning.page.waitForResponse((response) => response.url().endsWith(`/games/${gameId}/snapshot`) && response.status() === 200, { timeout: 25000 });
    await returning.context.setOffline(false);
    const snapshot: Game = await (await recovered).json();
    expect(snapshot.myRole.id).toBe(roles[1].myRole.id);
    await expect(returning.page.getByTestId('my-role')).toHaveText(roles[1].myRole.name);
    await expect(returning.page.getByRole('log', { name: '전체 메시지' })).toContainText(missedMessage);
    await expect(returning.page.getByText('실시간 연결됨', { exact: false })).toBeVisible();
    const newMessage = `복귀 뒤 새 대화 ${randomUUID()}`;
    await mutate(group[2], 'POST', `/games/${gameId}/messages`, { text: newMessage });
    await expect(returning.page.getByRole('log', { name: '전체 메시지' })).toContainText(newMessage, { timeout: 10000 });
    await finishGame(group, gameId);
    for (const player of group) {
      await player.page.reload();
      await expect(player.page.getByTestId('ending')).toBeVisible();
    }
    await expect.poll(async () => (await read<Page<{ gameId: string }>>(group[0], '/me/history')).items.some((item) => item.gameId === gameId), { timeout: 20000 }).toBe(true);
    await mutate(group[1], 'POST', '/auth/logout');
    await expect(group[1].page).toHaveURL(/\/login\?next=/, { timeout: 25000 });
    await expect(group[1].page.getByTestId('my-role')).toHaveCount(0);
    await expect(group[1].page.getByTestId('ending')).toHaveCount(0);
    await expect(group[1].page.getByText('실시간 연결됨', { exact: false })).toHaveCount(0);
    expect(pageErrors).toEqual([]);
  } finally {
    await closePlayers(group);
  }
});

test('네 독립 이용자 자동 매칭 → 전원 수락 → 작품 투표 → 확정 대기실', async ({ browser }) => {
  const group = await players(browser);
  try {
    const tickets: string[] = [];
    for (const player of group) {
      await player.page.goto('/match');
      await player.page.getByRole('button', { name: '4인 매칭 시작' }).click();
      await expect(player.page).toHaveURL(/ticket=/);
      tickets.push(new URL(player.page.url()).searchParams.get('ticket')!);
    }
    let proposalId = '';
    await expect
      .poll(
        async () => {
          const ticket = await read<Ticket>(group[0], `/match-tickets/${tickets[0]}`);
          proposalId = ticket.proposalId ?? '';
          return proposalId;
        },
        { timeout: 30000 }
      )
      .not.toBe('');
    for (const player of group) {
      await expect(player.page.getByRole('button', { name: '참가 수락', exact: true })).toBeVisible();
      await player.page.getByRole('button', { name: '참가 수락', exact: true }).click();
    }
    await expect.poll(async () => (await read<Proposal>(group[0], `/match-proposals/${proposalId}`)).status).toBe('VOTING');
    const proposal = await read<Proposal>(group[0], `/match-proposals/${proposalId}`);
    expect(proposal.candidates.length).toBeGreaterThan(0);
    expect(proposal.candidates.length).toBeLessThanOrEqual(3);
    for (const player of group) await mutate(player, 'PUT', `/match-proposals/${proposalId}/scenario-vote`, { scenarioVersionId: proposal.candidates[0].versionId });
    let roomId = '';
    await expect
      .poll(
        async () => {
          const state = await read<Proposal>(group[0], `/match-proposals/${proposalId}`);
          roomId = state.roomId ?? '';
          return roomId;
        },
        { timeout: 45000 }
      )
      .not.toBe('');
    for (const player of group) {
      await expect(player.page).toHaveURL(new RegExp(`/rooms/${roomId}$`));
      await expect(player.page.getByRole('button', { name: '준비 완료', exact: true })).toBeVisible();
    }
  } finally {
    await closePlayers(group);
  }
});

test('참가하지 않은 사용자는 게임의 개인 자료와 메시지를 직접 조회할 수 없다', async ({ browser }) => {
  const group = await players(browser, 5);
  try {
    const catalog = await read<Page<Scenario>>(group[0], '/scenarios');
    const room = await mutate<{ roomId: string }>(group[0], 'POST', '/rooms', { scenarioVersionId: catalog.items[0].versionId, visibility: 'PUBLIC', mode: 'TEXT' });
    for (const player of group.slice(1, 4)) await mutate(player, 'POST', `/rooms/${room.roomId}/join`);
    for (const player of group.slice(0, 4)) await mutate(player, 'PUT', `/rooms/${room.roomId}/ready`, { ready: true });
    const game = await mutate<{ gameId: string }>(group[0], 'POST', `/rooms/${room.roomId}/start`);
    for (const path of ['snapshot', 'me/role', 'messages']) {
      const response = await group[4].context.request.get(`${baseURL}/api/v1/games/${game.gameId}/${path}`);
      expect([403, 404]).toContain(response.status());
      expect(await response.text()).not.toContain('"secret"');
    }
  } finally {
    await closePlayers(group);
  }
});

test('초대 원문은 브라우저에서 생성하고 새 링크 발급 뒤 이전 링크를 거부한다', async ({ browser }) => {
  const group = await players(browser, 3);
  try {
    const catalog = await read<Page<Scenario>>(group[0], '/scenarios');
    await group[0].page.goto(`/scenarios/${catalog.items[0].id}`);
    await group[0].page.getByLabel('모집 방식').selectOption('INVITE');
    await group[0].page.getByRole('button', { name: '이 작품으로 방 만들기' }).click();
    await expect(group[0].page).toHaveURL(/\/rooms\/[0-9a-f-]+$/);
    const firstLink = await group[0].page.getByLabel('초대 링크', { exact: true }).inputValue();
    expect(new URL(firstLink).searchParams.get('invite')).toMatch(/^[A-Za-z0-9_-]{43}$/);
    await group[1].page.goto(firstLink);
    await group[1].page.getByRole('button', { name: '이 방에 참가하기' }).click();
    await expect(group[1].page.getByRole('button', { name: '준비 완료', exact: true })).toBeVisible();
    await group[0].page.getByRole('button', { name: '초대 링크 새로 만들기' }).click();
    await expect.poll(() => group[0].page.getByLabel('초대 링크', { exact: true }).inputValue()).not.toBe(firstLink);
    const secondLink = await group[0].page.getByLabel('초대 링크', { exact: true }).inputValue();
    await group[2].page.goto(firstLink);
    await group[2].page.getByRole('button', { name: '이 방에 참가하기' }).click();
    await expect(group[2].page.getByRole('alert').filter({ hasText: /초대 링크/ })).toBeVisible();
    await group[2].page.goto(secondLink);
    await group[2].page.getByRole('button', { name: '이 방에 참가하기' }).click();
    await expect(group[2].page.getByRole('button', { name: '준비 완료', exact: true })).toBeVisible();
    await group[0].page.reload();
    await expect(group[0].page.getByText('기존 링크의 원문은 보관하지 않습니다.', { exact: false })).toBeVisible();
    await expect(group[0].page.getByLabel('초대 링크', { exact: true })).toHaveCount(0);
  } finally {
    await closePlayers(group);
  }
});
