import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import type { Document } from '../src/studio/types';

test.use({ viewport: { width: 1440, height: 1000 }, actionTimeout: 15000 });
const base = process.env.E2E_BASE_URL || 'http://127.0.0.1:5173';
test('이야기 검색·다음 항목·복수 자료지·역참조 탐색은 선택을 보존하고 초안에 저장된다', async ({ page, context }) => {
  let csrf = await (await context.request.get(`${base}/api/v1/auth/csrf`)).json();
  const registration = await context.request.post(`${base}/api/v1/auth/register`, {
    data: { email: `story-${randomUUID()}@example.test`, password: 'MangoDev!2026', displayName: '이야기 탐색 작가' },
    headers: { [csrf.headerName]: csrf.token }
  });
  expect(registration.ok()).toBeTruthy();
  csrf = await (await context.request.get(`${base}/api/v1/auth/csrf`)).json();
  const creation = await context.request.post(`${base}/api/v1/author/works`, {
    data: { title: '자료를 잇는 이야기', templateId: 'mystery-starter' },
    headers: { [csrf.headerName]: csrf.token, 'Idempotency-Key': randomUUID() }
  });
  expect(creation.ok()).toBeTruthy();
  const { id } = await creation.json();
  const read = async () => (await (await context.request.get(`${base}/api/v1/author/works/${id}`)).json()).document as Document;
  const initial = await read();
  const roles = initial.roles as { id: string; name: string }[];
  await page.goto(`/studio/${id}`);
  await page.getByRole('tab', { name: '이야기 흐름', exact: true }).click();
  await page.getByLabel('이야기 항목 종류', { exact: true }).selectOption('roles');
  await page.getByLabel('이야기 항목 검색', { exact: true }).fill('번째 인물');
  const structure = page.getByRole('complementary', { name: '구성', exact: true });
  await expect(structure.getByRole('button', { name: roles[0].name, exact: true })).toBeVisible();
  await structure.getByRole('button', { name: roles[0].name, exact: true }).click();
  await page.getByRole('button', { name: '다음 항목', exact: true }).click();
  await expect(page.getByLabel('roles.1.name 이름', { exact: true })).toHaveValue(roles[1].name);
  await page.getByRole('button', { name: '이전 항목', exact: true }).click();
  await page.getByRole('button', { name: '연결된 자료지 만들기·열기', exact: true }).click();
  await expect(page.getByLabel('편집할 장면', { exact: true })).toContainText(`${roles[0].name} 자료`);
  await page.getByRole('tab', { name: '이야기 흐름', exact: true }).click();
  await page.getByRole('button', { name: '새 자료지 추가', exact: true }).click();
  await expect(page.getByLabel('편집할 장면', { exact: true })).toContainText(`${roles[0].name} 자료 2`);
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: '개정' })).toContainText('저장됨');
  const saved = await read();
  expect(saved.presentation.scenes.filter((scene) => scene.kind === 'ROLE' && scene.referenceId === roles[0].id)).toHaveLength(2);
  await page.getByRole('tab', { name: '이야기 흐름', exact: true }).click();
  await expect(page.getByRole('region', { name: '연결된 자료지', exact: true }).getByRole('button', { name: new RegExp(`^${roles[0].name} 자료.*열기$`) })).toHaveCount(2);
  await page.reload();
  await expect(page.getByLabel('roles.0.name 이름', { exact: true })).toHaveValue(roles[0].name);
  await page.getByRole('button', { name: /범인 투표.*범인 역할/ }).click();
  await expect(page.getByRole('combobox', { name: '범인 역할', exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
