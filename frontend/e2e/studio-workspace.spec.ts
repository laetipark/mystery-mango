import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import type { Document } from '../src/studio/types';

test.use({ viewport: { width: 1440, height: 1000 }, actionTimeout: 15000 });
const base = process.env.E2E_BASE_URL || 'http://127.0.0.1:5173';
async function create(page: Page, context: BrowserContext, type: string) {
  const csrf = await (await context.request.get(`${base}/api/v1/auth/csrf`)).json();
  const registration = await context.request.post(`${base}/api/v1/auth/register`, {
    data: { email: `workspace-${randomUUID()}@example.test`, password: 'MangoDev!2026', displayName: '작업실 작가' },
    headers: { [csrf.headerName]: csrf.token }
  });
  expect(registration.ok()).toBeTruthy();
  await page.goto('/studio');
  await page.getByTestId(`template-${type}`).getByRole('button', { name: '이 템플릿으로 만들기', exact: true }).click();
  await page.getByLabel('작품 제목', { exact: true }).fill(type === 'TABLETOP' ? '비밀 열쇠 테이블' : '저택의 마지막 밤');
  await page.getByRole('button', { name: '작품 만들기', exact: true }).click();
  await expect(page).toHaveURL(/\/studio\/[0-9a-f-]+$/);
  return page.url().split('/').pop()!;
}
async function selectLayer(page: Page, name: string) {
  await page.getByRole('button', { name: '레이어', exact: true }).click();
  await page.getByRole('region', { name: '레이어 목록', exact: true }).getByRole('button', { name, exact: true }).click();
  await page.getByRole('button', { name: '레이어 닫기', exact: true }).click();
}
async function saved(page: Page) {
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: '개정' })).toContainText('저장됨');
}
async function readDocument(context: BrowserContext, id: string): Promise<Document> {
  const response = await context.request.get(`${base}/api/v1/author/works/${id}`);
  expect(response.ok()).toBeTruthy();
  return (await response.json()).document;
}
async function fits(page: Page, width: number) {
  await page.setViewportSize({ width, height: width <= 800 ? 844 : 1000 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
}

test('같은 작업실에서 카드 앞뒷면·덱 연결·배치를 저장하고 시험 후 편집으로 돌아온다', async ({ page, context }) => {
  const id = await create(page, context, 'TABLETOP');
  await page.getByRole('tab', { name: '테이블 배치', exact: true }).click();
  await page.getByRole('button', { name: '카드 추가', exact: true }).click();
  const pieceName = page.getByLabel(/tabletop\.objects\.\d+\.name 이름/);
  await pieceName.fill('황금 열쇠');
  await page.getByRole('button', { name: '카드 앞·뒷면 디자인', exact: true }).click();
  await page.getByLabel('카드 디자인 이름', { exact: true }).fill('열쇠 카드');
  await selectLayer(page, '새 카드 디자인');
  await page.getByRole('textbox', { name: '내용', exact: true }).fill('황금 열쇠의 비밀');
  await page.getByRole('group', { name: '카드 면 전환', exact: true }).getByRole('button', { name: '뒷면', exact: true }).click();
  await page.getByRole('button', { name: '텍스트 추가', exact: true }).click();
  await page.getByRole('textbox', { name: '내용', exact: true }).fill('비밀의 문');
  await saved(page);
  const designed = await readDocument(context, id);
  const layout = designed.presentation.cardLayouts!.find((item) => item.name === '열쇠 카드')!;
  expect(layout.front.nodes.some((node) => node.text === '황금 열쇠의 비밀')).toBeTruthy();
  expect(layout.back.nodes.some((node) => node.text === '비밀의 문')).toBeTruthy();
  expect(designed.tabletop!.objects.find((item) => item.name === '황금 열쇠')!.layoutId).toBe(layout.id);

  await page.getByRole('tab', { name: '테이블 배치', exact: true }).click();
  await page.getByRole('button', { name: /재료 목록으로/ }).click();
  await page.getByRole('button', { name: '카드 덱 추가', exact: true }).click();
  await page.getByLabel(/tabletop\.decks\.\d+\.name 이름/).fill('열쇠 덱');
  await page.locator('[data-field-path$="backLayoutId"] select:visible').selectOption(layout.id);
  await page.getByLabel('편집할 덱 카드', { exact: true }).selectOption({ label: '첫 카드' });
  await page.locator('[data-field-path$="layoutId"] select:visible').selectOption(layout.id);
  await saved(page);
  await page.getByRole('button', { name: /재료 목록으로/ }).click();
  await page.getByRole('button', { name: '카드 · 황금 열쇠', exact: true }).click();
  const surface = page.getByTestId('author-tabletop-surface');
  const canvas = await surface.locator('canvas').first().boundingBox();
  const ratio = canvas!.width / 1000;
  await page.mouse.move(canvas!.x + 110 * ratio, canvas!.y + 110 * ratio);
  await page.mouse.down();
  await page.mouse.move(canvas!.x + 250 * ratio, canvas!.y + 350 * ratio, { steps: 8 });
  await page.mouse.up();
  await saved(page);
  const moved = await readDocument(context, id);
  expect(moved.tabletop!.objects.find((item) => item.name === '황금 열쇠')!.y).toBeGreaterThan(80);
  expect(moved.tabletop!.decks.find((item) => item.name === '열쇠 덱')!.cards[0].layoutId).toBe(layout.id);

  await page.getByRole('tab', { name: '장면·자료', exact: true }).click();
  await selectLayer(page, '비밀 열쇠 테이블');
  await page.getByRole('textbox', { name: '내용', exact: true }).fill('테이블 안내도 함께 저장');
  await saved(page);
  expect((await readDocument(context, id)).presentation.cardLayouts).toEqual(moved.presentation.cardLayouts);
  await page.getByRole('tab', { name: '카드 디자인', exact: true }).click();
  await expect(page.getByRole('group', { name: '카드 면 전환', exact: true }).getByRole('button', { name: '뒷면', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '시험 플레이', exact: true }).click();
  await expect(page.getByRole('heading', { name: '혼자 테스트' })).toBeVisible();
  await expect(page.getByRole('button', { name: '열쇠 덱 덱, 1장', exact: true }).getByRole('img', { name: '덱 뒷면', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '← 편집으로 돌아가기', exact: true }).click();
  await expect(page.getByRole('tab', { name: '카드 디자인' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('group', { name: '카드 면 전환', exact: true }).getByRole('button', { name: '뒷면', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('tab', { name: '테이블 배치', exact: true }).click();
  for (const width of [390, 800, 801, 1280, 1440]) await fits(page, width);
  await page.screenshot({ path: resolve('../.tools/studio-v2-backend-verification/workspace-table-desktop.png'), fullPage: true });
  await fits(page, 390);
  await page.getByRole('button', { name: '구성', exact: true }).click();
  await page.getByRole('button', { name: '카드 · 황금 열쇠', exact: true }).click();
  await page.getByRole('button', { name: '속성', exact: true }).click();
  await pieceName.fill('모바일에서 고친 열쇠');
  await saved(page);
  await page.getByRole('button', { name: '작업 화면', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: '작업 화면', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.screenshot({ path: resolve('../.tools/studio-v2-backend-verification/workspace-table-mobile.png'), fullPage: true });
  await page.reload();
  await page.getByRole('tab', { name: '테이블 배치', exact: true }).click();
  await page.getByRole('button', { name: '구성', exact: true }).click();
  await expect(page.getByRole('button', { name: '카드 · 모바일에서 고친 열쇠', exact: true })).toBeVisible();
});

test('이야기 흐름에서 역할 자료를 만들고 조사 장소와 단서를 이름으로 연결한다', async ({ page, context }) => {
  const id = await create(page, context, 'MURDER_MYSTERY');
  await page.getByRole('tab', { name: '이야기 흐름', exact: true }).click();
  const initial = await readDocument(context, id);
  const roles = initial.roles as { id: string; name: string }[];
  const targets = initial.targets as { id: string; name: string; clueIds: string[] }[];
  const clues = initial.clues as { id: string; title: string }[];
  await page.getByRole('button', { name: roles[0].name, exact: true }).first().click();
  await page.getByLabel('roles.0.secret 개인 비밀', { exact: true }).fill('서재 열쇠를 숨긴 사람은 나다.');
  await page.getByRole('button', { name: '연결된 자료지 만들기·열기', exact: true }).click();
  await expect(page.getByLabel('편집할 장면')).toContainText(`${roles[0].name} 자료`);
  await saved(page);
  const withMaterial = await readDocument(context, id);
  expect(withMaterial.presentation.scenes.some((scene) => scene.kind === 'ROLE' && scene.referenceId === roles[0].id)).toBeTruthy();
  await page.getByRole('tab', { name: '이야기 흐름', exact: true }).click();
  await page.getByRole('button', { name: /재료 목록으로/ }).click();
  await page.getByRole('button', { name: targets[0].name, exact: true }).first().click();
  const linkedClue = page.locator('[data-field-path="targets.0.clueIds"]').getByLabel(clues[0].title, { exact: true });
  await linkedClue.check();
  await saved(page);
  expect((await readDocument(context, id)).targets).toEqual(expect.arrayContaining([expect.objectContaining({ id: targets[0].id, clueIds: expect.arrayContaining([clues[0].id]) })]));
  await page.screenshot({ path: resolve('../.tools/studio-v2-backend-verification/workspace-mystery-desktop.png'), fullPage: true });
  for (const width of [390, 800, 801, 1280, 1440]) await fits(page, width);
  await fits(page, 390);
  await page.getByRole('button', { name: '구성', exact: true }).click();
  await page.getByRole('button', { name: roles[0].name, exact: true }).click();
  await page.getByRole('button', { name: '속성', exact: true }).click();
  await page.getByLabel('roles.0.secret 개인 비밀', { exact: true }).fill('모바일에서 확인한 비밀');
  await saved(page);
  await page.screenshot({ path: resolve('../.tools/studio-v2-backend-verification/workspace-mystery-mobile.png'), fullPage: true });
  expect((await readDocument(context, id)).roles).toEqual(expect.arrayContaining([expect.objectContaining({ secret: '모바일에서 확인한 비밀' })]));
});

test('저장 실패 사본을 복구하고 작업실 시험을 새로고침해 이어간다', async ({ page, context }) => {
  const id = await create(page, context, 'YACHT');
  await page.getByRole('tab', { name: '기본 정보', exact: true }).click();
  const path = `**/api/v1/author/works/${id}`;
  await page.route(path, async (route) => {
    if (route.request().method() === 'PUT') await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: '시험용 저장 장애' }) });
    else await route.continue();
  });
  await page.getByLabel('title 제목', { exact: true }).fill('실패해도 보존한 작품');
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('시험용 저장 장애');
  await page.reload();
  await expect(page.getByRole('button', { name: '편집 사본 복구', exact: true })).toBeVisible();
  await page.unroute(path);
  await page.getByRole('button', { name: '편집 사본 복구', exact: true }).click();
  await page.getByRole('tab', { name: '기본 정보', exact: true }).click();
  await expect(page.getByLabel('title 제목', { exact: true })).toHaveValue('실패해도 보존한 작품');
  await saved(page);
  expect((await readDocument(context, id)).title).toBe('실패해도 보존한 작품');
  await page.getByRole('button', { name: '시험 플레이', exact: true }).click();
  await expect(page.getByRole('heading', { name: '혼자 테스트' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: '혼자 테스트' })).toBeVisible();
  await page.getByRole('button', { name: '← 편집으로 돌아가기', exact: true }).click();
  await expect(page.getByRole('tab', { name: '기본 정보', exact: true })).toHaveAttribute('aria-selected', 'true');
});
