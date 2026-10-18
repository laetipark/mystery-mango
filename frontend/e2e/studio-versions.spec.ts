import { randomUUID } from 'node:crypto';
import { test, expect, type APIRequestContext, type BrowserContext, type Page } from '@playwright/test';
import type { Document, GameType, Work } from '../src/studio/types';

test.use({ viewport: { width: 1440, height: 1000 }, actionTimeout: 15000 });
const base = process.env.E2E_BASE_URL || 'http://127.0.0.1:5173';

async function read<T>(request: APIRequestContext, path: string): Promise<T> {
  const response = await request.get(`${base}/api/v1${path}`);
  expect(response.ok(), `${path}: ${await response.text()}`).toBeTruthy();
  return response.json();
}

async function mutate<T>(request: APIRequestContext, path: string, body: unknown = {}, method = 'POST'): Promise<T> {
  const csrf = await read<{ headerName: string; token: string }>(request, '/auth/csrf');
  const response = await request.fetch(`${base}/api/v1${path}`, {
    method,
    data: body,
    headers: { [csrf.headerName]: csrf.token, 'Idempotency-Key': randomUUID() }
  });
  expect(response.ok(), `${path}: ${await response.text()}`).toBeTruthy();
  return response.json();
}

async function register(context: BrowserContext) {
  await mutate(context.request, '/auth/register', { email: `versions-${randomUUID()}@example.test`, password: 'MangoDev!2026', displayName: '버전 시험 작가' });
}

async function create(context: BrowserContext, gameType: GameType, title: string, changes?: Partial<Document>) {
  const work = await mutate<{ id: string }>(context.request, '/author/works', { title, gameType });
  let draft = await read<Work>(context.request, `/author/works/${work.id}`);
  if (changes) {
    await mutate(context.request, `/author/works/${work.id}`, { revision: draft.revision, document: { ...draft.document, ...changes } }, 'PUT');
    draft = await read<Work>(context.request, `/author/works/${work.id}`);
  }
  const frozen = await mutate<{ versionId: string }>(context.request, `/author/works/${work.id}/freeze`, { revision: draft.revision });
  return { ...draft, versionId: frozen.versionId };
}

async function openVersion(page: Page) {
  await page.getByRole('tab', { name: '공개 준비', exact: true }).click();
  const history = page.getByRole('region', { name: '버전과 검수', exact: true });
  const show = history.getByRole('button', { name: '내용 보기 · 이 버전 시험', exact: true }).first();
  if ((await show.getAttribute('aria-expanded')) !== 'true') await show.click();
  await expect(history.getByRole('combobox', { name: '이 버전 시험 인원', exact: true })).toBeVisible();
  return history;
}

async function nextPhase(page: Page, kind: string) {
  await page.getByRole('button', { name: '다음 시간으로', exact: true }).click();
  await expect(page.getByRole('heading', { name: `${kind} · ACTIVE`, exact: true })).toBeVisible();
}

async function reachUnresolved(page: Page) {
  await expect(page.getByRole('heading', { name: 'READING · ACTIVE', exact: true })).toBeVisible();
  await nextPhase(page, 'INVESTIGATION');
  await nextPhase(page, 'VOTE');
  await nextPhase(page, 'ENDING');
  await expect(page.getByRole('heading', { name: '남은 이야기', exact: true })).toBeVisible();
}

