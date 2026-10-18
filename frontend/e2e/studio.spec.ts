import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { test, expect, type APIRequestContext, type BrowserContext, type Page } from '@playwright/test';
test.use({ actionTimeout: 15000, hasTouch: true });
const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:5173';
async function mutate<T>(request: APIRequestContext, path: string, body: unknown = {}, method = 'POST'): Promise<T> {
  const csrf = await (await request.get(`${baseURL}/api/v1/auth/csrf`)).json();
  const response = await request.fetch(`${baseURL}/api/v1${path}`, { method, data: body, headers: { [csrf.headerName]: csrf.token, 'Idempotency-Key': randomUUID() } });
  expect(response.ok(), `${path}: ${await response.text()}`).toBeTruthy();
  return response.json();
}
async function read<T>(request: APIRequestContext, path: string): Promise<T> {
  const r = await request.get(`${baseURL}/api/v1${path}`);
  expect(r.ok()).toBeTruthy();
  return r.json();
}
async function register(context: BrowserContext) {
  return mutate<{ id: string }>(context.request, '/auth/register', { email: `studio-${randomUUID()}@example.test`, password: 'MangoDev!2026', displayName: '작가 검증' });
}
async function createSandbox(page: Page, context: BrowserContext, gameType: string, firstPieceColor?: string) {
  const templates = await read<{ items: { id: string; gameType: string; blank: boolean }[] }>(context.request, '/author/templates');
  const template = templates.items.find((item) => item.gameType === gameType && !item.blank)!;
  expect(template).toBeDefined();
  const work = await mutate<{ id: string }>(context.request, '/author/works', { title: '플레이 화면 검증', gameType, templateId: template.id });
  const draft = await read<{ revision: number; document: Record<string, unknown> }>(context.request, `/author/works/${work.id}`);
  let revision = draft.revision;
  if (firstPieceColor) {
    const saved = await mutate<{ revision: number }>(
      context.request,
      `/author/works/${work.id}`,
      {
        revision,
        document: { ...draft.document, classic: { ...(draft.document.classic as Record<string, string>), firstPieceColor } }
      },
      'PUT'
    );
    revision = saved.revision;
  }
  const frozen = await mutate<{ versionId: string }>(context.request, `/author/works/${work.id}/freeze`, { revision });
  const sandbox = await mutate<{ id: string }>(context.request, '/author/sandboxes', { versionId: frozen.versionId, capacity: 2 });
  await page.goto(`/studio/sandboxes/${sandbox.id}?capacity=2`);
  return sandbox.id;
}
async function createWork(page: Page, gameType = 'YACHT') {
  await page.goto('/studio');
  await page.getByTestId(`template-${gameType}`).getByRole('button', { name: '이 템플릿으로 만들기', exact: true }).click();
  await page.getByLabel('작품 제목', { exact: true }).fill('브라우저 작품');
  await page.getByRole('button', { name: '작품 만들기', exact: true }).click();
  await expect(page).toHaveURL(/\/studio\/[0-9a-f-]+$/);
  return page.url().split('/').pop()!;
}

async function selectLayer(page: Page, name: string) {
  await page.getByRole('button', { name: '레이어', exact: true }).click();
  await page.getByRole('region', { name: '레이어 목록', exact: true }).getByRole('button', { name, exact: true }).click();
  await page.getByRole('button', { name: '레이어 닫기', exact: true }).click();
}

