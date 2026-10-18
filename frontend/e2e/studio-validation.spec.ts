import { randomUUID } from 'node:crypto';
import { test, expect, type APIRequestContext, type BrowserContext, type Page } from '@playwright/test';
import type { CardLayout, CardLayoutNode, CanvasNode, Work } from '../src/studio/types';

test.use({ viewport: { width: 1440, height: 1000 }, actionTimeout: 15000 });
const base = process.env.E2E_BASE_URL || 'http://127.0.0.1:5173';
interface ValidationResult {
  valid: boolean;
  revision: number;
  truncated: boolean;
  issues: { path: string; code: string; message: string; severity: string }[];
}

async function read<T>(request: APIRequestContext, path: string): Promise<T> {
  const response = await request.get(`${base}/api/v1${path}`);
  expect(response.ok(), `${path}: ${await response.text()}`).toBeTruthy();
  return response.json();
}

async function mutate<T>(request: APIRequestContext, path: string, body: unknown = {}, method = 'POST'): Promise<T> {
  const csrf = await read<{ headerName: string; token: string }>(request, '/auth/csrf');
  const response = await request.fetch(`${base}/api/v1${path}`, {
    method, data: body, headers: { [csrf.headerName]: csrf.token, 'Idempotency-Key': randomUUID() }
  });
  expect(response.ok(), `${path}: ${await response.text()}`).toBeTruthy();
  return response.json();
}

async function create(context: BrowserContext, templateId: string): Promise<Work> {
  await mutate(context.request, '/auth/register', { email: `validation-${randomUUID()}@example.test`, password: 'MangoDev!2026', displayName: '검증 결과 작가' });
  const created = await mutate<{ id: string }>(context.request, '/author/works', { title: '여러 오류 확인 작품', templateId });
  return read<Work>(context.request, `/author/works/${created.id}`);
}

async function validate(page: Page, workId: string, again = false): Promise<ValidationResult> {
  if (!again) await page.getByRole('tab', { name: '공개 준비', exact: true }).click();
  const response = page.waitForResponse((item) => item.request().method() === 'POST' && item.url().endsWith(`/author/works/${workId}/validate`));
  await page.getByRole('button', { name: again ? '다시 검증' : '검증', exact: true }).click();
  const result = await response;
  expect(result.ok()).toBeTruthy();
  return result.json();
}

function issueButton(page: Page, path: string) {
  return page.getByRole('region', { name: '검증 결과', exact: true }).getByRole('button').filter({ has: page.locator('small').filter({ hasText: `${path} →` }) });
}

function cardNode(id: string): CardLayoutNode {
  return { id, kind: 'TEXT', x: 20, y: 20, width: 160, height: 80, rotation: 0, text: id, fontSize: 20, fill: '#242a27', locked: false, hidden: false };
}

function cardLayout(id: string, name: string): CardLayout {
  return { id, name, width: 600, height: 850, front: { background: '#ffffff', nodes: [cardNode(`${id}-front`)] }, back: { background: '#123456', nodes: [cardNode(`${id}-back`)] } };
}

test('미완성 빈 작품을 저장하고 서버의 다중 오류를 모아 본 뒤 편집하면 이전 결과의 이동을 막는다', async ({ page, context }) => {
  const work = await create(context, 'mystery-blank');
  await page.goto(`/studio/${work.id}`);
  await page.getByRole('tab', { name: '기본 정보', exact: true }).click();
  await page.getByLabel('title 제목', { exact: true }).fill('아직 작성 중인 추리극');
  const saved = page.waitForResponse((response) => response.request().method() === 'PUT' && response.url().endsWith(`/author/works/${work.id}`));
  await page.getByRole('button', { name: '저장', exact: true }).click();
  expect((await saved).ok()).toBeTruthy();
  const stored = await read<Work>(context.request, `/author/works/${work.id}`);
  expect(stored.document.title).toBe('아직 작성 중인 추리극');
  expect(stored.document.roles).toEqual([]);
  expect(stored.versions).toEqual([]);
  const result = await validate(page, work.id);
  expect(result).toMatchObject({ valid: false, revision: stored.revision, truncated: false });
  expect(result.issues.map((issue) => issue.path)).toEqual(expect.arrayContaining(['synopsis', 'roles', 'phases', 'clues', 'targets', 'endings']));
  const panel = page.getByRole('region', { name: '검증 결과', exact: true });
  await expect(panel).toHaveAttribute('data-stale', 'false');
  await expect(panel.locator('li button')).toHaveCount(result.issues.length);
  await expect(panel.locator('summary').filter({ hasText: /^역할 · / })).toBeVisible();
  await issueButton(page, 'synopsis').click();
  const synopsis = page.getByLabel('synopsis 소개', { exact: true });
  await expect(synopsis).toBeFocused();
  await synopsis.fill('미완성 내용도 먼저 저장하고 이어서 작성하는 작품입니다.');
  await expect(panel).toHaveAttribute('data-stale', 'true');
  await expect(panel.getByRole('heading', { name: '이전 편집 내용의 검증 결과', exact: true })).toBeVisible();
  for (const button of await panel.locator('li button').all()) await expect(button).toBeDisabled();
  const checkedAgain = await validate(page, work.id, true);
  expect(checkedAgain.revision).toBeGreaterThan(result.revision);
  expect(checkedAgain.issues.some((issue) => issue.path === 'synopsis')).toBe(false);
  await expect(panel).toHaveAttribute('data-stale', 'false');
  await expect(issueButton(page, 'roles')).toBeEnabled();
});