test('이전 버전의 인원·방식으로 다시 시험해도 현재 초안과 개정은 유지된다', async ({ page, context }) => {
  await register(context);
  const original = await create(context, 'YACHT', '이전 버전의 네 자리 요트', { modes: ['TEXT', 'DISCORD'] });
  const latestDocument = { ...original.document, title: '아직 편집 중인 두 자리 요트', synopsis: '새 초안에만 있는 설명', supportedPlayerCounts: [2], modes: ['TEXT'] };
  await mutate(context.request, `/author/works/${original.id}`, { revision: original.revision, document: latestDocument }, 'PUT');
  const before = await read<Work>(context.request, `/author/works/${original.id}`);
  let freezes = 0;
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().endsWith(`/author/works/${original.id}/freeze`)) freezes++;
  });
  await page.goto(`/studio/${original.id}`);
  const history = await openVersion(page);
  await expect(history.getByRole('heading', { name: original.document.title, exact: true })).toBeVisible();
  await expect(history.getByText('현재 초안을 유지하며 이 버전의 내용으로 시험합니다.', { exact: true })).toBeVisible();
  await expect(history.getByRole('combobox', { name: '이 버전 시험 인원', exact: true }).locator('option')).toHaveText(['1명', '2명', '3명', '4명']);
  await expect(history.getByRole('combobox', { name: '이 버전 대화 방식', exact: true }).locator('option')).toHaveText(['텍스트', 'Discord']);
  await history.getByText('고정된 규칙과 내용 보기', { exact: true }).click();
  await expect(history.locator('fieldset input').first()).toBeDisabled();
  await history.getByRole('combobox', { name: '이 버전 대화 방식', exact: true }).selectOption('DISCORD');
  await expect(history.getByRole('combobox', { name: '이 버전 대화 방식', exact: true })).toHaveValue('DISCORD');
  await history.getByRole('combobox', { name: '이 버전 시험 인원', exact: true }).selectOption('1');
  const soloRequest = page.waitForRequest((request) => request.method() === 'POST' && request.url().endsWith('/author/sandboxes'));
  await history.getByRole('button', { name: '이 버전 혼자 시험', exact: true }).click();
  expect((await soloRequest).postDataJSON()).toEqual({ versionId: original.versionId, capacity: 1 });
  await expect(page.getByRole('heading', { name: '혼자 테스트', exact: true })).toBeVisible();
  await expect(page.getByText(`버전 1 · 개정 ${original.revision} · 자리를 바꾸며 플레이를 확인하세요. 실제 플레이 기록에 남지 않습니다.`, { exact: true })).toBeVisible();
  await expect(page.getByLabel('현재 자리').locator('option')).toHaveText(['1번 자리']);
  await page.getByRole('button', { name: '← 편집으로 돌아가기', exact: true }).click();
  await expect(history.getByRole('button', { name: '내용 보기 · 이 버전 시험', exact: true }).first()).toHaveAttribute('aria-expanded', 'true');
  await expect(history.getByRole('combobox', { name: '이 버전 시험 인원', exact: true })).toHaveValue('1');
  await expect(history.getByRole('combobox', { name: '이 버전 대화 방식', exact: true })).toHaveValue('DISCORD');
  const again = await openVersion(page);
  await again.getByRole('combobox', { name: '이 버전 시험 인원', exact: true }).selectOption('3');
  await again.getByRole('combobox', { name: '이 버전 대화 방식', exact: true }).selectOption('TEXT');
  const invitedRequest = page.waitForRequest((request) => request.method() === 'POST' && request.url().endsWith(`/author/works/${original.id}/test-room`));
  await again.getByRole('button', { name: '이 버전 초대 시험', exact: true }).click();
  expect((await invitedRequest).postDataJSON()).toMatchObject({ versionId: original.versionId, capacity: 3, mode: 'TEXT' });
  await expect(page).toHaveURL(/\/rooms\/[0-9a-f-]+$/);
  await expect(page.getByRole('heading', { name: original.document.title, exact: true })).toBeVisible();
  await expect(page.getByText('텍스트로 대화합니다.', { exact: true })).toBeVisible();
  const roomId = new URL(page.url()).pathname.split('/').pop()!;
  const room = await read<{ scenarioVersionId: string; capacity: number; mode: string; isTest: boolean }>(context.request, `/rooms/${roomId}`);
  expect(room).toMatchObject({ scenarioVersionId: original.versionId, capacity: 3, mode: 'TEXT', isTest: true });
  const after = await read<Work>(context.request, `/author/works/${original.id}`);
  expect(after.revision).toBe(before.revision);
  expect(after.document).toEqual(before.document);
  expect(after.versions).toEqual(before.versions);
  expect(freezes).toBe(0);
  await mutate(context.request, `/rooms/${roomId}/leave`);
});