test('일반 작가가 한글 장면·자산을 저장하고 저장 충돌의 로컬 사본을 복구한다', async ({ page, context }) => {
  await register(context);
  const id = await createWork(page);
  await page.getByRole('tab', { name: '장면·자료', exact: true }).click();
  await selectLayer(page, '브라우저 작품');
  await page.getByLabel('내용', { exact: true }).dispatchEvent('compositionstart');
  await page.getByLabel('내용', { exact: true }).fill('한글 조합과 자료 연출');
  await page.getByLabel('내용', { exact: true }).dispatchEvent('compositionend', { data: '연출' });
  await page.getByLabel('보기 배율', { exact: true }).selectOption('0.65');
  const canvas = await page.locator('.konvajs-content').boundingBox();
  expect(canvas).not.toBeNull();
  await page.mouse.move(canvas!.x + 100, canvas!.y + 70);
  await page.mouse.down();
  await page.mouse.move(canvas!.x + 160, canvas!.y + 110, { steps: 6 });
  await page.mouse.up();
  await expect(page.getByLabel('가로 위치', { exact: true })).not.toHaveValue('80');
  await page.getByRole('button', { name: '실행 취소', exact: true }).click();
  await expect(page.getByLabel('가로 위치', { exact: true })).toHaveValue('80');
  await page.getByRole('button', { name: '다시 실행', exact: true }).click();
  await expect(page.getByLabel('가로 위치', { exact: true })).not.toHaveValue('80');
  async function editOnCanvas() {
    await page.locator('.konvajs-content').scrollIntoViewIfNeeded();
    const bounds = (await page.locator('.konvajs-content').boundingBox())!;
    const x = Number(await page.getByLabel('가로 위치', { exact: true }).inputValue());
    const y = Number(await page.getByLabel('세로 위치', { exact: true }).inputValue());
    await page.mouse.dblclick(bounds.x + x * 0.65 + 20, bounds.y + y * 0.65 + 15);
    return page.getByLabel('캔버스 텍스트 편집', { exact: true });
  }
  const overlay = await editOnCanvas();
  await overlay.dispatchEvent('compositionstart');
  await overlay.fill('한글 조합과 자료 연출 · 직접 편집');
  await overlay.dispatchEvent('keydown', { key: 'Enter', code: 'Enter', isComposing: true });
  await expect(overlay).toBeVisible();
  await overlay.dispatchEvent('compositionend', { data: '편집' });
  await overlay.press('Enter');
  await expect(page.getByLabel('내용', { exact: true })).toHaveValue('한글 조합과 자료 연출 · 직접 편집');
  await (await editOnCanvas()).fill('취소할 내용');
  await page.getByLabel('캔버스 텍스트 편집', { exact: true }).press('Escape');
  await expect(page.getByLabel('내용', { exact: true })).toHaveValue('한글 조합과 자료 연출 · 직접 편집');
  await (await editOnCanvas()).fill('한글 조합과 자료 연출');
  await page.getByLabel('보기 배율', { exact: true }).click();
  await expect(page.getByLabel('내용', { exact: true })).toHaveValue('한글 조합과 자료 연출');
  await page.getByLabel('보기 배율', { exact: true }).selectOption('0');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: resolve('../.tools/studio-v2-backend-verification/studio-desktop.png'), fullPage: true });
  await expect(page.getByRole('status')).toContainText('저장됨');
  await page.reload();
  await page.getByRole('tab', { name: '장면·자료', exact: true }).click();
  await selectLayer(page, '한글 조합과 자료 연출');
  await expect(page.getByLabel('내용', { exact: true })).toHaveValue('한글 조합과 자료 연출');
  await page.getByRole('tab', { name: '자산', exact: true }).click();
  await page.getByLabel('자산 업로드').setInputFiles({
    name: '작가이미지.png',
    mimeType: 'image/png',
    buffer: await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 10, height: 10 } })
  });
  await expect(page.locator('strong').filter({ hasText: /^작가이미지\.png$/ })).toBeVisible();
  const second = await context.newPage();
  await second.goto(`/studio/${id}`);
  await second.getByRole('tab', { name: '기본 정보', exact: true }).click();
  await expect(second.getByLabel('title 제목')).toBeVisible();
  await page.getByRole('tab', { name: '기본 정보', exact: true }).click();
  await page.getByLabel('title 제목').fill('먼저 저장한 제목');
  await expect(page.getByRole('status')).toContainText('저장됨');
  await second.getByLabel('title 제목').fill('충돌한 로컬 제목');
  await expect(second.getByRole('heading', { name: '다른 화면에서 저장한 변경이 있습니다' })).toBeVisible();
  await expect(second.getByLabel('title 제목')).toHaveValue('충돌한 로컬 제목');
  await second.reload();
  await second.getByRole('tab', { name: '기본 정보', exact: true }).click();
  await expect(second.getByRole('button', { name: '편집 사본 복구', exact: true })).toBeVisible();
  await second.getByRole('button', { name: '편집 사본 복구', exact: true }).click();
  await expect(second.getByLabel('title 제목')).toHaveValue('충돌한 로컬 제목');
  await second.close();
  const latest = await read<{ revision: number; document: Record<string, unknown> }>(context.request, `/author/works/${id}`);
  await mutate(context.request, `/author/works/${id}`, { revision: latest.revision, document: { ...latest.document, title: '다른 탭에서 추가 저장' } }, 'PUT');
  await page.getByRole('tab', { name: '테스트', exact: true }).click();
  const freezing = page.waitForResponse((response) => response.url().endsWith(`/author/works/${id}/freeze`));
  await page.getByRole('button', { name: '혼자 역할을 바꾸며 테스트', exact: true }).click();
  expect((await freezing).status()).toBe(409);
  await expect(page).toHaveURL(new RegExp(`/studio/${id}$`));
});

