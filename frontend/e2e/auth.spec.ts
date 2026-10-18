import { expect, test, type Page } from '@playwright/test';

async function authPage(page: Page, providers = { kakaoConfigured: true, localLoginEnabled: false }) {
  await page.route('**/api/v1/auth/me', (route) => route.fulfill({ json: null }));
  await page.route('**/api/v1/auth/providers', (route) => route.fulfill({ json: providers }));
}

for (const path of ['/login', '/register']) {
  test(`${path}에서 카카오 가입·로그인만 활성화되면 이메일 폼을 표시하지 않는다`, async ({ page }) => {
    await authPage(page);
    await page.goto(path);
    await expect(page.getByRole('button', { name: '카카오 로그인', exact: true })).toBeEnabled();
    await expect(page.getByText('처음 이용하는 분은 로그인과 함께 가입됩니다.', { exact: false })).toBeVisible();
    await expect(page.getByLabel('이메일', { exact: true })).toHaveCount(0);
    await expect(page.getByLabel('비밀번호', { exact: true })).toHaveCount(0);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole('button', { name: '카카오 로그인', exact: true })).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}

test('카카오 인증 시작은 CSRF를 보내고 공식 인증 페이지로 이동한다', async ({ page }) => {
  await authPage(page);
  const authorizeUrl = 'https://kauth.kakao.com/oauth/authorize?client_id=ui-test&state=ui-test';
  let posted: unknown;
  let csrfHeader: string | undefined;
  await page.route('**/api/v1/auth/csrf', (route) => route.fulfill({ json: { token: 'ui-csrf', headerName: 'X-CSRF-TOKEN' } }));
  await page.route('**/api/v1/auth/kakao', async (route) => {
    expect(route.request().method()).toBe('POST');
    posted = route.request().postDataJSON();
    csrfHeader = route.request().headers()['x-csrf-token'];
    await route.fulfill({ json: { authorizeUrl } });
  });
  // Only the redirect is under test; no real Kakao account or login success is simulated.
  await page.route('https://kauth.kakao.com/**', (route) => route.fulfill({ contentType: 'text/html', body: '<p>인증 화면 이동 검사</p>' }));
  const next = '/rooms/example?invite=test-token';
  await page.goto(`/login?${new URLSearchParams({ next })}`);
  await page.getByRole('button', { name: '카카오 로그인', exact: true }).click();
  await expect(page).toHaveURL(authorizeUrl);
  expect(posted).toEqual({ next: '/rooms/example' });
  expect(csrfHeader).toBe('ui-csrf');
});

test('카카오 로그인을 취소하면 안내하고 다시 시작할 수 있다', async ({ page }) => {
  await authPage(page);
  await page.goto('/login?kakaoError=cancelled');
  await expect(page.getByRole('alert')).toContainText('카카오 로그인을 취소했어요.');
  await expect(page.getByRole('button', { name: '카카오 로그인', exact: true })).toBeEnabled();
});

test('카카오 로그인을 사용할 수 없으면 비활성 버튼과 안내를 제공한다', async ({ page }) => {
  await authPage(page, { kakaoConfigured: false, localLoginEnabled: false });
  await page.goto('/register');
  await expect(page.getByRole('button', { name: '카카오 로그인', exact: true })).toBeDisabled();
  await expect(page.getByRole('status')).toContainText('지금은 카카오 로그인을 이용할 수 없어요.');
  await expect(page.getByLabel('이메일', { exact: true })).toHaveCount(0);
});

test('예상하지 않은 인증 주소는 이동하지 않고 오류를 표시한다', async ({ page }) => {
  await authPage(page);
  await page.route('**/api/v1/auth/csrf', (route) => route.fulfill({ json: { token: 'ui-csrf', headerName: 'X-CSRF-TOKEN' } }));
  await page.route('**/api/v1/auth/kakao', (route) => route.fulfill({ json: { authorizeUrl: 'https://outside.example/oauth/authorize' } }));
  await page.goto('/login?next=https%3A%2F%2Foutside.example');
  await page.getByRole('button', { name: '카카오 로그인', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('카카오 로그인을 시작하지 못했습니다.');
  await expect(page).toHaveURL(/\/login\?/);
  await expect(page.getByRole('button', { name: '카카오 로그인', exact: true })).toBeEnabled();
});

test('로그인 방법 조회에 실패하면 폼을 숨기고 다시 불러올 수 있다', async ({ page }) => {
  await authPage(page);
  let attempts = 0;
  await page.route('**/api/v1/auth/providers', (route) => {
    attempts += 1;
    return route.fulfill(attempts === 1 ? { status: 503, json: {} } : { json: { kakaoConfigured: true, localLoginEnabled: false } });
  });
  await page.goto('/login');
  await expect(page.getByRole('status')).toContainText('로그인 방법을 불러오지 못했어요.');
  await expect(page.getByLabel('이메일', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: '다시 시도', exact: true }).click();
  await expect(page.getByRole('button', { name: '카카오 로그인', exact: true })).toBeEnabled();
});

test('이메일 로그인이 허용된 환경에서는 기존 가입 폼을 유지한다', async ({ page }) => {
  await authPage(page, { kakaoConfigured: false, localLoginEnabled: true });
  await page.goto('/register?next=%2Frooms%2Fexample');
  await expect(page.getByLabel('이름', { exact: true })).toBeVisible();
  await expect(page.getByLabel('이메일', { exact: true })).toBeVisible();
  await expect(page.getByLabel('비밀번호', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '회원가입', exact: true })).toBeEnabled();
  await expect(page.getByRole('link', { name: '로그인', exact: true }).last()).toHaveAttribute('href', '/login?next=%2Frooms%2Fexample');
});

test('이메일을 제공하지 않은 계정도 서재와 Discord 연결 안내를 볼 수 있다', async ({ page }) => {
  await page.route('**/api/v1/auth/me', (route) => route.fulfill({ json: { id: '00000000-0000-4000-8000-000000000001', displayName: '카카오 탐정', email: null, admin: false } }));
  await page.route('**/api/v1/auth/csrf', (route) => route.fulfill({ status: 503, json: {} }));
  await page.route('**/api/v1/me/activity', (route) => route.fulfill({ json: { kind: 'IDLE', referenceId: null } }));
  await page.route('**/api/v1/me/history?*', (route) => route.fulfill({ json: { items: [], page: 0, size: 20, total: 0 } }));
  await page.route('**/api/v1/me/blocks', (route) => route.fulfill({ json: [] }));
  await page.route('**/api/v1/me/discord', (route) =>
    route.fulfill({ json: { provider: 'disabled', configured: false, botReady: false, linked: false, discordUserId: null, displayName: null, eligible: false, reason: null } })
  );
  await page.goto('/account');
  await expect(page.getByRole('heading', { name: '카카오 탐정 님의 서재' })).toBeVisible();
  await expect(page.getByText('이메일 정보가 제공되지 않았어요.', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Discord 음성 연결' })).toBeVisible();
});
