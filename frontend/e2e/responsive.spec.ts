import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
test.use({ actionTimeout: 15000 });

test('탐색·모집·로그인 화면은 PC와 모바일 경계에서 넘치지 않고 메뉴를 제공한다', async ({ page }) => {
  for (const width of [390, 800, 801, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/', '/scenarios', '/rooms', '/login']) {
      await page.goto(path);
      await expect(page.locator('main h1')).toBeVisible();
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      const desktop = page.getByRole('navigation', { name: '주요 메뉴', exact: true });
      const mobile = page.getByRole('navigation', { name: '모바일 주요 메뉴', exact: true });
      await expect(width <= 800 ? mobile : desktop).toBeVisible();
      await expect(width <= 800 ? desktop : mobile).toBeHidden();
      if (['/', '/scenarios'].includes(path) && [390, 1440].includes(width)) {
        await expect(page.getByRole('article').first()).toBeVisible();
        await page.screenshot({ path: resolve(`../.tools/studio-ui-verification/${path === '/' ? 'home' : 'catalog'}-${width}.png`), fullPage: false });
      }
    }
  }
});

test('모바일 상세 필터는 펼쳐서 선택하고 초기화한 뒤 제작으로 이동할 수 있다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/scenarios');
  const filters = page.getByRole('button', { name: '상세 조건', exact: true });
  await expect(page.getByLabel('난이도', { exact: true })).toBeHidden();
  await filters.click();
  await expect(filters).toHaveAttribute('aria-expanded', 'true');
  await page.getByLabel('난이도', { exact: true }).selectOption('EASY');
  await page.getByLabel('인원', { exact: true }).selectOption('2');
  await expect(page.getByRole('button', { name: '조건 초기화', exact: true })).toBeVisible();
  await filters.click();
  await expect(page.getByLabel('난이도', { exact: true })).toBeHidden();
  await page.getByRole('button', { name: '조건 초기화', exact: true }).click();
  await expect(page.getByLabel('인원', { exact: true })).toHaveValue('');
  await page.getByRole('navigation', { name: '모바일 주요 메뉴', exact: true }).getByRole('link', { name: '만들기', exact: true }).click();
  await expect(page).toHaveURL(/\/login\?next=%2Fstudio$/);
});