test('요트 샌드박스는 서버 점수로 기록하고 자리 전환·새로고침·초기화를 지원한다', async ({ page, context }) => {
  await register(context);
  await createSandbox(page, context, 'YACHT');
  await expect(page).toHaveURL(/\/studio\/sandboxes\//);
  await page.getByRole('button', { name: '주사위 굴리기 (3회 남음)', exact: true }).click();
  await expect(page.getByRole('button', { name: /점 기록/ }).first()).toBeVisible();
  await page
    .getByRole('button', { name: /점 기록/ })
    .first()
    .click();
  await expect(page.getByRole('heading', { name: '2번 자리의 차례', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: '2번 자리의 차례', exact: true })).toBeVisible();
  await page.getByLabel('현재 자리').selectOption('1');
  await page.getByRole('button', { name: '주사위 굴리기 (3회 남음)', exact: true }).click();
  await expect(page.getByRole('button', { name: '주사위 굴리기 (2회 남음)', exact: true })).toBeEnabled();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('tab', { name: '내 점수 기록', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: '전체 점수판', exact: true }).click();
  await expect(page.getByRole('table')).toBeVisible();
  await page.getByRole('tab', { name: '내 점수 기록', exact: true }).click();
  await expect(page.getByRole('table')).not.toBeVisible();
  await expect(page.getByRole('button', { name: /점 기록/ }).first()).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: resolve('../.tools/studio-v2-backend-verification/board-mobile.png'), fullPage: true });
  await page.getByRole('button', { name: '처음부터 다시', exact: true }).click();
  await expect(page.getByRole('heading', { name: '1번 자리의 차례', exact: true })).toBeVisible();
});

