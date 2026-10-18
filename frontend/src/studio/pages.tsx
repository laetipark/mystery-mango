import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorNotice, QueryState } from '~/components/ui';
import { useCommand } from '~/hooks/use-command';
import { get, getCsrf, http, errorMessage } from '~/services/api';
import { createInviteToken, rememberCreatedInvite } from '~/services/invites';
import { AuthorFormContext, Field, RulesForm } from './forms';
import { SceneEditor, SceneCanvas } from './canvas';
import { useDraft } from './use-draft';
import { assetUrl, gameTypeNames, isClassic, type Asset, type Work, type StarterTemplate, type GameType, type Issue, type Value } from './types';
import s from './studio.module.scss';
import h from './studio-home.module.scss';
import { TableEditor } from './table-editor';
import { MysteryEditor } from './mystery-editor';
import { CardLayoutEditor, newCardLayout } from './card-editor';
import { CardFace } from './card-face';
import { DesignPreview } from './design-preview';
import { EditorIcon, type EditorIconName } from './editor-chrome';
import { WorkspaceToolsContext, WorkspaceGlyph, WorkspacePanels } from './workspace';
import { TemplateLibrary } from './template-library';
import chrome from './editor-chrome.module.scss';
import detail from './editor-details.module.scss';
import { EditorMemory, useEditorState } from './editor-memory';
import { VersionHistory, type FrozenVersion } from './version-history';
const EmbeddedSandbox = lazy(() => import('./runtime').then((module) => ({ default: module.SandboxWorkspace })));
function TemplatePreview({ gameType }: { gameType: GameType }) {
  const dark = '#264d3e',
    cream = '#fcf4df',
    mango = '#efb64d';
  return (
    <svg viewBox="0 0 360 192" className={h.templatePreview} aria-hidden="true">
      <rect width="360" height="192" fill={gameType === 'MURDER_MYSTERY' ? '#eee7d9' : gameType === 'YACHT' ? '#f4e8c9' : '#e7ebdf'} />
      {gameType === 'MURDER_MYSTERY' ? (
        <>
          <g transform="translate(72 30) rotate(-8 72 65)">
            <rect width="124" height="142" rx="8" fill={dark} />
            <rect x="15" y="16" width="94" height="65" rx="3" fill="#466955" />
            <circle cx="62" cy="45" r="16" fill="#b6c9a4" />
            <path d="M34 79 Q62 48 90 79" fill="#b6c9a4" />
            <path d="M17 100H96M17 111H87M17 122H65" stroke={cream} strokeWidth="4" opacity=".75" />
          </g>
          <g transform="translate(188 43) rotate(8 52 53)">
            <rect width="92" height="116" rx="6" fill={cream} />
            <path d="M17 22H72M17 34H60M17 75H72M17 86H60" stroke="#b5af94" strokeWidth="4" />
            <circle cx="46" cy="55" r="17" fill={mango} />
            <path d="M40 54l5 5 10-13" fill="none" stroke={dark} strokeWidth="3" />
          </g>
        </>
      ) : gameType === 'TABLETOP' ? (
        <>
          <rect x="47" y="30" width="266" height="137" rx="45" fill={dark} />
          <rect x="58" y="40" width="244" height="116" rx="37" fill="none" stroke="#76917a" />
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(${92 + i * 23} ${51 + i * 5}) rotate(${i * 10 - 12} 25 37)`}>
              <rect width="50" height="74" rx="6" fill={cream} stroke="#ded5bf" />
              <path d="M25 22l12 15-12 15-12-15z" fill={i === 1 ? mango : dark} />
            </g>
          ))}
          <circle cx="230" cy="69" r="13" fill={mango} />
          <circle cx="256" cy="86" r="13" fill="#abc399" />
          <rect x="209" y="109" width="34" height="34" rx="7" fill={cream} />
          <circle cx="218" cy="118" r="3" fill={dark} />
          <circle cx="235" cy="134" r="3" fill={dark} />
          <circle cx="226" cy="126" r="3" fill={dark} />
        </>
      ) : gameType === 'YACHT' ? (
        <>
          <rect x="211" y="28" width="91" height="142" rx="8" fill={cream} />
          <path d="M226 48H286M226 69H286M226 90H286M226 111H286M226 132H286M269 42V151" stroke="#d4cdb8" strokeWidth="2" />
          <rect x="225" y="143" width="61" height="12" rx="3" fill={mango} />
          {[
            [69, 48, 1],
            [127, 39, 3],
            [60, 108, 4],
            [125, 103, 5]
          ].map(([x, y, n]) => (
            <g key={x + y} transform={`translate(${x} ${y}) rotate(${n === 1 ? -12 : 8} 23 23)`}>
              <rect width="49" height="49" rx="10" fill={n === 5 ? dark : cream} stroke="#d6d4c4" />
              {Array.from({ length: n }, (_, i) => (
                <circle key={i} cx={12 + (i % 2) * 24} cy={11 + Math.floor(i / 2) * 13} r="3.2" fill={n === 5 ? cream : dark} />
              ))}
            </g>
          ))}
        </>
      ) : (
        <>
          <g transform="translate(105 20)">
            <rect x="-9" y="-9" width="168" height="168" rx="8" fill={gameType === 'GOMOKU' ? '#b88e50' : dark} />
            {Array.from({ length: 64 }, (_, i) => (
              <rect key={i} x={(i % 8) * 19} y={Math.floor(i / 8) * 19} width="19" height="19" fill={gameType === 'GOMOKU' ? '#e7c792' : (i + Math.floor(i / 8)) % 2 ? '#718d6e' : '#efe8d2'} />
            ))}
            {gameType === 'GOMOKU' &&
              Array.from({ length: 8 }, (_, i) => (
                <g key={i} stroke="#a98c57" strokeWidth=".8">
                  <path d={`M9 ${9 + i * 19}H142`} />
                  <path d={`M${9 + i * 19} 9V142`} />
                </g>
              ))}
            {(gameType === 'GOMOKU'
              ? [
                  [3, 3, 1],
                  [4, 3, 0],
                  [4, 4, 1],
                  [5, 4, 0],
                  [5, 5, 1],
                  [3, 4, 0]
                ]
              : gameType === 'REVERSI'
                ? [
                    [3, 3, 1],
                    [4, 3, 0],
                    [3, 4, 0],
                    [4, 4, 1],
                    [2, 3, 0],
                    [5, 4, 1]
                  ]
                : [
                    [1, 1, 0],
                    [3, 1, 0],
                    [5, 1, 0],
                    [2, 2, 0],
                    [4, 4, 1],
                    [1, 5, 1],
                    [3, 5, 1],
                    [5, 5, 1]
                  ]
            ).map(([x, y, c], i) => (
              <g key={i}>
                <circle cx={x * 19 + 9.5} cy={y * 19 + 9.5} r="8" fill={c ? dark : cream} stroke="#7c806b" />
                {gameType === 'CHECKERS' && i === 4 && <circle cx={x * 19 + 9.5} cy={y * 19 + 9.5} r="4" fill="none" stroke={mango} />}
              </g>
            ))}
          </g>
        </>
      )}
    </svg>
  );
}
function BlankTemplatePreview() {
  return (
    <svg viewBox="0 0 360 192" className={h.templatePreview} aria-hidden="true">
      <rect width="360" height="192" fill="#f0ede4" />
      <rect x="96" y="24" width="168" height="144" rx="6" fill="#fffdf7" stroke="#c9cdbd" strokeWidth="1.5" />
      <path d="M112 40h13m-13 0v13M248 40h-13m13 0v13M112 152h13m-13 0v-13M248 152h-13m13 0v-13" fill="none" stroke="#b8c4ae" strokeWidth="1.5" />
      <circle cx="180" cy="96" r="23" fill="#f1c76e" />
      <path d="M170 96h20m-10-10v20" stroke="#264d3e" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
function CreateWorkDialog({
  template,
  title,
  setTitle,
  pending,
  error,
  create,
  close
}: {
  template: StarterTemplate;
  title: string;
  setTitle: (value: string) => void;
  pending: boolean;
  error: string;
  create: () => Promise<void>;
  close: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
    titleInput.current?.focus();
  }, []);
  return (
    <dialog ref={dialog} className={h.createDialog} onClose={close} aria-labelledby="create-work-title">
      <div className={h.dialogHeading}>
        <span className={h.eyebrow}>새 작품 시작하기</span>
        <button type="button" aria-label="작품 만들기 닫기" onClick={() => dialog.current?.close()}>
          ×
        </button>
      </div>
      <div className={h.dialogContent}>
        <aside className={h.dialogPreview}>
          {template.blank ? <BlankTemplatePreview /> : <TemplatePreview gameType={template.gameType} />}
          <div>
            <span className={h.templateTag}>{template.blank ? '빈 템플릿' : '기본 템플릿'}</span>
            <h3>{gameTypeNames[template.gameType]}</h3>
            <p>{template.description}</p>
          </div>
        </aside>
        <div className={h.dialogForm}>
          <h2 id="create-work-title">
            내 작품에
            <br />
            이름을 붙여 주세요
          </h2>
          <p>이름은 작업실에서 언제든 바꿀 수 있어요.</p>
          <form
            className={h.createTray}
            onSubmit={(event) => {
              event.preventDefault();
              void create();
            }}
          >
            <label>
              작품 제목
              <input ref={titleInput} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} placeholder="어떤 게임을 만들까요?" />
            </label>
            <ErrorNotice message={error} />
            <div className={h.dialogActions}>
              <button type="button" onClick={() => dialog.current?.close()}>
                취소
              </button>
              <button className={h.primaryAction} disabled={!title.trim() || pending}>
                {pending ? '만드는 중…' : '작품 만들기'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </dialog>
  );
}
export function StudioPage() {
  const query = useQuery({ queryKey: ['author-works'], queryFn: () => get<{ items: { id: string; title: string; gameType: GameType; revision: number; status: string }[] }>('/author/works') });
  const templates = useQuery({ queryKey: ['author-templates'], queryFn: () => get<{ items: StarterTemplate[] }>('/author/templates') });
  const [title, setTitle] = useState(''),
    [templateId, setTemplateId] = useState(''),
    [blank, setBlank] = useState(false);
  const selected = templates.data?.items.find((template) => template.id === templateId);
  const action = useCommand(),
    navigate = useNavigate();
  async function create() {
    if (!selected) return;
    const result = await action.run<{ id: string }>('POST', '/author/works', { title, gameType: selected.gameType, templateId: selected.id });
    if (result) navigate(`/studio/${result.id}`);
  }
  return (
    <div className={h.studioHome}>
      <header className={h.studioHero}>
        <div>
          <span className={h.eyebrow}>
            <span className={h.studioMark} aria-hidden="true" />
            나의 제작 공간
          </span>
          <h1>작품 스튜디오</h1>
          <p>
            작은 아이디어에서, 함께 즐기는 한 판까지.
            <br />
            기본 틀을 고르거나 빈 작업실에서 나만의 게임을 시작하세요.
          </p>
        </div>
        <Link className={h.heroLink} to="/scenarios">
          공개 게임 바로 플레이 <span aria-hidden="true">↗</span>
        </Link>
      </header>
      <section className={h.homeSection}>
        <div className={h.sectionHeading}>
          <div>
            <span className={h.eyebrow}>새 작품 시작하기</span>
            <h2>템플릿 보관함</h2>
          </div>
          <p>고르고, 만들고, 함께 플레이하세요.</p>
        </div>
        <div className={h.templateOptions}>
          <div className={h.startModes} role="group" aria-label="시작 방식">
            <button aria-pressed={!blank} onClick={() => setBlank(false)}>
              기본 템플릿
            </button>
            <button aria-pressed={blank} onClick={() => setBlank(true)}>
              빈 템플릿
            </button>
          </div>
          <p>{blank ? '예제 내용 없이 직접 채워 보세요. 자동 규칙 게임은 정해진 규칙을 유지합니다.' : '구성 예시가 준비된 틀에서 시작해 나만의 게임으로 바꿔 보세요.'}</p>
        </div>
        <QueryState query={templates}>
          {(data) => (
            <div className={h.templates}>
              {data.items
                .filter((template) => !!template.blank === blank)
                .map((template) => (
                  <article
                    data-testid={`${template.blank ? 'blank-template' : 'template'}-${template.gameType}`}
                    key={template.id}
                    className={`${h.templateCard} ${template.id === templateId ? h.templateSelected : ''}`}
                  >
                    <div className={h.previewWrap}>
                      {template.blank ? <BlankTemplatePreview /> : <TemplatePreview gameType={template.gameType} />}
                      <span className={h.previewBadge}>{template.blank ? '직접 구성' : '예제 포함'}</span>
                    </div>
                    <div className={h.templateBody}>
                      <div className={h.templateMeta}>
                        <span>{gameTypeNames[template.gameType]}</span>
                        <span>{template.playerCounts.join('·')}인</span>
                      </div>
                      <h3>{template.title}</h3>
                      <p className={h.templateDescription}>{template.description}</p>
                      <details className={h.templateDetails}>
                        <summary>규칙과 꾸미기 안내</summary>
                        <strong>수정할 수 있는 항목</strong>
                        <p>{template.customizable.join(' · ')}</p>
                        <strong>기본 규칙</strong>
                        <p>{template.rulesSummary}</p>
                      </details>
                      <button
                        className={h.templateAction}
                        aria-pressed={template.id === templateId}
                        onClick={() => {
                          setTemplateId(template.id);
                          setTitle(template.blank ? '' : `${template.title} · 내 작품`);
                        }}
                      >
                        {template.blank ? '빈 작품으로 시작하기' : '이 템플릿으로 만들기'} <span aria-hidden="true">→</span>
                      </button>
                    </div>
                  </article>
                ))}
            </div>
          )}
        </QueryState>
      </section>
      {selected && <CreateWorkDialog template={selected} title={title} setTitle={setTitle} pending={action.pending} error={action.error} create={create} close={() => setTemplateId('')} />}
      <section className={h.homeSection}>
        <div className={h.sectionHeading}>
          <div>
            <span className={h.eyebrow}>이어서 작업하기</span>
            <h2>내 작품</h2>
          </div>
          {query.data && <span className={h.workCount}>{query.data.items.length}개의 작업실</span>}
        </div>
        <QueryState query={query}>
          {(data) => (
            <div className={h.worksGrid}>
              {data.items.map((work) => (
                <Link className={h.workCard} key={work.id} to={`/studio/${work.id}`}>
                  <div className={h.workThumbnail}>
                    <TemplatePreview gameType={work.gameType} />
                  </div>
                  <div className={h.workInfo}>
                    <span className={h.eyebrow}>{gameTypeNames[work.gameType]}</span>
                    <h3>{work.title}</h3>
                    <div className={h.workMeta}>
                      <span className={h.status} data-status={work.status}>
                        {(
                          { DRAFT: '편집 중', PUBLISHED: '공개됨', APPROVED: '공개됨', PENDING: '검수 중', CHANGES_REQUESTED: '수정 요청', SUPERSEDED: '이전 검수', ARCHIVED: '보관됨' } as Record<
                            string,
                            string
                          >
                        )[work.status] ?? work.status}
                      </span>
                      <span>개정 {work.revision}</span>
                    </div>
                  </div>
                  <span className={h.workArrow} aria-hidden="true">
                    ↗
                  </span>
                </Link>
              ))}
              {!data.items.length && (
                <div className={h.emptyWorks}>
                  <span className={h.emptyMark} aria-hidden="true">
                    ＋
                  </span>
                  <h3>첫 번째 작품을 기다리는 작업실</h3>
                  <p>위에서 마음에 드는 템플릿을 골라 시작해 보세요.</p>
                </div>
              )}
            </div>
          )}
        </QueryState>
      </section>
    </div>
  );
}
export function StudioEditorPage() {
  const { id } = useParams();
  const query = useQuery({ queryKey: ['author-work', id], queryFn: () => get<Work>(`/author/works/${id}`), refetchOnWindowFocus: false });
  return <QueryState query={query}>{(work) => <EditorMemory key={work.id} workId={work.id}><WorkEditor work={work} /></EditorMemory>}</QueryState>;
}
function DesignDialog({
  document,
  tab,
  sceneId,
  layoutId,
  layoutSide,
  onClose
}: {
  document: Work['document'];
  tab: string;
  sceneId: string;
  layoutId: string;
  layoutSide: 'front' | 'back';
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  const scene = document.presentation.scenes.find((scene) => scene.id === sceneId) ?? document.presentation.scenes[0];
  const layout = document.presentation.cardLayouts?.find((layout) => layout.id === layoutId) ?? document.presentation.cardLayouts?.[0];
  return (
    <dialog ref={dialog} className={s.designDialog} onClose={onClose}>
      <div className={s.sectionHeading}>
        <h2>디자인 미리보기</h2>
        <button onClick={() => dialog.current?.close()}>미리보기 닫기</button>
      </div>
      <p>작성 중인 디자인입니다. 역할별 공개 범위와 게임 진행은 시험 플레이에서 확인하세요.</p>
      {tab === 'cards' && layout ? (
        <div className={s.cardPreview}>
          <CardFace design={{ width: layout.width, height: layout.height, ...layout[layoutSide] }} label={`${layout.name} ${layoutSide === 'front' ? '앞면' : '뒷면'}`} />
        </div>
      ) : tab === 'primary' && !['TABLETOP', 'MURDER_MYSTERY'].includes(document.gameType) ? (
        <DesignPreview document={document} />
      ) : scene ? (
        <SceneCanvas readonly scene={scene} />
      ) : (
        <p>장면·자료에서 디자인할 장면을 먼저 추가하세요.</p>
      )}
    </dialog>
  );
}
function WorkEditor({ work }: { work: Work }) {
  const draft = useDraft(work);
  const sandboxKey = `mango-author-sandbox:${work.id}`;
  const [restoredSandbox] = useState<{ id: string; capacity: number; version: number; label?: string; returnTab: string } | null>(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(sandboxKey) ?? 'null');
      return saved && typeof saved.id === 'string' && Number.isInteger(saved.capacity) && saved.capacity >= 1 && saved.capacity <= 4 && Number.isInteger(saved.version) ? saved : null;
    } catch {
      return null;
    }
  });
  const [savedTab, setSavedTab] = useEditorState('tab', 'primary');
  const allowedTabs = ['primary', 'canvas', 'cards', 'assets', 'rules', 'basics', 'publish'];
  const initialTab = allowedTabs.includes(savedTab) ? savedTab : 'primary';
  const returnTab = useRef(restoredSandbox?.returnTab ?? initialTab);
  const queryClient = useQueryClient();
  const [checked, setChecked] = useState<{serial:number; revision:number; truncated:boolean} | null>(null);
  const staleIssues = !!checked && (checked.serial !== draft.changeSerial || checked.revision !== draft.revision);
  const [sceneId, setSceneId] = useEditorState('scene', '');
  const [layoutId, setLayoutId] = useEditorState('layout', '');
  const [savedSide, setLayoutSide] = useEditorState('card-side', 'front');
  const layoutSide = savedSide === 'back' ? 'back' : 'front';
  const [layoutOrigin, setLayoutOrigin] = useEditorState('card-origin', '');
  const [tool, setTool] = useState<'templates' | 'elements' | 'text' | 'background' | 'materials'>('templates');
  const [toolActivation, setToolActivation] = useState(0);
  const [newTemplate, setNewTemplate] = useState<StarterTemplate>();
  const [newTitle, setNewTitle] = useState('');
  const templates = useQuery({ queryKey: ['author-templates'], queryFn: () => get<{ items: StarterTemplate[] }>('/author/templates') });
  const [tab, setTab] = useState(restoredSandbox ? 'test' : initialTab),
    [issues, setIssues] = useState<Issue[]>([]),
    [notice, setNotice] = useState(''),
    [preview, setPreview] = useState(false),
    [capacity, setCapacity] = useState(2),
    [mode, setMode] = useState('TEXT'),
    [sandboxId, setSandboxId] = useState(restoredSandbox?.id ?? ''),
    [sandboxCapacity, setSandboxCapacity] = useState(restoredSandbox?.capacity ?? 2),
    [sandboxLabel, setSandboxLabel] = useState(typeof restoredSandbox?.label === 'string' ? restoredSandbox.label : `개정 ${restoredSandbox?.version ?? 0}`);
  useEffect(() => {
    if (tab !== 'test') { returnTab.current = tab; setSavedTab(tab); }
  }, [tab, setSavedTab]);
  const assets = useQuery({ queryKey: ['author-assets'], queryFn: () => get<{ items: Asset[] }>('/author/assets') });
  const action = useCommand(),
    navigate = useNavigate();
  const document = draft.document,
    mm = document.gameType === 'MURDER_MYSTERY',
    tabletop = document.gameType === 'TABLETOP';
  const primaryName = mm ? '이야기 흐름' : tabletop ? '테이블 배치' : '게임 디자인';
  const chosenCapacity = mm ? Number(document.playerCount ?? 4) : document.supportedPlayerCounts?.includes(capacity) ? capacity : (document.supportedPlayerCounts?.[0] ?? 2);
  const modes = (document.modes ?? ['TEXT']) as string[],
    chosenMode = modes.includes(mode) ? mode : modes[0];
  const stage = tab === 'test' ? 'test' : ['publish', 'basics'].includes(tab) ? 'publish' : tab === 'rules' || (tab === 'primary' && mm) ? 'settings' : 'decorate';
  function originPath() {
    try {
      const target = JSON.parse(layoutOrigin);
      const table = document.tabletop;
      if (!table) return '';
      if (target.kind === 'object') { const index = table.objects.findIndex(item => item.id === target.id); return index < 0 ? '' : `tabletop.objects.${index}`; }
      const deckIndex = table.decks.findIndex(item => item.id === (target.deckId ?? target.id));
      if (deckIndex < 0) return '';
      if (target.kind === 'deck') return `tabletop.decks.${deckIndex}`;
      const cardIndex = table.decks[deckIndex].cards.findIndex(item => item.id === target.id);
      return cardIndex < 0 ? '' : `tabletop.decks.${deckIndex}.cards.${cardIndex}`;
    } catch { return ''; }
  }
  function openTool(next: typeof tool) {
    setTool(next);
    setToolActivation((value) => value + 1);
    if (tab !== 'cards' || next === 'templates' || next === 'materials') setTab('canvas');
  }
  async function createFromTemplate() {
    if (!newTemplate || !(await draft.save())) return;
    const result = await action.run<{ id: string }>('POST', '/author/works', { title: newTitle, gameType: newTemplate.gameType, templateId: newTemplate.id });
    if (result) navigate(`/studio/${result.id}`);
  }
  function editDocument(next: typeof document) {
    draft.patch((current) => ({ ...current, ...Object.fromEntries(Object.entries(next).filter(([key, value]) => value !== document[key])) }));
  }
  async function validate() {
    if (!(await draft.save())) return;
    const serial = draft.changeSerial;
    const result = await action.run<{ valid: boolean; issues: Issue[]; revision: number; truncated: boolean }>('POST', `/author/works/${work.id}/validate`, { revision: draft.savedRevision() });
    if (result) {
      setIssues(result.issues);
      setChecked({ serial, revision: result.revision, truncated: result.truncated });
      setNotice(result.valid ? '작품 검증을 통과했습니다.' : '안내된 항목을 확인해 주세요.');
    }
  }
  async function freeze() {
    if (!(await draft.save())) return;
    const revision = draft.savedRevision();
    const result = await action.run<{ versionId: string }>('POST', `/author/works/${work.id}/freeze`, { revision });
    if (result) void queryClient.invalidateQueries({queryKey:['author-work', work.id]});
    return result ? {...result, authorRevision: revision} : undefined;
  }
  async function sandbox() {
    const frozen = await freeze();
    if (!frozen) return;
    const result = await action.run<{ id: string }>('POST', '/author/sandboxes', { versionId: frozen.versionId, capacity: chosenCapacity });
    if (result) {
      setSandboxId(result.id);
      setSandboxCapacity(chosenCapacity);
      try {
        sessionStorage.setItem(sandboxKey, JSON.stringify({ id: result.id, capacity: chosenCapacity, version: frozen.authorRevision, returnTab: returnTab.current }));
      } catch {
        /* Storage availability does not block the test. */
      }
      setSandboxLabel(`개정 ${frozen.authorRevision}`);
      setTab('test');
    }
  }
  async function submit() {
    if (!(await draft.save())) return;
    if (await action.run('POST', `/author/works/${work.id}/submit`, { revision: draft.savedRevision() })) { setNotice('공개 검수를 요청했습니다.'); void queryClient.invalidateQueries({queryKey:['author-work', work.id]}); }
  }
  async function testRoom() {
    const frozen = await freeze();
    if (!frozen) return;
    const inviteToken = createInviteToken();
    const result = await action.run<{ roomId: string }>('POST', `/author/works/${work.id}/test-room`, { versionId: frozen.versionId, capacity: chosenCapacity, mode: chosenMode, inviteToken });
    if (result) {
      rememberCreatedInvite(result.roomId, inviteToken);
      navigate(`/rooms/${result.roomId}`);
    }
  }
  async function testVersion(version: FrozenVersion, count: number, chatMode: string, invited: boolean) {
    if (invited) {
      if (!(await draft.save())) return;
      const inviteToken = createInviteToken();
      const result = await action.run<{roomId:string}>('POST', `/author/works/${work.id}/test-room`, {versionId:version.versionId, capacity:count, mode:chatMode, inviteToken});
      if (result) { rememberCreatedInvite(result.roomId, inviteToken); navigate(`/rooms/${result.roomId}`); }
      return;
    }
    const result = await action.run<{id:string}>('POST', '/author/sandboxes', {versionId:version.versionId,capacity:count});
    if (!result) return;
    const label = `버전 ${version.version} · ${version.authorRevision == null ? '개정 기록 없음' : `개정 ${version.authorRevision}`}`;
    setSandboxId(result.id); setSandboxCapacity(count); setSandboxLabel(label);
    try { sessionStorage.setItem(sandboxKey, JSON.stringify({id:result.id,capacity:count,version:version.authorRevision ?? version.version,label,returnTab:returnTab.current})); } catch { /* In-memory test still works. */ }
    setTab('test');
  }
  useEffect(() => {
    function openReference(event: Event) {
      const path = (event as CustomEvent<string>).detail;
      if (typeof path !== 'string') return;
      setTab(path.startsWith('presentation.') ? 'canvas' : 'primary');
      if (path.startsWith('presentation.scenes.')) setSceneId(document.presentation.scenes[Number(path.split('.')[2])]?.id ?? '');
      window.setTimeout(() => window.dispatchEvent(new CustomEvent('studio-focus-field', {detail:path})), 50);
    }
    window.addEventListener('studio-open-reference', openReference);
    return () => window.removeEventListener('studio-open-reference', openReference);
  }, [document.presentation.scenes, setSceneId]);
  function openScene(id: string) {
    setSceneId(id);
    setTab('canvas');
  }
  function openLayout(id?: string, target?: { kind: 'object' | 'card' | 'deck'; id: string; deckId?: string }) {
    let chosen = document.presentation.cardLayouts?.find((layout) => layout.id === id);
    if (!chosen) {
      chosen = newCardLayout();
      const created = chosen;
      draft.patch((current) => {
        const table = current.tabletop ?? { objects: [], decks: [] };
        return {
          ...current,
          presentation: { ...current.presentation, cardLayouts: [...(current.presentation.cardLayouts ?? []), created] },
          ...(target
            ? {
                tabletop: {
                  ...table,
                  objects: table.objects.map((item) => (target.kind === 'object' && item.id === target.id ? { ...item, layoutId: created.id } : item)),
                  decks: table.decks.map((deck) =>
                    target.kind === 'deck' && deck.id === target.id
                      ? { ...deck, backLayoutId: created.id }
                      : target.kind === 'card' && deck.id === target.deckId
                        ? { ...deck, cards: deck.cards.map((card) => (card.id === target.id ? { ...card, layoutId: created.id } : card)) }
                        : deck
                  )
                }
              }
            : {})
        };
      });
    }
    if (target) setLayoutOrigin(JSON.stringify(target));
    setLayoutId(chosen.id);
    setLayoutSide(target?.kind === 'deck' ? 'back' : 'front');
    setTab('cards');
  }
  function reveal(issue: Issue) {
    const path = issue.path.replace(/\[(\d+)\]/g, '.$1');
    if (path.startsWith('presentation.cardLayouts')) {
      const index = Number(path.split('.')[2]);
      setLayoutId(document.presentation.cardLayouts?.[index]?.id ?? '');
      setLayoutSide(path.includes('.back') ? 'back' : 'front');
      setTab('cards');
    } else if (path.startsWith('presentation')) {
      const index = Number(path.split('.')[2]);
      setSceneId(document.presentation.scenes[index]?.id ?? '');
      setTab('canvas');
    } else setTab(/^(roles|phases|clues|targets|rules|endings|ballot|tabletop|yacht|classic)/.test(path) ? 'rules' : 'basics');
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('studio-focus-field', { detail: path }));
      window.setTimeout(() => {
        const elements = Array.from(window.document.querySelectorAll<HTMLElement>('[data-field-path]')).filter((element) => !element.closest('[hidden]'));
        const element = elements.find((node) => node.dataset.fieldPath === path) ?? elements.find((node) => path.startsWith(node.dataset.fieldPath ?? '!'));
        if (element) {
          let ancestor = element.parentElement;
          while (ancestor) {
            if (ancestor instanceof HTMLDetailsElement) ancestor.open = true;
            ancestor = ancestor.parentElement;
          }
          element.dispatchEvent(new Event('studio-reveal', { bubbles: true }));
          window.setTimeout(() => {
            element.scrollIntoView({ block: 'center', behavior: 'smooth' });
            element.querySelector<HTMLElement>('input,textarea,select,button')?.focus();
          }, 20);
        } else window.document.querySelector<HTMLElement>(`.${s.workArea}`)?.scrollIntoView({ block: 'start' });
      }, 20);
    }, 50);
  }
  return (
    <AuthorFormContext document={document} assets={assets.data?.items ?? []}>
      <div className={`${s.studio} ${s.authorWorkspace} ${chrome.workspace}`}>
        <header className={chrome.header}>
          <Link to="/studio" className={chrome.brand}>
            <span className={chrome.logo}>m</span>
            <span>
              MYSTERY MANGO<small>GAME MAKER STUDIO</small>
            </span>
          </Link>
          <nav className={chrome.topLinks} aria-label="스튜디오 메뉴">
            <Link to="/studio">내 작업</Link>
            <Link to="/scenarios">플레이</Link>
            <details className={chrome.fileMenu}>
              <summary>파일</summary>
              <div>
                <button onClick={draft.download}>편집 사본 내려받기</button>
                <Link to="/account">내 계정</Link>
              </div>
            </details>
          </nav>
          <h1 className={chrome.title} title={document.title}>
            {document.title}
          </h1>
          <span role="status" className={chrome.saveStatus} data-state={draft.conflict ? 'conflict' : draft.error ? 'error' : draft.saving ? 'saving' : draft.dirty ? 'dirty' : 'saved'}>
            {draft.conflict ? '저장 충돌' : draft.error ? '저장 실패' : draft.saving ? '저장 중…' : draft.dirty ? '변경됨 · 2초 후 저장' : '저장됨'} · 개정 {draft.revision}
          </span>
          <div className={chrome.actions}>
            <button className={chrome.history} aria-label="실행 취소" title="실행 취소" disabled={!draft.canUndo} onClick={draft.undo}>
              <EditorIcon name="undo" />
            </button>
            <button className={chrome.history} aria-label="다시 실행" title="다시 실행" disabled={!draft.canRedo} onClick={draft.redo}>
              <EditorIcon name="redo" />
            </button>
            <button className={chrome.save} aria-label="저장" title="저장" disabled={draft.saving || !!draft.conflict} onClick={() => void draft.save()}>
              <EditorIcon name="save" />
              <span>저장</span>
            </button>
            <button className={chrome.preview} onClick={() => setPreview(true)}>
              <EditorIcon name="preview" />
              미리보기
            </button>
            <button className={chrome.test} disabled={action.pending || !!draft.conflict} onClick={() => void sandbox()}>
              <EditorIcon name="play" />
              시험 플레이
            </button>
            <button className={chrome.publish} onClick={() => setTab('publish')}>
              공개 준비 <span aria-hidden="true">→</span>
            </button>
          </div>
        </header>
        <div className={chrome.stepBar}>
          <Link to="/studio" aria-label="← 내 작품" className={chrome.backLink}>
            <EditorIcon name="back" />내 작업
          </Link>
          <span className={chrome.kind}>{gameTypeNames[document.gameType]}</span>
          <nav role="tablist" aria-label="제작 단계" className={chrome.steps}>
            {(
              [
                ['decorate', '꾸미기', mm ? 'canvas' : 'primary'],
                ['settings', '게임 설정', mm ? 'primary' : 'rules'],
                ['test', '테스트', 'test'],
                ['publish', '공개 준비', 'publish']
              ] as const
            ).map(([key, name, target]) => (
              <button key={key} role="tab" aria-selected={stage === key} onClick={() => setTab(target)}>
                {name}
              </button>
            ))}
          </nav>
          <span className={chrome.stepHint}>내 작품 · 비공개 초안</span>
        </div>
        {newTemplate && (
          <CreateWorkDialog
            template={newTemplate}
            title={newTitle}
            setTitle={setNewTitle}
            pending={draft.saving || action.pending}
            error={draft.conflict ? '먼저 이 창을 닫고 현재 작품의 저장 충돌을 해결해 주세요. 편집 내용은 보존되어 있습니다.' : draft.error || action.error}
            create={createFromTemplate}
            close={() => setNewTemplate(undefined)}
          />
        )}
        {preview && <DesignDialog document={document} tab={tab} sceneId={sceneId} layoutId={layoutId} layoutSide={layoutSide} onClose={() => setPreview(false)} />}
        <ErrorNotice message={draft.error || action.error} />
        {draft.recovery && (
          <section className={s.error}>
            <h2>이 브라우저에 저장하지 못한 편집 사본이 있습니다</h2>
            <p>서버 문서와 비교해 복구하거나 현재 서버 문서를 유지할 수 있습니다.</p>
            <button onClick={draft.restoreRecovery}>편집 사본 복구</button>
            <button onClick={draft.discardRecovery}>서버 문서 유지</button>
          </section>
        )}
        {draft.conflict && (
          <section className={s.error}>
            <h2>다른 화면에서 저장한 변경이 있습니다</h2>
            <p>내 편집 내용은 현재 화면에 보존됩니다. 서버의 개정 {draft.conflict.revision}을 덮어쓰지 않았습니다. 복구 사본을 내려받은 뒤 최신 문서를 열고 필요한 변경을 다시 반영하세요.</p>
            <button onClick={draft.download}>내 편집 사본 내려받기</button>
            <button
              onClick={() => {
                draft.download();
                draft.loadServer();
              }}
            >
              사본을 보관하고 최신 문서 열기
            </button>
          </section>
        )}
        {notice && (
          <p role="status" className={s.notice}>
            {notice}
          </p>
        )}
        {checked && (
          <section className={detail.issuePanel} data-stale={staleIssues} aria-label="검증 결과">
            <header><h3>{staleIssues ? '이전 편집 내용의 검증 결과' : issues.length ? `확인할 항목 ${issues.length}개` : '구조 검증 통과'}</h3>
              <button disabled={action.pending || !!draft.conflict} onClick={() => void validate()}>다시 검증</button></header>
            {staleIssues && <p>검사 후 편집 내용이 바뀌었습니다. 정확한 위치로 이동하려면 다시 검증하세요.</p>}
            {checked.truncated && <p>최대 100개를 표시했습니다. 아래 항목을 수정하고 다시 검사하면 추가 오류를 확인할 수 있습니다.</p>}
            {Object.entries(issues.reduce<Record<string,Issue[]>>((groups, issue) => { const group = ({presentation:'디자인과 시각 자료',tabletop:'테이블 구성물',roles:'역할',clues:'단서',phases:'진행 단계',targets:'조사 장소',rules:'규칙',endings:'엔딩'} as Record<string,string>)[issue.path.split(/[.[]/)[0]] ?? '작품 설정'; (groups[group] ??= []).push(issue); return groups; }, {})).map(([group, entries]) =>
              <details key={group} open><summary>{group} · {entries?.length}개</summary><ul>{entries?.map((issue,index) => <li key={index}><button disabled={staleIssues} onClick={() => reveal(issue)}>{issue.message}<small>{issue.path} →</small></button></li>)}</ul></details>)}
          </section>
        )}
        <p className={`${s.mobileNotice} ${chrome.mobileHelp}`}>모바일에서는 배치 확인과 문구·색상·이미지 수정이 가능합니다. 정밀 편집은 넓은 화면에서 이용하세요.</p>
        <div className={chrome.body}>
          <nav className={chrome.rail} role="tablist" aria-label="제작 도구" aria-orientation="vertical">
            <button role="tab" aria-selected={tab === 'canvas' && tool === 'templates'} onClick={() => openTool('templates')} title="템플릿">
              <WorkspaceGlyph name="canvas" />
              <span>템플릿</span>
            </button>
            <button role="tab" aria-selected={tab === 'primary'} aria-label={primaryName} title={primaryName} onClick={() => setTab('primary')}>
              <EditorIcon name={mm ? 'rules' : 'board'} />
              <span>{mm ? '이야기' : '게임판'}</span>
            </button>
            <button role="tab" aria-selected={(tab === 'canvas' || tab === 'cards') && tool === 'elements'} onClick={() => openTool('elements')} title="요소">
              <WorkspaceGlyph name="layers" />
              <span>요소</span>
            </button>
            <button role="tab" aria-selected={(tab === 'canvas' || tab === 'cards') && tool === 'text'} onClick={() => openTool('text')} title="텍스트">
              <WorkspaceGlyph name="text" />
              <span>텍스트</span>
            </button>
            <button role="tab" aria-selected={(tab === 'canvas' || tab === 'cards') && tool === 'background'} onClick={() => openTool('background')} title="배경">
              <WorkspaceGlyph name="image" />
              <span>배경</span>
            </button>
            <button role="tab" aria-selected={(tab === 'canvas' || tab === 'cards') && tool === 'materials'} aria-label="장면·자료" onClick={() => openTool('materials')} title="장면·자료">
              <EditorIcon name="scene" />
              <span>자료</span>
            </button>
            {tabletop && (
              <button role="tab" aria-selected={tab === 'cards'} onClick={() => setTab('cards')} title="카드 디자인">
                <EditorIcon name="cards" />
                <span>카드 디자인</span>
              </button>
            )}
            <button role="tab" aria-selected={tab === 'assets'} aria-label="자산" onClick={() => setTab('assets')} title="이미지·음원 업로드">
              <EditorIcon name="assets" />
              <span>업로드</span>
            </button>
            <span className={chrome.railDivider} />
            {(
              [
                ['rules', '게임 규칙', 'rules'],
                ['basics', '기본 정보', 'info']
              ] as const
            ).map(([key, name, icon]) => (
              <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)} title={name}>
                <EditorIcon name={icon as EditorIconName} />
                <span>{name}</span>
              </button>
            ))}
          </nav>
          <div className={`${s.workArea} ${chrome.workArea}`}>
            <div hidden={tab !== 'primary'}>
              {mm ? (
                <MysteryEditor document={document} assets={assets.data?.items ?? []} patch={draft.patch} openScene={openScene} />
              ) : tabletop ? (
                <TableEditor document={document} assets={assets.data?.items ?? []} patch={draft.patch} openLayout={openLayout} />
              ) : (
                <WorkspacePanels
                  leftTitle="게임 디자인"
                  left={
                    <>
                      <span className={s.eyebrow}>색상과 표현</span>
                      <h2>게임판을 꾸며보세요</h2>
                      <p>게임 규칙은 그대로, 작품만의 색상을 입힙니다.</p>
                      {tab === 'primary' && <RulesForm document={document} assets={assets.data?.items ?? []} onChange={editDocument} />}
                    </>
                  }
                  center={
                    <div className={chrome.designStage}>
                      <DesignPreview document={document} />
                    </div>
                  }
                  right={<p>왼쪽에서 게임판의 색상을 선택하세요.</p>}
                />
              )}
            </div>
            <div hidden={tab !== 'canvas'}>
              <WorkspaceToolsContext.Provider
                value={
                  tab === 'canvas'
                    ? {
                        tool,
                        toolActivation,
                        library:
                          tool === 'templates' ? (
                            <TemplateLibrary
                              templates={templates.data?.items ?? []}
                              currentType={document.gameType}
                              loading={templates.isPending}
                              error={templates.isError}
                              onPick={(template) => {
                                setNewTemplate(template);
                                setNewTitle(template.title);
                              }}
                            />
                          ) : undefined,
                        onLibraryDismiss: () => setTool('materials')
                      }
                    : {}
                }
              >
                <SceneEditor
                  document={document}
                  sceneId={sceneId}
                  onSceneSelect={setSceneId}
                  scenes={document.presentation?.scenes ?? []}
                  assets={assets.data?.items ?? []}
                  onChange={(scenes) => draft.patch((current) => ({ ...current, presentation: { ...current.presentation, scenes } }))}
                />
              </WorkspaceToolsContext.Provider>
            </div>
            {tabletop && (
              <div hidden={tab !== 'cards'}>
                <WorkspaceToolsContext.Provider value={tab === 'cards' ? {tool, toolActivation} : {}}>
                  <CardLayoutEditor document={document} assets={assets.data?.items ?? []} selectedId={layoutId} side={layoutSide} onSelect={setLayoutId} onSide={setLayoutSide} patch={draft.patch} origin={originPath()} onReturn={() => {setTab('primary'); window.setTimeout(() => window.dispatchEvent(new CustomEvent('studio-focus-field', {detail:originPath() || 'tabletop'})), 50);}} />
                </WorkspaceToolsContext.Provider>
              </div>
            )}
            {tab === 'basics' && (
              <section className={`${s.panel} ${s.basicsPanel}`}>
                <div className={s.sectionHeading}>
                  <div>
                    <span className={s.eyebrow}>작품 정보</span>
                    <h2>플레이어에게 소개하세요</h2>
                  </div>
                  <span>{gameTypeNames[document.gameType]}</span>
                </div>
                {isClassic(document.gameType) && <p>이 게임은 2인 전용입니다.</p>}
                <div className={s.basicFields}>
                  {['title', 'synopsis', 'genre', 'difficulty', 'language', 'estimatedMinutes', ...(isClassic(document.gameType) ? [] : [mm ? 'playerCount' : 'supportedPlayerCounts']), 'modes'].map(
                    (key) => (
                      <Field key={key} name={key} value={document[key] as Value} onChange={(value) => draft.patch((current) => ({ ...current, [key]: value }))} />
                    )
                  )}
                </div>
              </section>
            )}
            {tab === 'rules' && (
              <section className={`${s.panel} ${s.rulesPanel}`}>
                <h2>게임 규칙과 연결</h2>
                <RulesForm document={document} assets={assets.data?.items ?? []} onChange={editDocument} />
              </section>
            )}
            <div hidden={tab !== 'assets'}>
              <AssetPanel assets={assets.data?.items ?? []} refresh={() => void assets.refetch()} />
            </div>
            <div hidden={tab !== 'test'}>
              <div className={chrome.testWorkspace}>
                <aside className={chrome.testSidebar}>
                  <h2>테스트하기</h2>
                  <p className={chrome.testCallout}>한 명이 여러 역할과 자리를 바꾸며 실제 규칙을 확인합니다.</p>
                  <p>시험은 저장한 버전으로 실행합니다. 이후 수정한 내용을 반영하려면 새 시험을 시작하세요.</p>
                  <button onClick={() => setPreview(true)}>
                    <EditorIcon name="preview" />
                    디자인 확인
                  </button>
                  <button onClick={() => setTab('publish')}>
                    <EditorIcon name="check" />
                    공개 준비로 이동
                  </button>
                  <p className={chrome.libraryTip}>역할별 자료 비교는 머더미스터리 시험에서 사용할 수 있습니다. 실제 참가자의 화면에는 역할 전환 도구가 표시되지 않습니다.</p>
                </aside>
                <div className={chrome.testMain}>
                  {sandboxId ? (
                    <Suspense fallback={<p>시험 화면을 준비하고 있습니다…</p>}>
                      <EmbeddedSandbox
                        id={sandboxId}
                        capacity={sandboxCapacity}
                        versionLabel={sandboxLabel}
                        onExit={() => {
                          setSandboxId('');
                          try {
                            sessionStorage.removeItem(sandboxKey);
                          } catch {
                            /* Storage can be unavailable. */
                          }
                          setTab(returnTab.current);
                        }}
                      />
                    </Suspense>
                  ) : (
                    <section className={`${s.panel} ${s.testPanel}`}>
                      <span className={s.eyebrow}>AUTHOR SANDBOX</span>
                      <h2>직접 플레이하며 확인하세요</h2>
                      <p>저장한 버전을 고정해 시험합니다. 편집한 내용은 새 시험을 시작할 때 반영됩니다.</p>
                      <div className={s.testSettings}>
                        <label>
                          테스트 인원
                          <select value={chosenCapacity} disabled={mm} onChange={(e) => setCapacity(Number(e.target.value))}>
                            {(mm ? [Number(document.playerCount ?? 4)] : (document.supportedPlayerCounts ?? [2])).map((n) => (
                              <option key={n} value={n}>
                                {n}명
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          테스트 방 대화 방식
                          <select value={chosenMode} onChange={(e) => setMode(e.target.value)}>
                            {modes.map((entry) => (
                              <option value={entry} key={entry}>
                                {entry === 'TEXT' ? '텍스트' : 'Discord'}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <div className={s.testChoices}>
                        <article>
                          <span>01</span>
                          <h3>혼자 시험하기</h3>
                          <p>자리를 바꾸며 게임과 개인 자료를 확인합니다. 정식 플레이 기록과 Discord에는 영향을 주지 않습니다.</p>
                          <button className={s.primaryAction} disabled={action.pending || !!draft.conflict} onClick={() => void sandbox()}>
                            혼자 역할을 바꾸며 테스트
                          </button>
                        </article>
                        <article>
                          <span>02</span>
                          <h3>친구와 시험하기</h3>
                          <p>초대받은 실제 참가자와 준비부터 종료까지 확인합니다. 공개 모집과 정식 전적에는 포함되지 않습니다.</p>
                          <button disabled={action.pending || !!draft.conflict} onClick={() => void testRoom()}>
                            초대 테스트 방 만들기
                          </button>
                        </article>
                      </div>
                    </section>
                  )}
                </div>
              </div>
            </div>
            {tab === 'publish' && (
              <section className={`${s.panel} ${chrome.releasePanel}`}>
                <span className={s.eyebrow}>READY TO SHARE</span>
                <h2>이야기를 세상에 선보이세요</h2>
                <p>작품 정보와 플레이를 확인한 뒤 공개 검수를 요청하세요. 승인된 버전만 플레이어에게 공개됩니다.</p>
                <div className={chrome.releaseGrid}>
                  <article>
                    <span>01</span>
                    <h3>작품 소개 확인</h3>
                    <p>{document.title}</p>
                    <small>
                      {gameTypeNames[document.gameType]} · {mm ? Number(document.playerCount) : document.supportedPlayerCounts?.join('·')}명 · 약 {String(document.estimatedMinutes)}분
                    </small>
                    <button onClick={() => setTab('basics')}>기본 정보 편집</button>
                  </article>
                  <article>
                    <span>02</span>
                    <h3>규칙과 연결 검증</h3>
                    <p>필수 항목과 자료 연결을 확인합니다. 실제 플레이 결과는 시험에서 점검하세요.</p>
                    <button disabled={action.pending || !!draft.conflict} onClick={() => void validate()}>
                      검증
                    </button>
                    <button onClick={() => setTab('test')}>테스트 열기</button>
                  </article>
                  <article>
                    <span>03</span>
                    <h3>공개 검수 요청</h3>
                    <p>지금 저장한 버전을 제출합니다. 이후 편집 내용은 제출한 버전을 바꾸지 않습니다.</p>
                    <button className={s.primaryAction} disabled={action.pending || !!draft.conflict} onClick={() => void submit()}>
                      공개 검수 요청
                    </button>
                  </article>
                </div>
                <VersionHistory work={work} pending={action.pending} onTest={testVersion} />
              </section>
            )}
          </div>
        </div>
        <footer className={chrome.statusBar}>
          <span>
            <i />내 작품 · {gameTypeNames[document.gameType]}
          </span>
          <span>개정 {draft.revision} · 서버에 자동 저장</span>
          <span>시험과 공개 버전은 편집 초안과 분리됩니다</span>
        </footer>
      </div>
    </AuthorFormContext>
  );
}
function AssetPanel({ assets, refresh }: { assets: Asset[]; refresh: () => void }) {
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const action = useCommand();
  async function upload(file: File) {
    setError('');
    setBusy(true);
    try {
      const csrf = await getCsrf(),
        form = new FormData();
      form.append('file', file);
      await http.post('/author/assets', form, { headers: { [csrf.headerName]: csrf.token, 'Idempotency-Key': crypto.randomUUID() } });
      refresh();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className={s.panel}>
      <h2>이미지와 음원</h2>
      <p>PNG·JPEG 최대 10MB, MP3·OGG·WAV 최대 25MB. 직접 제작했거나 사용 허락을 받은 파일을 올려 주세요.</p>
      <label>
        자산 업로드
        <input
          type="file"
          accept="image/png,image/jpeg,audio/mpeg,audio/ogg,audio/wav,.mp3,.ogg,.wav"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
            e.target.value = '';
          }}
        />
      </label>
      <ErrorNotice message={error || action.error} />
      <div className={s.assets}>
        {assets.map((a) => (
          <article className={s.card} key={a.id}>
            {a.mimeType.startsWith('image/') ? <img src={assetUrl(a.id)} alt={a.name} /> : <audio controls src={assetUrl(a.id)} preload="none" />}
            <strong>{a.name}</strong>
            <label>
              자료 식별자
              <input readOnly value={a.id} onFocus={(e) => e.target.select()} />
            </label>
            <small>{Math.round(a.size / 1024)} KB</small>
            <button
              disabled={action.pending}
              onClick={async () => {
                if (await action.run('DELETE', `/author/assets/${a.id}`)) refresh();
              }}
            >
              삭제
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
