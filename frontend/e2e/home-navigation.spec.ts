import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

test('홈의 만들기·플레이와 여섯 유형 탐색은 실제 경로로 연결된다', async ({ page }) => {
  const authorRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/v1/author/')) authorRequests.push(request.url());
  });
  await page.goto('/');
  const hero = page.locator('section[aria-labelledby="home-title"]');
  await expect(hero).toBeVisible();
  await expect(page.getByRole('navigation', { name: '게임 종류별 탐색' }).getByRole('link')).toHaveCount(6);
  await expect(page.getByRole('region', { name: '지금 플레이할 수 있는 게임' }).getByRole('article')).toHaveCount(6);
  await expect(page.getByLabel('제작 화면 예시', { exact: true })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: resolve('../.tools/studio-redesign-verification/home-desktop.png'), fullPage: true });
  await hero.getByRole('link', { name: '게임 만들기', exact: true }).click();
  await expect(page).toHaveURL(/\/login\?next=%2Fstudio$/);
  await page.goto('/');
  await hero.getByRole('link', { name: '플레이할 게임 찾기', exact: true }).click();
  await expect(page).toHaveURL(/\/scenarios$/);
  await page.goto('/');
  await page.getByRole('navigation', { name: '게임 종류별 탐색' }).getByRole('link').filter({ hasText: '요트' }).click();
  await expect(page).toHaveURL(/gameType=YACHT/);
  await expect(page.getByLabel('게임 종류', { exact: true })).toHaveValue('YACHT');
  expect(authorRequests).toEqual([]);
});

test('탐색 조건은 새로고침·뒤로가기와 주소를 공유하고 잘못된 값은 정리한다', async ({ page }) => {
  await page.goto('/scenarios?gameType=YACHT&playerCount=2');
  await expect(page.getByLabel('게임 종류', { exact: true })).toHaveValue('YACHT');
  await expect(page.getByLabel('인원', { exact: true })).toHaveValue('2');
  await page.getByLabel('인원', { exact: true }).selectOption('4');
  await expect(page).toHaveURL(/playerCount=4/);
  await page.reload();
  await expect(page.getByLabel('인원', { exact: true })).toHaveValue('4');
  await page.goBack();
  await expect(page.getByLabel('인원', { exact: true })).toHaveValue('2');
  await page.goto('/scenarios?gameType=unknown&playerCount=9&difficulty=INVALID&page=-1&private=discard');
  await expect(page).toHaveURL(/\/scenarios$/);
  await expect(page.getByLabel('게임 종류', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('인원', { exact: true })).toHaveValue('');
});

test('홈 제작 예시는 카드·게임판·이야기 흐름을 키보드와 터치로 전환한다', async ({ page }) => {
  const privateRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/v1/author/')) privateRequests.push(request.url());
  });
  await page.goto('/');
  const tabs = page.getByRole('tablist', { name: '제작 화면 예시 종류', exact: true });
  const card = tabs.getByRole('tab', { name: '카드 디자인', exact: true });
  const board = tabs.getByRole('tab', { name: '게임판', exact: true });
  const story = tabs.getByRole('tab', { name: '이야기 흐름', exact: true });
  await expect(card).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel', { name: '카드 디자인', exact: true })).toBeVisible();
  await card.focus();
  await page.keyboard.press('ArrowRight');
  await expect(board).toBeFocused();
  await expect(board).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel', { name: '게임판', exact: true }).getByRole('img')).toHaveAccessibleName('카드와 주사위를 배치한 게임판 예시');
  await expect(page.locator('#home-preview-panel-card')).toBeHidden();
  await page.keyboard.press('End');
  await expect(story).toBeFocused();
  await expect(page.getByRole('tabpanel', { name: '이야기 흐름', exact: true })).toContainText('서로의 단서를 연결해요');
  await page.keyboard.press('ArrowRight');
  await expect(card).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(story).toBeFocused();
  await page.keyboard.press('Home');
  await expect(card).toBeFocused();
  for (const width of [390, 800, 801, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const tab of [board, story, card]) {
      await tab.click();
      await expect(tab).toHaveAttribute('aria-selected', 'true');
      await expect(page.getByRole('tabpanel')).toHaveCount(1);
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const bounds = await tab.boundingBox();
      expect(bounds!.height).toBeGreaterThanOrEqual(44);
    }
  }
  await page.evaluate(() => document.fonts.ready);
  await board.click();
  await page.getByLabel('제작 화면 예시', { exact: true }).screenshot({ path: resolve('../.tools/studio-redesign-verification/home-preview-board.png') });
  await story.click();
  await page.getByLabel('제작 화면 예시', { exact: true }).screenshot({ path: resolve('../.tools/studio-redesign-verification/home-preview-story.png') });
  expect(privateRequests).toEqual([]);
});
