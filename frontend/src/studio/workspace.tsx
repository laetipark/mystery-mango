import { createContext, useContext, useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import s from './studio.module.scss';
import p from './workspace-polish.module.scss';
import c from './contextual-workspace.module.scss';
import d from './editor-details.module.scss';
import { useEditorState, useEditorScroll } from './editor-memory';
export type WorkspaceTool = 'templates' | 'elements' | 'text' | 'background' | 'materials';
export const WorkspaceToolsContext = createContext<{ library?: ReactNode; tool?: WorkspaceTool; toolActivation?: number; onLibraryDismiss?: () => void }>({});
type WorkspaceGlyphName = 'text' | 'image' | 'rect' | 'ellipse' | 'material' | 'layers' | 'settings' | 'canvas' | 'front' | 'back' | 'lock' | 'hidden' | 'copy' | 'trash' | 'expand';
export function WorkspaceGlyph({ name, size = 18 }: { name: WorkspaceGlyphName; size?: number }) {
  const shapes = {
    text: (
      <>
        <path d="M5 5h14M12 5v14M8 19h8" />
      </>
    ),
    image: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="3" />
        <circle cx="8" cy="9" r="1.5" />
        <path d="m4 17 5-5 4 4 3-3 5 5" />
      </>
    ),
    rect: <rect x="4" y="4" width="16" height="16" rx="2" />,
    ellipse: <ellipse cx="12" cy="12" rx="9" ry="7" />,
    material: (
      <>
        <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8M8 17h5" />
      </>
    ),
    layers: (
      <>
        <path d="m12 3 10 5-10 5L2 8zM3 12l9 5 9-5M3 16l9 5 9-5" />
      </>
    ),
    settings: (
      <>
        <path d="M4 6h6M14 6h6M4 12h10M18 12h2M4 18h2M10 18h10" />
        <circle cx="12" cy="6" r="2" />
        <circle cx="16" cy="12" r="2" />
        <circle cx="8" cy="18" r="2" />
      </>
    ),
    canvas: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M7 8h10M7 12h6M7 16h3" />
      </>
    ),
    front: (
      <>
        <rect x="5" y="2" width="14" height="20" rx="3" />
        <path d="M9 8h6M12 8v8" />
      </>
    ),
    back: (
      <>
        <rect x="5" y="2" width="14" height="20" rx="3" />
        <path d="m12 7 4 5-4 5-4-5z" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="10" width="14" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
      </>
    ),
    hidden: (
      <>
        <path d="m3 3 18 18M10 5a11 11 0 0 1 11 7 15 15 0 0 1-3 4M6 6a14 14 0 0 0-3 6c4 7 10 8 15 5M9 9a4 4 0 0 0 6 6" />
      </>
    ),
    copy: (
      <>
        <rect x="8" y="8" width="13" height="13" rx="2" />
        <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
      </>
    ),
    trash: (
      <>
        <path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7" />
      </>
    ),
    expand: (
      <>
        <path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5" />
      </>
    )
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {shapes[name]}
    </svg>
  );
}
function subscribeMobile(listener: () => void) {
  const media = window.matchMedia('(max-width: 800px)');
  media.addEventListener('change', listener);
  return () => media.removeEventListener('change', listener);
}
export function useMobileEditor() {
  return useSyncExternalStore(
    subscribeMobile,
    () => window.matchMedia('(max-width: 800px)').matches,
    () => false
  );
}
export function WorkspacePanels({
  left,
  center,
  right,
  leftTitle = '구성',
  rightTitle = '속성',
  selectionKey,
  onClearSelection,
  layers,
  footer,
  preview,
  memoryKey = "main"
}: {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
  leftTitle?: string;
  rightTitle?: string;
  selectionKey?: string | null;
  onClearSelection?: () => void;
  layers?: ReactNode;
  footer?: ReactNode;
  preview?: ReactNode;
  memoryKey?: string;
}) {
  const { library, tool, toolActivation, onLibraryDismiss } = useContext(WorkspaceToolsContext);
  const mobile = useMobileEditor();
  const [pane, setPane] = useEditorState(`panel:${memoryKey}`, 'center');
  const [compact, setCompact] = useEditorState(`compact:${memoryKey}`, false);
  const [forcedInspector, setForcedInspector] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const auxiliary = useRef<HTMLElement>(null);
  const layerButton = useRef<HTMLButtonElement>(null);
  const layerId = useId();
  const previous = useRef({ selectionKey, tool, toolActivation });
  const dismissingLibrary = useRef(false);
  const inspecting = pane !== 'left' && (Boolean(selectionKey) || forcedInspector);
  const libraryScroll = useEditorScroll(`${memoryKey}:library`);
  const propertiesScroll = useEditorScroll(`${memoryKey}:properties`);
  const centerScroll = useEditorScroll<HTMLElement>(`${memoryKey}:canvas`);
  function materials() {
    setForcedInspector(false);
    setCompact(false);
    setPane('left');
  }
  function properties() {
    setPane('right');
    setForcedInspector(true);
    setCompact(false);
  }
  function clearSelection() {
    onClearSelection?.();
    materials();
    auxiliary.current?.querySelector<HTMLButtonElement>('[aria-label="재료 목록"]')?.focus({ preventScroll: true });
  }
  useEffect(() => {
    if (!root.current?.getClientRects().length) return;
    const old = previous.current;
    previous.current = { selectionKey, tool, toolActivation };
    if (tool !== old.tool || toolActivation !== old.toolActivation) {
      if (dismissingLibrary.current) dismissingLibrary.current = false;
      else {
        setForcedInspector(false);
        setCompact(false);
        setPane('left');
      }
    }
    if (selectionKey && selectionKey !== old.selectionKey) {
      setForcedInspector(false);
      setCompact(false);
      setPane('right');
      if (library && onLibraryDismiss) {
        dismissingLibrary.current = true;
        onLibraryDismiss();
      }
    }
  }, [selectionKey, tool, toolActivation, library, onLibraryDismiss, onClearSelection, setCompact, setPane]);
  useEffect(() => {
    const current = root.current;
    function reveal(event: Event) {
      const target = event.target as HTMLElement;
      setCompact(false);
      if (target.closest('[data-workspace-pane="right"]')) {
        setForcedInspector(true);
        setPane('right');
      } else if (target.closest('[data-workspace-pane="left"]')) {
        onClearSelection?.();
        setForcedInspector(false);
        onLibraryDismiss?.();
        setPane('left');
      }
    }
    function escape(event: KeyboardEvent) {
      if (event.key !== 'Escape' || event.defaultPrevented || event.isComposing || event.keyCode === 229 || !root.current?.getClientRects().length) return;
      if (layersOpen) {
        setLayersOpen(false);
        layerButton.current?.focus();
      } else if (selectionKey || forcedInspector) {
        onClearSelection?.();
        setForcedInspector(false);
        setPane('left');
        auxiliary.current?.querySelector<HTMLButtonElement>('[aria-label="재료 목록"]')?.focus({ preventScroll: true });
      }
    }
    function outside(event: PointerEvent) {
      if (layersOpen && !auxiliary.current?.contains(event.target as Node)) setLayersOpen(false);
    }
    current?.addEventListener('studio-reveal', reveal);
    window.addEventListener('keydown', escape);
    window.addEventListener('pointerdown', outside);
    return () => {
      current?.removeEventListener('studio-reveal', reveal);
      window.removeEventListener('keydown', escape);
      window.removeEventListener('pointerdown', outside);
    };
  }, [selectionKey, forcedInspector, layersOpen, onClearSelection, onLibraryDismiss, setCompact, setPane]);
  return (
    <div ref={root} className={`${c.workspace} ${p.workspaceChrome}`} data-pane={pane} data-inspecting={inspecting || undefined} data-compact={compact || undefined}>
      <nav className={c.mobileTabs} aria-label="작업 영역">
        <button aria-pressed={pane === 'left'} onClick={materials}>
          <WorkspaceGlyph name="material" />
          {leftTitle}
        </button>
        <button
          aria-pressed={pane === 'center'}
          onClick={() => {
            setPane('center');
            setCompact(false);
          }}
        >
          <WorkspaceGlyph name="canvas" />
          작업 화면
        </button>
        <button
          aria-pressed={pane === 'right'}
          onClick={properties}
        >
          <WorkspaceGlyph name="settings" />
          {rightTitle}
        </button>
      </nav>
      <div ref={libraryScroll} className={`${c.side} ${c.library}`} data-workspace-scroll="left">
        <div className={c.panelHeader}><WorkspaceGlyph name="material" /><strong>{library ? '템플릿' : leftTitle}</strong><span>추가 · 탐색</span></div>
        <aside className={`${c.panel} ${p.sidePanel}`} data-inactive={Boolean(library) || undefined} data-workspace-pane="left" aria-label={leftTitle}>
          {left}
        </aside>
        {library && (
          <aside className={c.panel} aria-label="템플릿 목록">
            {library}
          </aside>
        )}
      </div>
      <section ref={centerScroll} className={`${s.workspaceCenter} ${c.center}`} data-workspace-scroll="center" aria-label="편집 작업 화면" onClick={event => { if (!mobile && selectionKey && (event.target as HTMLElement).closest('.konvajs-content')) setPane('right'); }}>
        {center}
      </section>
      <div ref={propertiesScroll} className={`${c.side} ${c.inspector}`} data-workspace-scroll="right">
        <div className={c.panelHeader}>
          <WorkspaceGlyph name="settings" /><strong>{rightTitle}</strong>
          {selectionKey && <button aria-label="선택 해제하고 재료 목록으로" title="선택 해제 (Esc)" onClick={clearSelection}>선택 해제 <kbd>Esc</kbd></button>}
        </div>
        <aside className={`${c.panel} ${p.sidePanel}`} data-workspace-pane="right" aria-label={rightTitle}>
          {preview && <div className={d.compactPreview}>{preview}</div>}
          {right}
        </aside>
      </div>
      <aside ref={auxiliary} className={c.auxiliary} aria-label="작업 보조 도구">
        {layers && (
          <button ref={layerButton} aria-label="레이어" title="레이어" aria-expanded={layersOpen} aria-controls={layerId} onClick={() => setLayersOpen(!layersOpen)}>
            <WorkspaceGlyph name="layers" />
          </button>
        )}
        <button aria-label="재료 목록" title="재료 목록" onClick={materials}>
          <WorkspaceGlyph name="material" />
        </button>
        <button aria-label="속성 패널" title="속성 패널" onClick={properties}>
          <WorkspaceGlyph name="settings" />
        </button>
        <button aria-label={compact ? '보조 패널 열기' : '작업 화면 넓히기'} title={compact ? '보조 패널 열기' : '작업 화면 넓히기'} aria-pressed={compact} onClick={() => { setCompact(!compact); setPane(compact ? (selectionKey ? 'right' : 'left') : 'center'); }}>
          <WorkspaceGlyph name="expand" />
        </button>
        {layers && layersOpen && (
          <section id={layerId} className={c.layerPopover} aria-label="레이어 목록">
            <header>
              <strong>레이어</strong>
              <button
                aria-label="레이어 닫기"
                onClick={() => {
                  setLayersOpen(false);
                  layerButton.current?.focus();
                }}
              >
                ×
              </button>
            </header>
            <div onClick={event => { if ((event.target as HTMLElement).closest('button')) {setPane('right');setForcedInspector(true);} }}>{layers}</div>
          </section>
        )}
      </aside>
      {footer && <div className={c.footer}>{footer}</div>}
    </div>
  );
}
export function referenceUses(document: unknown, id: string, exclude = ''): string[] {
  const found: string[] = [];
  function visit(value: unknown, path: string) {
    if (path === exclude) return;
    if (Array.isArray(value)) {
      value.forEach((v, i) => {
        if (v === id) found.push(path);
        else visit(v, `${path}.${i}`);
      });
    } else if (value && typeof value === 'object')
      Object.entries(value).forEach(([key, v]) => {
        if (key !== 'id' && v === id) found.push(`${path}.${key}`);
        else if (typeof v === 'object') visit(v, path ? `${path}.${key}` : key);
      });
  }
  visit(document, '');
  return [...new Set(found)];
}

