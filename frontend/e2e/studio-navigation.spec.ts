import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { test, expect, type APIRequestContext, type Locator, type Page } from '@playwright/test';
import type { Work } from '../src/studio/types';
const base = process.env.E2E_BASE_URL || 'http://127.0.0.1:5173';
test.use({viewport:{width:1440,height:1000}, actionTimeout:15000});
async function read<T>(request: APIRequestContext, path: string): Promise<T> {
  const response = await request.get(`${base}/api/v1${path}`); expect(response.ok()).toBeTruthy(); return response.json();
}
async function post<T>(request: APIRequestContext, path: string, data: unknown): Promise<T> {
  const csrf = await read<{headerName:string;token:string}>(request,'/auth/csrf');
  const response = await request.post(`${base}/api/v1${path}`,{data,headers:{[csrf.headerName]:csrf.token,'Idempotency-Key':randomUUID()}});
  expect(response.ok(),await response.text()).toBeTruthy(); return response.json();
}
async function setup(page: Page, request: APIRequestContext) {
  await post(request,'/auth/register',{email:`nav-${randomUUID()}@example.test`,password:'MangoDev!2026',displayName:'편집 동선 검증'});
  const work = await post<{id:string}>(request,'/author/works',{title:'내가 만든 이야기 카드',gameType:'TABLETOP'});
  await page.goto(`/studio/${work.id}`);
  await expect(page.getByRole('tab',{name:'테이블 배치',exact:true})).toHaveAttribute('aria-selected','true');
  await page.getByRole('button',{name:'카드 추가',exact:true}).click();
  await page.getByLabel(/tabletop\.objects\.\d+\.name 이름/).fill('돌아올 카드');
  await page.getByRole('button',{name:'카드 앞·뒷면 디자인',exact:true}).click();
  return work.id;
}
async function saved(page: Page) {
  await page.getByRole('button',{name:'저장',exact:true}).click();
  await expect(page.getByRole('status').filter({hasText:'개정'})).toContainText('저장됨');
}
async function layer(page: Page, label: string) {
  await page.getByRole('button',{name:'레이어',exact:true}).click();
  await page.getByRole('region',{name:'레이어 목록',exact:true}).getByRole('button',{name:label,exact:true}).click();
  await page.getByRole('button',{name:'레이어 닫기',exact:true}).click();
}
function workspace(page: Page) {
  return page.locator('[data-pane]:visible');
}
async function properties(page: Page, width: number) {
  if(width<=800) await workspace(page).getByRole('button',{name:'속성',exact:true}).click();
  else if(width<1200) await workspace(page).getByRole('button',{name:'속성 패널',exact:true}).click();
}
async function withinScreen(locator: Locator, width: number) {
  await expect(locator).toBeVisible();
  const box=await locator.boundingBox();
  expect(box!.width).toBeGreaterThan(0);
  expect(box!.x).toBeGreaterThanOrEqual(-1);
  expect(box!.x+box!.width).toBeLessThanOrEqual(width+1);
}
async function panelLayout(page: Page, width: number) {
  const area=workspace(page),left=area.locator('[data-workspace-pane="left"]'),center=area.getByRole('region',{name:'편집 작업 화면',exact:true}),right=area.locator('[data-workspace-pane="right"]');
  await withinScreen(right,width);
  if(width<=800) {
    await expect(left).not.toBeVisible();
    await expect(center).not.toBeVisible();
    return;
  }
  await withinScreen(center,width);
  const middle=await center.boundingBox(),inspector=await right.boundingBox();
  expect(middle!.x+middle!.width).toBeLessThanOrEqual(inspector!.x+1);
  if(width>=1200) {
    await withinScreen(left,width);
    const library=await left.boundingBox();
    expect(library!.x+library!.width).toBeLessThanOrEqual(middle!.x+1);
  } else await expect(left).not.toBeVisible();
}
test('카드 면·도구·배율·복귀는 초안을 바꾸지 않고 방향키와 한글 입력은 안전하게 동작한다',async({page,context})=>{
  const id=await setup(page,context.request);
  await page.getByRole('group',{name:'카드 면 전환'}).getByRole('button',{name:'뒷면',exact:true}).click();
  await page.getByRole('button',{name:'텍스트 추가',exact:true}).click();
  const content=page.getByRole('textbox',{name:'내용',exact:true});
  await content.fill('한글 카드 뒷면');
  await saved(page);
  const original=await read<Work>(context.request,`/author/works/${id}`);
  const zoom=page.getByRole('combobox',{name:'보기 배율',exact:true});
  await zoom.selectOption('0.5');
  for(const tool of ['텍스트','요소','배경']) {
    await page.getByRole('tab',{name:tool,exact:true}).click();
    await expect(page.getByRole('group',{name:'카드 면 전환'}).getByRole('button',{name:'뒷면',exact:true})).toHaveAttribute('aria-pressed','true');
    await expect(zoom).toHaveValue('0.5');
  }
  expect((await read<Work>(context.request,`/author/works/${id}`)).revision).toBe(original.revision);
  await layer(page,'한글 카드 뒷면');
  const canvas=page.getByRole('group',{name:'캔버스 배치: 방향키 1픽셀, Shift 방향키 10픽셀 이동'});
  await canvas.press('ArrowRight'); await canvas.press('Shift+ArrowDown');
  await expect(page.getByRole('spinbutton',{name:'가로 위치',exact:true})).toHaveValue('41');
  await expect(page.getByRole('spinbutton',{name:'세로 위치',exact:true})).toHaveValue('50');
  await content.press('ArrowLeft');
  await expect(page.getByRole('spinbutton',{name:'가로 위치',exact:true})).toHaveValue('41');
  await canvas.dispatchEvent('keydown',{key:'ArrowRight',isComposing:true,keyCode:229});
  await expect(page.getByRole('spinbutton',{name:'가로 위치',exact:true})).toHaveValue('41');
  await content.dispatchEvent('keydown',{key:'Escape',isComposing:true,keyCode:229});
  await expect(content).toBeVisible();
  await expect(content).toHaveValue('한글 카드 뒷면');
  await page.getByRole('button',{name:'실행 취소',exact:true}).click();
  await expect(page.getByRole('spinbutton',{name:'세로 위치',exact:true})).toHaveValue('40');
  await page.getByRole('checkbox',{name:'10px 격자 맞춤',exact:true}).check();
  await saved(page);
  await page.getByRole('button',{name:'← 게임판으로',exact:true}).click();
  await expect(page.getByLabel(/tabletop\.objects\.\d+\.name 이름/)).toHaveValue('돌아올 카드');
  await page.getByRole('button',{name:'카드 앞·뒷면 디자인',exact:true}).click();
  await page.getByRole('group',{name:'카드 면 전환'}).getByRole('button',{name:'뒷면',exact:true}).click();
  await page.reload();
  await expect(page.getByRole('group',{name:'카드 면 전환'}).getByRole('button',{name:'뒷면',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(zoom).toHaveValue('0.5');
  await expect(page.getByRole('checkbox',{name:'10px 격자 맞춤',exact:true})).toBeChecked();
});
test('세 작업 패널은 독립적으로 스크롤되고 중간 폭에서 구성·속성을 바꿔도 목록 위치가 유지된다',async({page,context})=>{
  await page.setViewportSize({width:1440,height:740});
  await post(context.request,'/auth/register',{email:`scroll-${randomUUID()}@example.test`,password:'MangoDev!2026',displayName:'목록 위치 검증'});
  const created=await post<{id:string}>(context.request,'/author/works',{title:'긴 구성물 목록',templateId:'tabletop-blank'});
  const work=await read<Work>(context.request,`/author/works/${created.id}`);
  work.document.tabletop={objects:Array.from({length:80},(_,index)=>({id:`piece-${index}`,name:`위치 확인 ${index+1}`,kind:'TOKEN',text:'',assetId:null,x:40+(index%10)*80,y:40+Math.floor(index/10)*70,width:60,height:60,locked:false,faceUp:true})),decks:[]};
  const csrf=await read<{headerName:string;token:string}>(context.request,'/auth/csrf');
  const response=await context.request.put(`${base}/api/v1/author/works/${work.id}`,{data:{revision:work.revision,document:work.document},headers:{[csrf.headerName]:csrf.token,'Idempotency-Key':randomUUID()}});
  expect(response.ok(),await response.text()).toBeTruthy();
  await page.goto(`/studio/${work.id}`);
  const area=workspace(page),side=area.locator('[data-workspace-scroll="left"]'),inspector=area.locator('[data-workspace-scroll="right"]'),center=area.locator('[data-workspace-scroll="center"]');
  await expect(page.getByRole('button',{name:'말 · 위치 확인 80',exact:true})).toBeAttached();
  await side.evaluate(element=>{element.scrollTop=element.scrollHeight;});
  const before=await side.evaluate(element=>element.scrollTop);
  expect(before).toBeGreaterThan(2000);
  await page.getByRole('button',{name:'말 · 위치 확인 80',exact:true}).click();
  await expect(page.getByRole('heading',{name:'위치 확인 80',exact:true})).toBeVisible();
  await expect.poll(()=>side.evaluate(element=>element.scrollTop)).toBe(before);
  await expect.poll(()=>inspector.evaluate(element=>element.scrollHeight-element.clientHeight)).toBeGreaterThan(0);
  await inspector.evaluate(element=>{element.scrollTop=element.scrollHeight;});
  const rightPosition=await inspector.evaluate(element=>element.scrollTop);
  expect(rightPosition).toBeGreaterThan(0);
  await expect(page.getByRole('button',{name:'구성물 복제',exact:true})).toBeInViewport();
  expect(await side.evaluate(element=>element.scrollTop)).toBe(before);
  await area.getByRole('combobox',{name:'보기 배율',exact:true}).selectOption('1');
  await expect.poll(()=>center.evaluate(element=>element.scrollHeight-element.clientHeight)).toBeGreaterThan(0);
  await center.evaluate(element=>{element.scrollTop=element.scrollHeight;});
  expect(await center.evaluate(element=>element.scrollTop)).toBeGreaterThan(0);
  expect(await side.evaluate(element=>element.scrollTop)).toBe(before);
  expect(await inspector.evaluate(element=>element.scrollTop)).toBe(rightPosition);
  await page.setViewportSize({width:960,height:740});
  await area.getByRole('button',{name:'재료 목록',exact:true}).click();
  await side.evaluate(element=>{element.scrollTop=element.scrollHeight;});
  const mediumPosition=await side.evaluate(element=>element.scrollTop);
  await area.getByRole('button',{name:'속성 패널',exact:true}).click();
  await expect(page.getByRole('heading',{name:'위치 확인 80',exact:true})).toBeVisible();
  await area.getByRole('button',{name:'재료 목록',exact:true}).click();
  await expect.poll(()=>side.evaluate(element=>element.scrollTop)).toBe(mediumPosition);
  await area.getByRole('button',{name:'속성 패널',exact:true}).click();
  await page.getByRole('button',{name:/재료 목록으로/}).click();
  await expect.poll(()=>side.evaluate(element=>element.scrollTop)).toBe(mediumPosition);
  await expect(page.getByRole('button',{name:'말 · 위치 확인 80',exact:true})).toBeInViewport();
  const after=await read<Work>(context.request,`/author/works/${work.id}`);
  expect(after.revision).toBe(2);
  expect(after.document).toEqual(work.document);
});
test('열한 화면 폭의 패널 배치와 낮은 화면의 조작은 선택·카드 면·편집 문구를 보존한다',async({page,context})=>{
  const id=await setup(page,context.request); await layer(page,'새 카드 디자인');
  const content=page.getByRole('textbox',{name:'내용',exact:true});
  const initialText='화면 폭이 바뀌어도 같은 카드 문구';
  await content.fill('서버에 저장해 둔 기준 카드 문구');
  await page.getByRole('combobox',{name:'보기 배율',exact:true}).selectOption('0.5');
  await saved(page);
  const original=await read<Work>(context.request,`/author/works/${id}`);
  await content.fill(initialText);
  await mkdir('../.tools/studio-responsive-verification',{recursive:true});
  for(const width of [360,390,600,800,801,960,1199,1200,1280,1440,1680]) {
    await page.setViewportSize({width,height:width<=800?844:1000});
    await properties(page,width);
    await panelLayout(page,width);
    await expect(content).toHaveValue(initialText);
    await expect(page.getByRole('group',{name:'카드 면 전환'}).getByRole('button',{name:'앞면',exact:true})).toHaveAttribute('aria-pressed','true');
    await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth)).toBeLessThanOrEqual(1);
    await expect(page.getByRole('button',{name:'저장',exact:true})).toBeInViewport();
    if(width<=800) {
      await expect(page.getByRole('img',{name:'앞면 편집 미리보기'})).toBeVisible();
      expect(await content.evaluate(element=>getComputedStyle(element).fontSize)).toBe('16px');
      const controls=await page.locator('header button').evaluateAll(elements=>elements.filter(e=>e.getClientRects().length).map(e=>({w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height})));
      expect(controls.every(size=>size.w>=44&&size.h>=44)).toBe(true);
      await workspace(page).getByRole('button',{name:'구성',exact:true}).click();
      await expect(workspace(page).locator('[data-workspace-pane="left"]')).toBeVisible();
      await workspace(page).getByRole('button',{name:'작업 화면',exact:true}).click();
      const center=workspace(page).getByRole('region',{name:'편집 작업 화면',exact:true});
      await expect(center).toBeVisible();
      await center.getByText('600 × 850',{exact:true}).click();
      await expect(center).toBeVisible();
      await expect(workspace(page).getByRole('button',{name:'작업 화면',exact:true})).toHaveAttribute('aria-pressed','true');
      await properties(page,width);
      await expect(content).toHaveValue(initialText);
    } else {
      await expect(page.getByRole('combobox',{name:'보기 배율',exact:true})).toHaveValue('0.5');
      if(width<1200) {
        await workspace(page).getByRole('button',{name:'재료 목록',exact:true}).click();
        await withinScreen(workspace(page).locator('[data-workspace-pane="left"]'),width);
        await expect(content).not.toBeVisible();
        await properties(page,width);
        await expect(content).toHaveValue(initialText);
      }
    }
    await page.screenshot({path:`../.tools/studio-responsive-verification/editor-${width}.png`,fullPage:true});
  }
  await saved(page);
  const expectedDocument=structuredClone(original.document);
  expectedDocument.presentation.cardLayouts![0].front.nodes[0].text=initialText;
  const resized=await read<Work>(context.request,`/author/works/${id}`);
  expect(resized.document).toEqual(expectedDocument);
  expect(resized.revision).toBe(original.revision+1);
  for(const [width,height] of [[1280,600],[960,600],[390,568]]) {
    await page.setViewportSize({width,height});
    await properties(page,width);
    const text=`낮은 화면에서도 수정한 문구 ${width}`;
    await content.fill(text);
    await expect(page.getByRole('button',{name:'저장',exact:true})).toBeInViewport();
    await saved(page);
    await layer(page,text);
    const right=workspace(page).locator('[data-workspace-scroll="right"]');
    await right.evaluate(element=>{element.scrollTop=element.scrollHeight;});
    const remove=right.getByRole('button',{name:'삭제',exact:true});
    if(width<=800) await remove.scrollIntoViewIfNeeded();
    await expect(remove).toBeInViewport();
    await page.screenshot({path:`../.tools/studio-responsive-verification/editor-${width}x${height}.png`,fullPage:true});
    await page.getByRole('group',{name:'카드 면 전환'}).getByRole('button',{name:'뒷면',exact:true}).click();
    await page.getByRole('group',{name:'카드 면 전환'}).getByRole('button',{name:'앞면',exact:true}).click();
    await properties(page,width);
    await expect(content).toHaveValue(text);
    await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth)).toBeLessThanOrEqual(1);
    const stored=await read<Work>(context.request,`/author/works/${id}`);
    expect(stored.document.presentation.cardLayouts?.[0].front.nodes[0].text).toBe(text);
  }
});
