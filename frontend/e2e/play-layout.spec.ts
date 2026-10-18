import { randomBytes, randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { test, expect, type Browser, type BrowserContext, type Page } from '@playwright/test';

const base = process.env.E2E_BASE_URL || 'http://127.0.0.1:5173';
const captureRoot = resolve('../.tools/studio-ui-verification/play-layout');

async function write<T>(context: BrowserContext, path: string, data: unknown = {}, method = 'POST'): Promise<T> {
  const csrf = await (await context.request.get(`${base}/api/v1/auth/csrf`)).json();
  const response = await context.request.fetch(`${base}/api/v1${path}`, { method, data, headers: { [csrf.headerName]: csrf.token, 'Idempotency-Key': randomUUID() } });
  expect(response.ok(), `${path}: ${await response.text()}`).toBeTruthy();
  return response.json();
}
async function participant(browser: Browser, displayName: string) {
  const context = await browser.newContext({ baseURL: base });
  await write(context, '/auth/register', { email: `play-layout-${randomUUID()}@example.test`, password: 'MangoDev!2026', displayName });
  return context;
}
async function game(browser: Browser, type: string) {
  const host = await participant(browser, '긴 닉네임으로 플레이하는 망고 탐정');
  const guest = await participant(browser, '함께 사건을 해결하는 두 번째 탐정');
  let roomId: string;
  if (type === 'MURDER_MYSTERY') {
    const catalog = await (await host.request.get(`${base}/api/v1/scenarios?gameType=MURDER_MYSTERY&playerCount=1&size=12`)).json();
    roomId = (await write<{ roomId: string }>(host, '/rooms', { scenarioVersionId: catalog.items[0].versionId, visibility: 'PUBLIC', mode: 'TEXT' })).roomId;
  } else {
    const work = await write<{ id: string }>(host, '/author/works', { title: '반응형 플레이 화면', gameType: type, templateId: `${type.toLowerCase()}-starter` });
    const draft = await (await host.request.get(`${base}/api/v1/author/works/${work.id}`)).json();
    const version = await write<{ versionId: string }>(host, `/author/works/${work.id}/freeze`, { revision: draft.revision });
    const token = randomBytes(32).toString('base64url');
    roomId = (await write<{ roomId: string }>(host, `/author/works/${work.id}/test-room`, { versionId: version.versionId, capacity: 2, mode: 'TEXT', inviteToken: token })).roomId;
    await write(guest, `/rooms/${roomId}/join`, { inviteToken: token });
    await write(guest, `/rooms/${roomId}/ready`, { ready: true }, 'PUT');
  }
  await write(host, `/rooms/${roomId}/ready`, { ready: true }, 'PUT');
  const result = await write<{ gameId: string }>(host, `/rooms/${roomId}/start`);
  return { host, guest, id: result.gameId };
}
async function fits(page: Page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
}

for (const type of ['YACHT', 'TABLETOP', 'GOMOKU', 'REVERSI', 'CHECKERS', 'MURDER_MYSTERY']) {
  test(`${type} 실제 플레이는 390·800·801·1280 너비에서 게임판과 보조 화면이 넘치지 않는다`, async ({ browser }) => {
    const session = await game(browser, type);
    const page = await session.host.newPage();
    try {
      await page.goto(`/games/${session.id}`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      for (const width of [1280, 801, 800, 390]) {
        await page.setViewportSize({ width, height: 1000 });
        if (width <= 800) await page.getByRole('tab', { name: type === 'MURDER_MYSTERY' ? '조사 · 진행' : '게임판', exact: true }).click();
        await fits(page);
        if (type === 'MURDER_MYSTERY') {
          expect(await page.locator('#panel-investigation').evaluate((element) => [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim() === '0'))).toBe(
            false
          );
        } else if (width === 801) {
          const folded = page.getByText('작품 장면·내 자료', { exact: true }).locator('..');
          expect((await folded.boundingBox())!.height).toBeLessThan(150);
        }
        await page.screenshot({ path: resolve(captureRoot, `${type.toLowerCase()}-${width}.png`), fullPage: true });
        if (width <= 800) {
          await page.getByRole('tab', { name: type === 'MURDER_MYSTERY' ? '내 역할' : '참가자·자료', exact: true }).click();
          await fits(page);
          if (width === 390) await page.screenshot({ path: resolve(captureRoot, `${type.toLowerCase()}-info-${width}.png`), fullPage: true });
          await page.getByRole('tab', { name: '대화', exact: true }).click();
          await fits(page);
          if (type === 'MURDER_MYSTERY') {
            const column = await page.locator('#panel-chat').boundingBox();
            const cards = await page.locator('#panel-chat > section, #panel-chat > details').all();
            for (const card of cards) expect((await card.boundingBox())!.width).toBeGreaterThanOrEqual(column!.width - 1);
          }
          if (width === 390) await page.screenshot({ path: resolve(captureRoot, `${type.toLowerCase()}-chat-${width}.png`), fullPage: true });
        }
      }
    } finally {
      await session.host.close();
      await session.guest.close();
    }
  });
}