const referenceNames: Record<string, string> = {
  phases: '진행 단계',
  roles: '등장인물',
  clues: '단서',
  targets: '조사 장소',
  rules: '사건 규칙',
  endings: '엔딩',
  ballot: '범인 투표',
  presentation: '시각 자료',
  scenes: '장면',
  cardLayouts: '카드 디자인',
  tabletop: '테이블',
  objects: '구성물',
  decks: '카드 덱',
  cards: '덱 카드',
  phaseId: '진행 단계 연결',
  phaseIds: '진행 단계 연결',
  clueId: '단서 연결',
  clueIds: '단서 연결',
  roleId: '역할 연결',
  culpritRoleId: '범인 역할',
  referenceId: '자료 연결',
  bindingId: '자료 내용 연결',
  layoutId: '앞뒷면 디자인',
  backLayoutId: '공통 뒷면 디자인',
  effects: '공개 효과',
  condition: '조건',
  conditions: '세부 조건',
  nodes: '화면 요소'
};
export function referenceLabel(document: unknown, path: string): string {
  let value = document;
  const labels: string[] = [];
  for (const part of path.split('.')) {
    if (/^\d+$/.test(part)) {
      value = Array.isArray(value) ? value[Number(part)] : undefined;
      const item = value as { name?: string; title?: string; kind?: string } | undefined;
      labels.push(item?.name ?? item?.title ?? `${Number(part) + 1}번째 항목`);
    } else {
      if (referenceNames[part]) labels.push(referenceNames[part]);
      value = value && typeof value === 'object' ? (value as Record<string, unknown>)[part] : undefined;
    }
  }
  return labels.join(' · ') || '연결된 항목';
}