test('자유 테이블 손패는 자리별로 분리하고 화면에서 뽑기·전달을 처리한다', async ({ page, context }) => {
  await register(context);
  const sandboxId = await createSandbox(page, context, 'TABLETOP');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const dice = page.getByRole('button', { name: '주사위', exact: true });
  await dice.click();
  const first = await dice.boundingBox();
  await page.mouse.move(first!.x + first!.width / 2, first!.y + first!.height / 2);
  await page.mouse.down();
  await page.mouse.move(first!.x + first!.width / 2 + 35, first!.y + first!.height / 2 + 20, { steps: 5 });
  expect((await dice.boundingBox())!.x).toBeGreaterThan(first!.x + 20);
  await page.mouse.up();
  await page.getByRole('button', { name: '위치 지정', exact: true }).click();
  const surface = page.getByTestId('tabletop-surface');
  const bounds = await surface.boundingBox();
  await surface.tap({ position: { x: bounds!.width * 0.8, y: bounds!.height * 0.4 } });
  await expect
    .poll(async () => {
      const data = await read<{ state: { objects: { id: string; x: number }[] } }>(context.request, `/author/sandboxes/${sandboxId}?seat=0`);
      return data.state.objects.find((o) => o.id === 'dice-1')!.x;
    })
    .toBeGreaterThan(600);
  await page.getByRole('tab', { name: '구성물·덱', exact: true }).click();
  await page.getByRole('button', { name: '내 손으로 뽑기', exact: true }).click();
  await page.getByRole('tab', { name: /^내 손패 / }).click();
  await expect(page.getByText('1번 손패: 1장', { exact: true })).toBeVisible();
  const own = page.getByRole('button', { name: /첫 카드|두 번째 카드/ });
  await expect(own).toHaveCount(1);
  const cardName = await own.getAttribute('aria-label');
  await page.getByLabel('현재 자리').selectOption('1');
  await page.getByRole('tab', { name: /^내 손패 / }).click();
  await expect(page.getByRole('button', { name: cardName!, exact: true })).toHaveCount(0);
  await page.getByLabel('현재 자리').selectOption('0');
  await page.getByRole('tab', { name: /^내 손패 / }).click();
  await page.getByRole('button', { name: cardName!, exact: true }).click();
  await page.getByLabel('전달할 자리').selectOption('1');
  await page.getByRole('button', { name: '전달', exact: true }).click();
  await page.getByRole('tab', { name: /^내 손패 / }).click();
  await expect(page.getByText('2번 손패: 1장', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: cardName!, exact: true })).toHaveCount(0);
});

