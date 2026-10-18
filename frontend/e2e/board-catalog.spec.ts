import { expect, test, type Page } from '@playwright/test';
// Catalog boundary cases use public DTO fixtures; existing studio tests cover the real matching API.
const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const scenario = (n: number) => ({
  id: uuid(n),
  versionId: uuid(n + 1000),
  title: `공개 요트 ${String(n).padStart(3, '0')}`,
  gameType: 'YACHT',
  engineId: 'YACHT_V1',
  synopsis: '목록 경계 검증 작품',
  playerCount: 2,
  supportedPlayerCounts: [2, 3, 4],
  modes: ['TEXT'],
  language: 'ko',
  genre: '보드게임',
  difficulty: 'EASY',
  estimatedMinutes: 30,
  roles: [],
  durationEstimated: true
});
async function session(page: Page) {
  await page.route('**/api/v1/auth/me', (route) => route.fulfill({ json: { id: uuid(999), displayName: '목록 확인', email: 'catalog@example.test', admin: false } }));
  await page.route('**/api/v1/me/activity', (route) => route.fulfill({ json: { kind: 'IDLE', referenceId: null } }));
  await page.route('**/api/v1/auth/csrf', (route) => route.fulfill({ json: { token: 'fixture-token', headerName: 'X-CSRF-TOKEN' } }));
  await page.routeWebSocket('**/ws', () => {});
}

test('보드 매칭은 50개 이후 작품을 검색하고 독립 상세의 공개 버전으로 신청한다', async ({ page }) => {
  await session(page);
  const entries = Array.from({ length: 52 }, (_, index) => scenario(index + 1));
  const pages: number[] = [];
  await page.route('**/api/v1/scenarios?*', (route) => {
    const query = new URL(route.request().url()).searchParams;
    const number = Number(query.get('page') ?? 0),
      size = Number(query.get('size') ?? 50);
    const items = query.get('gameType') === 'YACHT' ? entries : [];
    if (query.get('gameType') === 'YACHT') pages.push(number);
    return route.fulfill({ json: { items: items.slice(number * size, (number + 1) * size), total: items.length, page: number, size } });
  });
  const direct = { ...scenario(99), title: '링크로 선택한 작품', versionId: uuid(5000) };
  await page.route(/\/api\/v1\/scenarios\/[0-9a-f-]+$/, (route) => {
    const id = route.request().url().split('/').pop();
    return route.fulfill({ json: id === direct.id ? direct : entries.find((item) => item.id === id) });
  });
  await page.goto('/match?gameType=YACHT');
  await expect(page.getByText('선택할 수 있는 공개 작품 52개')).toBeVisible();
  expect(pages).toContain(1);
  await page.getByLabel('작품 검색', { exact: true }).fill('052');
  await expect(page.getByLabel('작품', { exact: true }).locator('option')).toHaveCount(2);
  await page.getByLabel('작품', { exact: true }).selectOption(uuid(52));
  await expect(page.getByRole('button', { name: '매칭 시작', exact: true })).toBeEnabled();
  await page.goto(`/match?gameType=YACHT&scenario=${direct.id}`);
  await expect(page.getByLabel('작품', { exact: true })).toHaveValue(direct.id);
  await expect(page.locator('strong').filter({ hasText: '링크로 선택한 작품' })).toBeVisible();
  await page.route('**/api/v1/match-tickets', (route) => route.fulfill({ json: { ticketId: uuid(888) } }));
  await page.route(`**/api/v1/match-tickets/${uuid(888)}`, (route) =>
    route.fulfill({ json: { id: uuid(888), gameType: 'YACHT', status: 'WAITING', capacity: 2, mode: 'TEXT', queuedAt: new Date().toISOString(), proposalId: null } })
  );
  const queued = page.waitForRequest((request) => request.url().endsWith('/api/v1/match-tickets') && request.method() === 'POST');
  await page.getByRole('button', { name: '매칭 시작', exact: true }).click();
  expect((await queued).postDataJSON()).toMatchObject({ scenarioVersionId: direct.versionId, gameType: 'YACHT', capacity: 2, mode: 'TEXT' });
  await expect(page.getByRole('heading', { name: '함께할 사람을 찾고 있어요', exact: true })).toBeVisible();
});

