import { randomUUID } from 'node:crypto';
import { test, expect, type APIRequestContext, type BrowserContext, type Page } from '@playwright/test';
import type { Document, StarterTemplate } from '../src/studio/types';

test.use({ viewport: { width: 1440, height: 1000 }, actionTimeout: 15000 });
const base = process.env.E2E_BASE_URL || 'http://127.0.0.1:5173';
async function read<T>(request: APIRequestContext, path: string): Promise<T> {
  const response = await request.get(`${base}/api/v1${path}`);
  expect(response.ok(), `${path}: ${await response.text()}`).toBeTruthy();
  return response.json();
}
async function mutate<T>(request: APIRequestContext, path: string, data: unknown): Promise<T> {
  const csrf = await read<{ headerName: string; token: string }>(request, '/auth/csrf');
  const response = await request.post(`${base}/api/v1${path}`, { data, headers: { [csrf.headerName]: csrf.token, 'Idempotency-Key': randomUUID() } });
  expect(response.ok(), `${path}: ${await response.text()}`).toBeTruthy();
  return response.json();
}
async function openWork(page: Page, context: BrowserContext, gameType = 'YACHT') {
  await mutate(context.request, '/auth/register', { email: `studio-v2-${randomUUID()}@example.test`, password: 'MangoDev!2026', displayName: '새 작업실 검증' });
  const templates = await read<{ items: StarterTemplate[] }>(context.request, '/author/templates');
  const template = templates.items.find((item) => item.gameType === gameType && !item.blank)!;
  expect(template).toBeDefined();
  const work = await mutate<{ id: string }>(context.request, '/author/works', { title: '지켜야 할 원래 작품', gameType, templateId: template.id });
  await page.goto(`/studio/${work.id}`);
  await expect(page.getByRole('tab', { name: gameType === 'MURDER_MYSTERY' ? '이야기 흐름' : gameType === 'TABLETOP' ? '테이블 배치' : '게임 디자인', exact: true })).toHaveAttribute(
    'aria-selected',
    'true'
  );
  await page.getByRole('tab', { name: '템플릿', exact: true }).click();
  return { id: work.id, templates: templates.items };
}
async function draft(context: BrowserContext, id: string) {
  return read<{ revision: number; scenarioId: string; document: Document; versions: { id: string; status: string; reviewStatus: string | null }[] }>(context.request, `/author/works/${id}`);
}
async function save(page: Page) {
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: '개정' })).toContainText('저장됨');
}
async function selectLayer(page: Page, text: string) {
  await page.getByRole('button', { name: '레이어', exact: true }).click();
  await page.getByRole('region', { name: '레이어 목록', exact: true }).getByRole('button', { name: text, exact: true }).click();
  await page.getByRole('button', { name: '레이어 닫기', exact: true }).click();
}