test('검수 승인 작품을 두 사용자가 투표 없이 자동 매칭하고 요트를 진행한다', async ({ browser }) => {
  const author = await browser.newContext(),
    other = await browser.newContext(),
    admin = await browser.newContext();
  try {
    await register(author);
    await register(other);
    await mutate(admin.request, '/auth/login', { email: 'admin@example.test', password: 'MangoDev!2026' });
    const work = await mutate<{ id: string }>(author.request, '/author/works', { title: '매칭 검증 요트', gameType: 'YACHT' });
    const document = await read<{ revision: number; scenarioId: string }>(author.request, `/author/works/${work.id}`);
    const submission = await mutate<{ versionId: string; reviewId: string }>(author.request, `/author/works/${work.id}/submit`, { revision: document.revision });
    const review = await admin.newPage();
    await review.goto(`/admin/reviews/${submission.reviewId}`);
    await review.getByRole('button', { name: '승인하고 공개', exact: true }).click();
    await expect(review.getByText('승인하고 공개했습니다.', { exact: true })).toBeVisible();
    const a = await author.newPage(),
      b = await other.newPage();
    for (const p of [a, b]) {
      await p.goto(`/match?gameType=YACHT&scenario=${document.scenarioId}`);
      await p.getByRole('button', { name: '매칭 시작', exact: true }).click();
    }
    for (const p of [a, b]) {
      await expect(p.getByRole('button', { name: '참가 수락', exact: true })).toBeVisible();
      await p.getByRole('button', { name: '참가 수락', exact: true }).click();
    }
    for (const p of [a, b]) {
      await expect(p).toHaveURL(/\/rooms\//);
      await p.getByRole('button', { name: '준비 완료', exact: true }).click();
    }
    await a.getByRole('button', { name: '게임 시작', exact: true }).click();
    for (const p of [a, b]) await expect(p).toHaveURL(/\/games\//);
    const gameId = new URL(a.url()).pathname.split('/').pop()!;
    const players = await Promise.all(
      [a, b].map(async (page) => ({
        page,
        snapshot: await read<{ mySeat: number; state: { turnSeat: number } }>(page.request, `/games/${gameId}/board-snapshot`)
      }))
    );
    expect(new Set(players.map(({ snapshot }) => snapshot.mySeat)).size).toBe(2);
    expect(players[0].snapshot.state.turnSeat).toBe(players[1].snapshot.state.turnSeat);
    const current = players.find(({ snapshot }) => snapshot.mySeat === snapshot.state.turnSeat)!;
    const waiting = players.find(({ snapshot }) => snapshot.mySeat !== snapshot.state.turnSeat)!;
    expect(current).toBeDefined();
    expect(waiting).toBeDefined();
    await expect(waiting.page.getByRole('button', { name: '주사위 굴리기 (3회 남음)', exact: true })).toBeDisabled();
    await current.page.getByRole('button', { name: '주사위 굴리기 (3회 남음)', exact: true }).click();
    await expect(current.page.getByRole('button', { name: /점 기록/ }).first()).toBeVisible();
    await expect(waiting.page.getByRole('button', { name: /점 기록/ })).toHaveCount(0);
  } finally {
    await Promise.all([author.close(), other.close(), admin.close()]);
  }
});

for (const [gameType, name] of [
  ['GOMOKU', '자유 오목'],
  ['REVERSI', '리버시'],
  ['CHECKERS', '체커']
] as const) {
  test(`${name}은 모바일에서 서버가 허용한 수를 두고 자리를 바꾸어 이어서 진행한다`, async ({ page, context }) => {
    await register(context);
    const sandboxId = await createSandbox(page, context, gameType, '#523b80');
    await expect(page).toHaveURL(/\/studio\/sandboxes\//);
    await page.setViewportSize({ width: 390, height: 844 });
    type Snapshot = {
      stateVersion: number;
      state: { board: number[][]; turnSeat: number; legalMoves: { row: number; col: number; fromRow?: number; fromCol?: number }[]; appearance: { firstPieceColor: string } };
    };
    const before = await read<Snapshot>(context.request, `/author/sandboxes/${sandboxId}?seat=0`);
    expect(before.state.appearance.firstPieceColor).toBe('#523b80');
    const board = page.getByRole('group', { name: `${name} 게임판`, exact: true });
    await page.getByRole('button', { name: '크게 보기', exact: true }).click();
    await expect(page.getByRole('button', { name: '크게 보기', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(async () => (await board.locator('button').first().boundingBox())!.width).toBeGreaterThanOrEqual(44);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const move = before.state.legalMoves[0];
    expect(move).toBeDefined();
    if (move.fromRow !== undefined) await board.getByRole('button', { name: new RegExp(`^${move.fromRow + 1}행 ${move.fromCol! + 1}열,`) }).tap();
    await board.getByRole('button', { name: new RegExp(`^${move.row + 1}행 ${move.col + 1}열,`) }).tap();
    await expect(page.getByRole('heading', { name: '2번 자리의 차례', exact: true })).toBeVisible();
    const after = await read<Snapshot>(context.request, `/author/sandboxes/${sandboxId}?seat=0`);
    expect(after.stateVersion).toBeGreaterThan(before.stateVersion);
    expect(after.state.board[move.row][move.col]).toBe(1);
    expect(after.state.legalMoves).toHaveLength(0);
    await expect(board.locator('button:enabled')).toHaveCount(0);
    await page.getByLabel('현재 자리').selectOption('1');
    await expect.poll(() => board.locator('button:enabled').count()).toBeGreaterThan(0);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    if (gameType === 'CHECKERS') await page.screenshot({ path: resolve('../.tools/studio-v2-backend-verification/checkers-mobile.png'), fullPage: true });
    await page.getByRole('button', { name: '처음부터 다시', exact: true }).click();
    await expect(page.getByRole('heading', { name: '1번 자리의 차례', exact: true })).toBeVisible();
  });
}