test('매칭 목록 일부 실패와 공개되지 않은 직접 링크를 빈 목록으로 숨기지 않는다', async ({ page }) => {
  await session(page);
  let failure = true;
  await page.route('**/api/v1/scenarios?*', (route) => {
    const type = new URL(route.request().url()).searchParams.get('gameType');
    return failure && type === 'YACHT' ? route.fulfill({ status: 503, json: { message: '일시적인 목록 오류' } }) : route.fulfill({ json: { items: [], total: 0, page: 0, size: 50 } });
  });
  await page.route(`**/api/v1/scenarios/${uuid(77)}`, (route) => route.fulfill({ status: 404, json: { message: '공개 작품을 찾을 수 없습니다.' } }));
  await page.goto(`/match?gameType=YACHT&scenario=${uuid(77)}`);
  await expect(page.getByText(/작품 목록을 모두 불러오지 못했습니다/)).toBeVisible();
  await expect(page.getByText(/이 작품의 공개 정보를 확인할 수 없습니다/)).toBeVisible();
  await expect(page.getByRole('button', { name: '매칭 시작', exact: true })).toBeDisabled();
  await expect(page.getByText('선택할 수 있는 공개 작품 0개')).toHaveCount(0);
  failure = false;
  await page.getByRole('button', { name: '작품 목록 다시 불러오기', exact: true }).click();
  await expect(page.getByText('선택할 수 있는 공개 작품 0개')).toBeVisible();
  await page.getByRole('button', { name: '작품 선택 해제', exact: true }).click();
  await expect(page.getByLabel('작품', { exact: true })).toHaveValue('');
  await expect(page.getByText(/이 작품의 공개 정보를 확인할 수 없습니다/)).toHaveCount(0);
});

test('한 유형의 다음 페이지가 실패해도 받은 페이지와 다른 유형을 선택하고 다시 불러온다', async ({ page }) => {
  await session(page);
  const yachts = Array.from({ length: 52 }, (_, index) => scenario(index + 1));
  const table = { ...scenario(300), title: '정상 조회된 자유 테이블', gameType: 'TABLETOP', engineId: 'tabletop-v1' };
  let failedType = 'YACHT';
  await page.route('**/api/v1/scenarios?*', (route) => {
    const params = new URL(route.request().url()).searchParams;
    const gameType = params.get('gameType'),
      number = Number(params.get('page') ?? 0),
      size = Number(params.get('size') ?? 50);
    if (gameType === failedType && (gameType !== 'YACHT' || number === 1)) return route.fulfill({ status: 503, json: { message: '일부 페이지 조회 실패' } });
    const entries = gameType === 'YACHT' ? yachts : gameType === 'TABLETOP' ? [table] : [];
    return route.fulfill({ json: { items: entries.slice(number * size, (number + 1) * size), total: entries.length, page: number, size } });
  });
  await page.route(/\/api\/v1\/scenarios\/[0-9a-f-]+$/, (route) => route.fulfill({ json: [table, ...yachts].find((item) => route.request().url().endsWith(item.id)) }));
  await page.goto('/match?gameType=TABLETOP');
  await expect(page.getByText('불러온 작품 51개 · 일부 목록 미확인')).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('요트 주사위');
  await page.getByLabel('작품', { exact: true }).selectOption(table.id);
  await expect(page.getByRole('button', { name: '매칭 시작', exact: true })).toBeEnabled();
  await page.getByLabel('작품 검색', { exact: true }).fill('050');
  await page.getByLabel('작품', { exact: true }).selectOption(yachts[49].id);
  await expect(page.getByRole('button', { name: '매칭 시작', exact: true })).toBeEnabled();
  // A different failure during retry must also preserve the previously loaded table.
  failedType = 'TABLETOP';
  await page.getByRole('button', { name: '작품 목록 다시 불러오기', exact: true }).click();
  await page.getByLabel('작품 검색', { exact: true }).fill('');
  await expect(page.getByText('불러온 작품 53개 · 일부 목록 미확인')).toBeVisible();
  await page.getByLabel('작품', { exact: true }).selectOption(table.id);
  await expect(page.getByRole('button', { name: '매칭 시작', exact: true })).toBeEnabled();
  failedType = '';
  await page.getByRole('button', { name: '작품 목록 다시 불러오기', exact: true }).click();
  await expect(page.getByText('선택할 수 있는 공개 작품 53개')).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});