test('실제로 도달한 엔딩의 작가 기록을 표시하고 시험 초기화 후에도 보존한다', async ({ page, context }, testInfo) => {
  await register(context);
  const work = await create(context, 'MURDER_MYSTERY', '결말을 확인하는 추리극');
  await page.goto(`/studio/${work.id}`);
  const history = await openVersion(page);
  const records = page.getByRole('region', { name: '엔딩 시험 기록', exact: true });
  await expect(records.getByRole('heading', { name: '시험에서 도달한 엔딩 0/2', exact: true })).toBeVisible();
  await expect(records.getByRole('columnheader')).toHaveText(['엔딩', '작가 혼자 시험', '검수자 혼자 시험', '초대 시험']);
  await history.getByRole('button', { name: '이 버전 혼자 시험', exact: true }).click();
  await reachUnresolved(page);
  await page.getByRole('button', { name: '처음부터 다시', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'READING · ACTIVE', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '← 편집으로 돌아가기', exact: true }).click();
  await openVersion(page);
  await expect(records.getByRole('heading', { name: '시험에서 도달한 엔딩 1/2', exact: true })).toBeVisible();
  const reached = records.getByRole('row', { name: /남은 이야기/ });
  await expect(reached.getByRole('cell').nth(0)).not.toHaveText('기록 없음');
  await expect(reached.getByRole('cell').nth(1)).toHaveText('기록 없음');
  await expect(reached.getByRole('cell').nth(2)).toHaveText('기록 없음');
  await expect(records.getByRole('row', { name: /사건 해결/ }).getByRole('cell')).toHaveText(['기록 없음', '기록 없음', '기록 없음']);
  await expect(records).toContainText('모든 엔딩을 시험해야 공개할 수 있는 것은 아닙니다.');
  await records.getByRole('button', { name: '시험 기록 새로고침', exact: true }).click();
  await expect(records.getByRole('heading', { name: '시험에서 도달한 엔딩 1/2', exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('author-ending-records-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(records.getByRole('heading', { name: '시험에서 도달한 엔딩 1/2', exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  await page.screenshot({ path: testInfo.outputPath('author-ending-records-mobile.png'), fullPage: true });
  await page.reload();
  await openVersion(page);
  await expect(records.getByRole('heading', { name: '시험에서 도달한 엔딩 1/2', exact: true })).toBeVisible();
});

test('검수자가 고정 버전의 허용 인원을 골라 시험하고 엔딩을 검수자 기록으로 남긴다', async ({ browser, context }) => {
  await register(context);
  const board = await create(context, 'YACHT', '한 명 또는 세 명의 검수 요트', { playerCount: 1, supportedPlayerCounts: [1, 3] });
  const boardReview = await mutate<{ reviewId: string }>(context.request, `/author/works/${board.id}/submit`, { revision: board.revision });
  const mystery = await create(context, 'MURDER_MYSTERY', '검수자가 확인한 결말');
  const mysteryReview = await mutate<{ reviewId: string }>(context.request, `/author/works/${mystery.id}/submit`, { revision: mystery.revision });
  const admin = await browser.newContext();
  try {
    await mutate(admin.request, '/auth/login', { email: process.env.E2E_REVIEWER_EMAIL || 'admin@example.test', password: 'MangoDev!2026' });
    const page = await admin.newPage();
    for (const count of [3, 1]) {
      await page.goto(`/admin/reviews/${boardReview.reviewId}`);
      await expect(page.getByRole('combobox', { name: '검수 시험 인원', exact: true }).locator('option')).toHaveText(['1명', '3명']);
      await page.getByRole('combobox', { name: '검수 시험 인원', exact: true }).selectOption(String(count));
      const request = page.waitForRequest((request) => request.method() === 'POST' && request.url().endsWith('/author/sandboxes'));
      await page.getByRole('button', { name: '샌드박스에서 검증', exact: true }).click();
      expect((await request).postDataJSON()).toEqual({ versionId: board.versionId, capacity: count });
      await expect(page).toHaveURL(new RegExp(`/studio/sandboxes/[0-9a-f-]+\\?capacity=${count}$`));
      await expect(page.getByLabel('현재 자리').locator('option')).toHaveCount(count);
    }
    await page.goto(`/admin/reviews/${mysteryReview.reviewId}`);
    await expect(page.getByRole('combobox', { name: '검수 시험 인원', exact: true }).locator('option')).toHaveText(['2명']);
    await page.getByRole('button', { name: '샌드박스에서 검증', exact: true }).click();
    await reachUnresolved(page);
    await page.goto(`/admin/reviews/${mysteryReview.reviewId}`);
    const records = page.getByRole('region', { name: '엔딩 시험 기록', exact: true });
    await expect(records.getByRole('heading', { name: '시험에서 도달한 엔딩 1/2', exact: true })).toBeVisible();
    const row = records.getByRole('row', { name: /남은 이야기/ });
    await expect(row.getByRole('cell').nth(0)).toHaveText('기록 없음');
    await expect(row.getByRole('cell').nth(1)).not.toHaveText('기록 없음');
    await expect(row.getByRole('cell').nth(2)).toHaveText('기록 없음');
    const review = await read<{ status: string }>(admin.request, `/admin/scenario-reviews/${mysteryReview.reviewId}`);
    expect(review.status).toBe('PENDING');
    const after = await read<Work>(context.request, `/author/works/${mystery.id}`);
    expect(after.revision).toBe(mystery.revision);
    expect(after.document).toEqual(mystery.document);
  } finally {
    await admin.close();
  }
});