test('카드 오류를 누르면 정확한 디자인과 앞뒷면 및 요소 속성으로 이동한다', async ({ page, context }) => {
  const work = await create(context, 'tabletop-blank');
  const first = cardLayout('first-design', '첫 번째 정상 카드');
  const second = cardLayout('second-design', '두 번째 검사 카드');
  second.front.nodes[0].fontSize = 4;
  second.back.nodes[0].width = 0;
  work.document.presentation.cardLayouts = [first, second];
  await mutate(context.request, `/author/works/${work.id}`, { revision: work.revision, document: work.document }, 'PUT');
  await page.goto(`/studio/${work.id}`);
  const result = await validate(page, work.id);
  const frontPath = 'presentation.cardLayouts[1].front.nodes[0].fontSize';
  const backPath = 'presentation.cardLayouts[1].back.nodes[0].width';
  expect(result.issues.map((issue) => issue.path)).toEqual(expect.arrayContaining(['synopsis', frontPath, backPath]));
  await issueButton(page, frontPath).click();
  await expect(page.getByRole('tab', { name: '카드 디자인', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('[data-field-path="presentation.cardLayouts.1.name"] input')).toHaveValue('두 번째 검사 카드');
  const faceToggle = page.getByRole('group', { name: '카드 면 전환', exact: true });
  await expect(faceToggle.getByRole('button', { name: '앞면', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-field-path="presentation.cardLayouts.1.front.nodes.0.fontSize"] input')).toBeFocused();
  await issueButton(page, backPath).click();
  await expect(faceToggle.getByRole('button', { name: '뒷면', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const width = page.locator('[data-field-path="presentation.cardLayouts.1.back.nodes.0.width"] input');
  await expect(width).toBeFocused();
  await expect(width).toHaveValue('0');
  await width.fill('160');
  await expect(issueButton(page, frontPath)).toBeDisabled();
  await expect(issueButton(page, backPath)).toBeDisabled();
  const after = await validate(page, work.id, true);
  expect(after.issues.some((issue) => issue.path === backPath)).toBe(false);
  expect(after.issues.some((issue) => issue.path === frontPath)).toBe(true);
  await expect(issueButton(page, frontPath)).toBeEnabled();
  const stored = await read<Work>(context.request, `/author/works/${work.id}`);
  expect(stored.document.presentation.cardLayouts?.[0]).toEqual(first);
  expect(stored.document.presentation.cardLayouts?.[1].back.nodes[0].width).toBe(160);
});

test('100개가 넘는 서버 오류는 처음 100개와 추가 오류 안내만 표시한다', async ({ page, context }) => {
  const work = await create(context, 'yacht-blank');
  work.document.synopsis = '검증 결과의 표시 개수를 확인합니다.';
  work.document.presentation.scenes[0].nodes = Array.from({ length: 101 }, (_, index): CanvasNode => ({
    id: `invalid-width-${index}`, kind: 'RECT', x: 10, y: 10, width: 0, height: 100, rotation: 0, fill: '#ffffff', text: '', fontSize: 20, assetId: null, locked: false, hidden: false, bindingType: 'NONE', bindingId: ''
  }));
  await mutate(context.request, `/author/works/${work.id}`, { revision: work.revision, document: work.document }, 'PUT');
  await page.goto(`/studio/${work.id}`);
  const result = await validate(page, work.id);
  expect(result).toMatchObject({ valid: false, revision: 2, truncated: true });
  expect(result.issues).toHaveLength(100);
  expect(result.issues[99].path).toBe('presentation.scenes[0].nodes[99].width');
  const panel = page.getByRole('region', { name: '검증 결과', exact: true });
  await expect(panel.getByRole('heading', { name: '확인할 항목 100개', exact: true })).toBeVisible();
  await expect(panel.getByText('최대 100개를 표시했습니다. 아래 항목을 수정하고 다시 검사하면 추가 오류를 확인할 수 있습니다.', { exact: true })).toBeVisible();
  await expect(panel.locator('li button')).toHaveCount(100);
  await expect(issueButton(page, 'presentation.scenes[0].nodes[100].width')).toHaveCount(0);
  await expect(panel.getByRole('button', { name: '다시 검증', exact: true })).toBeEnabled();
});
