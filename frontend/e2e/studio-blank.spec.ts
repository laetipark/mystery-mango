import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import type { Document } from '../src/studio/types';

test.use({ viewport: { width: 1440, height: 1000 }, actionTimeout: 15000 });
const base = process.env.E2E_BASE_URL || 'http://127.0.0.1:5173';
async function register(context: BrowserContext) {
  const csrf = await (await context.request.get(`${base}/api/v1/auth/csrf`)).json();
  const response = await context.request.post(`${base}/api/v1/auth/register`, {
    data: { email: `blank-${randomUUID()}@example.test`, password: 'MangoDev!2026', displayName: '빈 작품 작가' },
    headers: { [csrf.headerName]: csrf.token }
  });
  expect(response.ok()).toBeTruthy();
}
async function create(page: Page, type: string) {
  await page.goto('/studio');
  await page.getByRole('button', { name: '빈 템플릿', exact: true }).click();
  await expect(page.locator('[data-testid^="blank-template-"]')).toHaveCount(6);
  await page.getByTestId(`blank-template-${type}`).getByRole('button', { name: '빈 작품으로 시작하기', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByLabel('작품 제목', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('작품 제목', { exact: true })).toBeFocused();
  await page.getByLabel('작품 제목', { exact: true }).fill('처음부터 만드는 게임');
  await page.getByRole('button', { name: '작품 만들기', exact: true }).click();
  await expect(page).toHaveURL(/\/studio\/[0-9a-f-]+$/);
  return page.url().split('/').pop()!;
}
async function read(context: BrowserContext, id: string): Promise<Document> {
  const response = await context.request.get(`${base}/api/v1/author/works/${id}`);
  expect(response.ok()).toBeTruthy();
  return (await response.json()).document;
}
async function selectLayer(page: Page, name: string) {
  await page.getByRole('button', { name: '레이어', exact: true }).click();
  await page.getByRole('region', { name: '레이어 목록', exact: true }).getByRole('button', { name, exact: true }).click();
  await page.getByRole('button', { name: '레이어 닫기', exact: true }).click();
}
async function save(page: Page) {
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: '개정' })).toContainText('저장됨');
}
async function fits(page: Page, width: number) {
  await page.setViewportSize({ width, height: width <= 800 ? 844 : 1000 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
}

test('빈 자유 테이블에 직접 구성물을 추가하고 편집 패널은 겹치지 않는다', async ({ page, context }) => {
  await register(context);
  const id = await create(page, 'TABLETOP');
  const initial = await read(context, id);
  expect(initial.tabletop).toEqual({ objects: [], decks: [] });
  expect(initial.presentation.scenes).toHaveLength(1);
  expect(initial.presentation.scenes[0].nodes).toEqual([]);
  expect(initial.presentation.cardLayouts).toEqual([]);
  await page.getByRole('tab', { name: '테이블 배치', exact: true }).click();
  await page.getByRole('button', { name: '카드 추가', exact: true }).click();
  await page.getByLabel('tabletop.objects.0.name 이름', { exact: true }).fill('내 첫 카드');
  await save(page);
  expect((await read(context, id)).tabletop!.objects).toHaveLength(1);
  await page.getByRole('button', { name: '카드 앞·뒷면 디자인', exact: true }).click();
  await selectLayer(page, '새 카드 디자인');
  await page.getByRole('textbox', { name: '내용', exact: true }).fill('처음부터 만든 카드');
  await save(page);
  for (const width of [390, 800, 801, 1280, 1440]) {
    await fits(page, width);
    if (width === 801) {
      const properties = page.getByRole('complementary', { name: '속성', exact: true });
      const center = await page.getByRole('region', { name: '편집 작업 화면', exact: true }).boundingBox();
      const bounds = await properties.boundingBox();
      expect(center!.x + center!.width).toBeLessThanOrEqual(bounds!.x);
      await page.getByRole('button', { name: '작업 화면 넓히기', exact: true }).click();
      await expect(properties).not.toBeVisible();
      await page.getByRole('button', { name: '보조 패널 열기', exact: true }).click();
    }
  }
  await page.screenshot({ path: resolve('../.tools/studio-v2-backend-verification/card-desktop.png'), fullPage: true });
  const canvas = await page.locator('.konvajs-content:visible').boundingBox();
  expect(canvas!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  await fits(page, 390);
  await page.getByRole('button', { name: '속성', exact: true }).click();
  await page.screenshot({ path: resolve('../.tools/studio-v2-backend-verification/card-mobile.png'), fullPage: true });
  await page.reload();
  expect((await read(context, id)).presentation.cardLayouts).toHaveLength(1);
});

test('빈 이야기의 미완성 내용은 저장하고 시험·검수 전에 필요한 내용을 안내한다', async ({ page, context }) => {
  await register(context);
  const id = await create(page, 'MURDER_MYSTERY');
  const initial = await read(context, id);
  for (const key of ['roles', 'phases', 'clues', 'targets', 'rules', 'endings']) expect(initial[key]).toEqual([]);
  await page.getByRole('tab', { name: '이야기 흐름', exact: true }).click();
  await page.getByRole('button', { name: '등장인물 추가', exact: true }).click();
  await page.getByLabel('roles.0.name 이름', { exact: true }).fill('첫 탐정');
  await save(page);
  await page.getByRole('button', { name: '시험 플레이', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`/studio/${id}$`));
  expect((await read(context, id)).roles).toEqual(expect.arrayContaining([expect.objectContaining({ name: '첫 탐정' })]));
  await page.getByRole('tab', { name: '공개 준비', exact: true }).click();
  await page.getByRole('button', { name: '검증', exact: true }).click();
  await expect(page.getByRole('button').filter({ hasText: 'synopsis →' })).toBeVisible();
  await page.getByRole('button').filter({ hasText: 'synopsis →' }).click();
  await expect(page.getByLabel('synopsis 소개', { exact: true })).toBeFocused();
});

test('모바일에서 빈 요트를 만들고 소개를 작성해 고정 규칙으로 시험한다', async ({ page, context }) => {
  await register(context);
  await fits(page, 390);
  const id = await create(page, 'YACHT');
  const initial = await read(context, id);
  expect(initial.engineId).toBe('yacht-v1');
  expect(initial.presentation.scenes[0].nodes).toEqual([]);
  await page.getByRole('tab', { name: '기본 정보', exact: true }).click();
  await page.getByLabel('synopsis 소개', { exact: true }).fill('내 디자인으로 함께하는 요트 게임입니다.');
  await save(page);
  await page.getByRole('button', { name: '시험 플레이', exact: true }).click();
  await expect(page.getByRole('heading', { name: '혼자 테스트', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '주사위 굴리기 (3회 남음)', exact: true }).click();
  await expect(page.getByRole('button', { name: '주사위 굴리기 (2회 남음)', exact: true })).toBeVisible();
});