test('넓은 화면에서 구성·작업·오른쪽 속성이 겹치지 않고 선택을 닫아도 저장 내용이 남는다', async ({ page, context }) => {
  const { id } = await openWork(page, context);
  await expect(page.getByRole('heading', { name: '게임 템플릿', exact: true })).toBeVisible();
  await selectLayer(page, '지켜야 할 원래 작품');
  await expect(page.getByRole('heading', { name: '게임 템플릿', exact: true })).not.toBeVisible();
  const content = page.getByRole('textbox', { name: '내용', exact: true });
  await content.fill('선택을 닫아도 남는 실제 서버 자료');
  const properties = await page.getByRole('complementary', { name: '속성', exact: true }).boundingBox();
  const canvas = await page.getByRole('region', { name: '편집 작업 화면', exact: true }).boundingBox();
  const configuration = page.locator('[data-pane]:visible [data-workspace-pane="left"]');
  await expect(configuration).toBeVisible();
  const left = await configuration.boundingBox();
  expect(left!.x + left!.width).toBeLessThanOrEqual(canvas!.x + 1);
  expect(canvas!.x + canvas!.width).toBeLessThanOrEqual(properties!.x + 1);
  await page.getByRole('button', { name: '재료 목록', exact: true }).click();
  await expect(content).toHaveValue('선택을 닫아도 남는 실제 서버 자료');
  await page.keyboard.press('Escape');
  await expect(content).not.toBeVisible();
  await expect(page.getByRole('button', { name: '재료 목록', exact: true })).toBeFocused();
  await expect(page.getByRole('button', { name: /재료 목록으로/ })).not.toBeVisible();
  await save(page);
  const stored = await draft(context, id);
  expect(stored.document.presentation.scenes[0].nodes.some((node) => node.text === '선택을 닫아도 남는 실제 서버 자료')).toBe(true);
  await page.reload();
  await selectLayer(page, '선택을 닫아도 남는 실제 서버 자료');
  await expect(content).toHaveValue('선택을 닫아도 남는 실제 서버 자료');
  await page.getByRole('button', { name: /재료 목록으로/ }).click();
  await expect(content).not.toBeVisible();
  await expect(page.getByRole('button', { name: '재료 목록', exact: true })).toBeFocused();
  await page.getByRole('button', { name: '레이어', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('region', { name: '레이어 목록', exact: true })).not.toBeVisible();
  await expect(page.getByRole('button', { name: '레이어', exact: true })).toBeFocused();
  expect((await draft(context, id)).document).toEqual(stored.document);
});

test('편집기 템플릿은 현재 작품을 보존하고 독립된 새 작품을 만든다', async ({ page, context }) => {
  const { id, templates } = await openWork(page, context, 'TABLETOP');
  await selectLayer(page, '지켜야 할 원래 작품');
  await page.getByRole('textbox', { name: '내용', exact: true }).fill('다른 게임을 만들어도 지켜야 할 문구');
  await save(page);
  const previous = await draft(context, id);
  await page.getByRole('tab', { name: '템플릿', exact: true }).click();
  const template = templates.find((item) => item.gameType === 'YACHT' && !item.blank)!;
  await page.getByLabel('템플릿 검색', { exact: true }).fill(template.title);
  await page.getByRole('button', { name: `${template.title} 새 작품 만들기`, exact: true }).click();
  await page.getByRole('button', { name: '취소', exact: true }).click();
  expect((await draft(context, id)).document).toEqual(previous.document);
  await expect(page).toHaveURL(new RegExp(`/studio/${id}$`));
  await page.getByRole('button', { name: `${template.title} 새 작품 만들기`, exact: true }).click();
  await page.getByLabel('작품 제목', { exact: true }).fill('별도로 만든 요트');
  await page.getByRole('button', { name: '작품 만들기', exact: true }).click();
  await expect(page).not.toHaveURL(new RegExp(`/studio/${id}$`));
  await expect(page).toHaveURL(/\/studio\/[0-9a-f-]+$/);
  const newId = new URL(page.url()).pathname.split('/').pop()!;
  const created = await draft(context, newId);
  expect(created.document.gameType).toBe('YACHT');
  expect(created.document.title).toBe('별도로 만든 요트');
  expect(created.scenarioId).not.toBe(previous.scenarioId);
  expect((await draft(context, id)).document).toEqual(previous.document);
  await page.goto(`/studio/${id}`);
  await selectLayer(page, '다른 게임을 만들어도 지켜야 할 문구');
  await expect(page.getByRole('textbox', { name: '내용', exact: true })).toHaveValue('다른 게임을 만들어도 지켜야 할 문구');
});

test('네 제작 단계에서 저장·서버 시험·검증·검수 요청을 연결한다', async ({ page, context }) => {
  const { id } = await openWork(page, context);
  const steps = page.getByRole('tablist', { name: '제작 단계', exact: true });
  await steps.getByRole('tab', { name: '게임 설정', exact: true }).click();
  await page.getByLabel('주사위 색상', { exact: true }).fill('#5d3b88');
  await save(page);
  expect((await draft(context, id)).document.yacht).toEqual(expect.objectContaining({ diceColor: '#5d3b88' }));
  await steps.getByRole('tab', { name: '테스트', exact: true }).click();
  await expect(page.getByRole('heading', { name: '혼자 시험하기', exact: true })).toBeVisible();
  const creation = page.waitForResponse((response) => response.request().method() === 'POST' && response.url().endsWith('/api/v1/author/sandboxes'));
  await page.getByRole('button', { name: '혼자 역할을 바꾸며 테스트', exact: true }).click();
  const response = await creation;
  expect(response.ok()).toBe(true);
  const sandboxId = (await response.json()).id as string;
  await expect(page.getByRole('heading', { name: '혼자 테스트', exact: true })).toBeVisible();
  const before = await read<{ stateVersion: number; state: { appearance: { diceColor: string }; rollsRemaining: number } }>(context.request, `/author/sandboxes/${sandboxId}?seat=0`);
  expect(before.state.appearance.diceColor).toBe('#5d3b88');
  await page.getByRole('button', { name: '주사위 굴리기 (3회 남음)', exact: true }).click();
  await expect(page.getByRole('button', { name: '주사위 굴리기 (2회 남음)', exact: true })).toBeVisible();
  const after = await read<typeof before>(context.request, `/author/sandboxes/${sandboxId}?seat=0`);
  expect(after.stateVersion).toBeGreaterThan(before.stateVersion);
  expect(after.state.rollsRemaining).toBe(2);
  await page.getByRole('button', { name: '← 편집으로 돌아가기', exact: true }).click();
  await steps.getByRole('tab', { name: '공개 준비', exact: true }).click();
  await page.getByRole('button', { name: '검증', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: '작품 검증을 통과했습니다.' })).toBeVisible();
  const submitting = page.waitForResponse((r) => r.request().method() === 'POST' && r.url().endsWith(`/author/works/${id}/submit`));
  await page.getByRole('button', { name: '공개 검수 요청', exact: true }).click();
  expect((await submitting).ok()).toBe(true);
  await expect(page.getByRole('status').filter({ hasText: '공개 검수를 요청했습니다.' })).toBeVisible();
  const submitted = await draft(context, id);
  expect(submitted.versions).toEqual(expect.arrayContaining([expect.objectContaining({ status: 'DRAFT', reviewStatus: 'PENDING' })]));
  expect((await context.request.get(`${base}/api/v1/scenarios/${submitted.scenarioId}`)).status()).toBe(404);
  await steps.getByRole('tab', { name: '꾸미기', exact: true }).click();
  await expect(page.getByRole('tab', { name: '게임 디자인', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: '장면·자료', exact: true }).click();
  await expect(page.getByRole('button', { name: '레이어', exact: true })).toBeVisible();
});

test('실제 추리 시험에서 역할별 자료 비교는 각 자리의 비밀만 해당 영역에 표시한다', async ({ page, context }) => {
  const { id } = await openWork(page, context, 'MURDER_MYSTERY');
  const roles = (await draft(context, id)).document.roles as { id: string; name: string }[];
  const secrets = roles.map((role, index) => `${role.name}만 알고 있는 검증용 비밀 ${index + 1}`);
  await page.getByRole('tab', { name: '이야기 흐름', exact: true }).click();
  for (const [index, role] of roles.entries()) {
    await page.getByRole('button', { name: role.name, exact: true }).first().click();
    await page.getByLabel(`roles.${index}.secret 개인 비밀`, { exact: true }).fill(secrets[index]);
    await page.getByRole('button', { name: /재료 목록으로/ }).click();
  }
  await save(page);
  const creation = page.waitForResponse((response) => response.request().method() === 'POST' && response.url().endsWith('/api/v1/author/sandboxes'));
  await page.getByRole('button', { name: '시험 플레이', exact: true }).click();
  const response = await creation;
  expect(response.ok()).toBe(true);
  const sandboxId = (await response.json()).id as string;
  await page.getByRole('button', { name: '역할별 자료 비교', exact: true }).click();
  const comparison = page.getByRole('region', { name: '역할별 자료 비교', exact: true });
  await expect(comparison.getByRole('article')).toHaveCount(roles.length);
  for (const seat of roles.keys()) {
    const projection = await read<{ state: { myRole: { id: string; name: string; secret: string }; clues: { text: string }[]; materials: { text: string }[] } }>(
      context.request,
      `/author/sandboxes/${sandboxId}?seat=${seat}`
    );
    const ownSecret = projection.state.myRole.secret;
    expect(secrets).toContain(ownSecret);
    const card = comparison.getByRole('article', { name: `${projection.state.myRole.name}의 자료`, exact: true });
    await expect(card).toContainText(ownSecret);
    for (const secret of secrets.filter((value) => value !== ownSecret)) {
      await expect(card).not.toContainText(secret);
      expect(JSON.stringify(projection.state)).not.toContain(secret);
    }
    for (const clue of projection.state.clues ?? []) await expect(card).toContainText(clue.text);
    for (const material of projection.state.materials ?? []) await expect(card).toContainText(material.text);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  await page.getByRole('button', { name: '플레이 조작 보기', exact: true }).click();
  await expect(comparison).not.toBeVisible();
  await expect(page.getByRole('button', { name: '이 자리 읽기 완료', exact: true })).toBeVisible();
});

test('좁은 화면에서도 제작 단계와 문구 편집을 사용할 수 있고 문서가 가로로 넘치지 않는다', async ({ page, context }) => {
  const { id } = await openWork(page, context);
  for (const width of [390, 768, 1280, 1920]) {
    await page.setViewportSize({ width, height: width <= 768 ? 844 : 1080 });
    for (const name of ['꾸미기', '게임 설정', '테스트', '공개 준비']) {
      await page.getByRole('tablist', { name: '제작 단계', exact: true }).getByRole('tab', { name, exact: true }).click();
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), `${width}px ${name}`).toBeLessThanOrEqual(1);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('tab', { name: '꾸미기', exact: true }).click();
  await page.getByRole('tab', { name: '장면·자료', exact: true }).click();
  await selectLayer(page, '지켜야 할 원래 작품');
  await page.getByRole('textbox', { name: '내용', exact: true }).fill('모바일에서 보존한 문구');
  await save(page);
  await page.getByRole('button', { name: '작업 화면', exact: true }).click();
  await expect(page.getByRole('region', { name: '편집 작업 화면', exact: true })).toBeVisible();
  expect((await draft(context, id)).document.presentation.scenes[0].nodes.some((node) => node.text === '모바일에서 보존한 문구')).toBe(true);
});
