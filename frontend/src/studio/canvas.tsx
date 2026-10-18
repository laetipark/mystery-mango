import { useContext, useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Ellipse, Text, Image as CanvasImage, Transformer, Line } from 'react-konva';
import type Konva from 'konva';
import type { CanvasNode, Scene, Asset, Document, Data } from './types';
import { assetUrl } from './types';
import s from './studio.module.scss';
import p from './workspace-polish.module.scss';
import c from './contextual-workspace.module.scss';
import { Icon } from '~/components/icon';
import { WorkspacePanels, WorkspaceGlyph, WorkspaceToolsContext, useMobileEditor } from './workspace';
import { Field } from './forms';
import { useEditorState, navigateEditor } from './editor-memory';
import { CardFace } from './card-face';
import d from './editor-details.module.scss';
function Picture({ node, url, common }: { node: CanvasNode; url: string; common: Record<string, unknown> }) {
  const [image, setImage] = useState<HTMLImageElement>();
  useEffect(() => {
    const value = new window.Image();
    value.onload = () => setImage(value);
    value.src = url;
    return () => {
      value.onload = null;
    };
  }, [url]);
  return <CanvasImage {...common} image={image} width={node.width} height={node.height} />;
}
export function SceneCanvas({
  scene,
  onChange,
  selected,
  onSelect,
  context,
  readonly = false
}: {
  scene: Scene;
  onChange?: (s: Scene) => void;
  selected?: string;
  onSelect?: (id: string) => void;
  context?: { gameId?: string; sandboxId?: string };
  readonly?: boolean;
}) {
  const mobile = useMobileEditor();
  const stage = useRef<Konva.Stage>(null),
    transformer = useRef<Konva.Transformer>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useEditorState(`zoom:${scene.id}`, 0);
  const [snap, setSnap] = useEditorState('snap-grid', false);
  const quantize = (value: number) => Math.round(value / (snap ? 10 : 1)) * (snap ? 10 : 1);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 480 });
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
  const composing = useRef(false),
    editingActive = useRef(false);
  const editedNode = scene.nodes.find((node) => node.id === editing?.id);
  const displayScale = (!mobile && scale) || (viewportSize.width ? Math.min(1, viewportSize.width / scene.width, readonly ? 1 : viewportSize.height / scene.height) : 0.25);
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const panel = element.closest<HTMLElement>(`.${s.workspaceCenter}`);
    function outerHeight(element: Element) {
      const style = window.getComputedStyle(element);
      return element.getBoundingClientRect().height + (parseFloat(style.marginTop) || 0) + (parseFloat(style.marginBottom) || 0);
    }
    function measure() {
      if (!element || !element.clientWidth) return;
      const heightLimit = Math.max(420, Math.min(560, window.innerHeight - 280));
      let height = heightLimit;
      if (!readonly && panel && element.parentElement) {
        const wrapper = element.parentElement;
        const style = window.getComputedStyle(panel);
        const otherControls = Array.from(panel.children)
          .filter((child) => child !== wrapper)
          .reduce((total, child) => total + outerHeight(child), 0);
        const padding = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);
        const controlsHeight = otherControls + outerHeight(wrapper) - element.getBoundingClientRect().height + padding;
        height = Math.min(heightLimit, Math.max(240, panel.clientHeight - controlsHeight));
      }
      const width = element.clientWidth;
      setViewportSize((previous) => (previous.width === width && previous.height === height ? previous : { width, height }));
    }
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    if (panel && !readonly) {
      observer.observe(panel);
      Array.from(panel.children).forEach((child) => observer.observe(child));
    }
    window.addEventListener('resize', measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [readonly]);
  useEffect(() => {
    const selectedNode = selected ? scene.nodes.find((node) => node.id === selected) : undefined;
    const node = selectedNode && !selectedNode.hidden && !selectedNode.locked && !readonly && !mobile ? stage.current?.findOne((candidate: Konva.Node) => candidate.id() === selected) : undefined;
    transformer.current?.nodes(node ? [node] : []);
  }, [selected, readonly, scene, mobile]);
  function change(id: string, delta: Partial<CanvasNode>) {
    onChange?.({ ...scene, nodes: scene.nodes.map((n) => (n.id === id ? { ...n, ...delta } : n)) });
  }
  function editText(node: CanvasNode) {
    if (readonly || node.locked) return;
    composing.current = false;
    onSelect?.(node.id);
    editingActive.current = true;
    setEditing({ id: node.id, text: node.text });
  }
  function finishText(apply: boolean) {
    if (!editingActive.current) return;
    editingActive.current = false;
    composing.current = false;
    if (apply && editing) change(editing.id, { text: editing.text });
    setEditing(null);
  }
  return (
    <div className={!readonly ? `${p.canvasFrame} ${c.canvasFrame}` : undefined}>
      <div className={!readonly ? p.zoomBar : undefined}>
        {!readonly && !mobile && <label><input type="checkbox" checked={snap} onChange={event => setSnap(event.target.checked)}/> 10px 격자 맞춤</label>}
        {!readonly && (
          <span className={p.canvasDimensions}>
            <WorkspaceGlyph name="canvas" size={16} />
            {scene.width} × {scene.height}
          </span>
        )}
        <label>
          보기 배율{' '}
          <select aria-label="보기 배율" disabled={mobile} value={mobile ? 0 : scale} onChange={(e) => setScale(Number(e.target.value))}>
            <option value={0}>화면에 맞추기</option>
            {[0.25, 0.5, 0.65, 0.75, 1, 1.5].map((v) => (
              <option key={v} value={v}>
                {Math.round(v * 100)}%
              </option>
            ))}
          </select>
        </label>
      </div>
      <div
        ref={viewport}
        tabIndex={readonly || mobile ? undefined : 0}
        role={readonly ? undefined : 'group'}
        aria-label={readonly ? undefined : '캔버스 배치: 방향키 1픽셀, Shift 방향키 10픽셀 이동'}
        onKeyDown={event => {
          if (readonly || mobile || editingActive.current || event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229 || event.altKey || event.ctrlKey || event.metaKey || (event.target as HTMLElement).closest('input,textarea,select,[contenteditable="true"]')) return;
          const node = scene.nodes.find(item => item.id === selected);
          if (!node || node.locked || node.hidden || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
          event.preventDefault(); event.stopPropagation();
          const step = event.shiftKey ? 10 : 1;
          change(node.id, {x:node.x + (event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0), y:node.y + (event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0)});
        }}
        className={`${s.canvas} ${!readonly ? `${p.canvasSurface} ${c.canvasSurface}` : ''}`}
        style={{ position: 'relative', ...(readonly || mobile ? { touchAction: 'pan-y' } : {}) }}
      >
        <div style={{ position: 'relative', width: scene.width * displayScale, marginInline: 'auto' }}>
          <Stage
            ref={stage}
            width={scene.width * displayScale}
            height={scene.height * displayScale}
            scaleX={displayScale}
            scaleY={displayScale}
            onMouseDown={(e) => {
              if (!readonly && !mobile) viewport.current?.focus({preventScroll:true});
              if (e.target === e.target.getStage()) onSelect?.('');
            }}
            onTouchStart={(e) => {
              if (e.target === e.target.getStage()) onSelect?.('');
            }}
          >
            <Layer>
              <Rect width={scene.width} height={scene.height} fill={scene.background} listening={false} />
              {snap && !readonly && <>{Array.from({length: Math.floor(scene.width / 10)}, (_, index) => <Line key={`x${index}`} points={[(index + 1) * 10,0,(index + 1) * 10,scene.height]} stroke="#80808025" strokeWidth={0.5} listening={false}/>)}{Array.from({length: Math.floor(scene.height / 10)}, (_, index) => <Line key={`y${index}`} points={[0,(index + 1) * 10,scene.width,(index + 1) * 10]} stroke="#80808025" strokeWidth={0.5} listening={false}/>)}</>}
              {scene.nodes
                .filter((n) => readonly || !n.hidden)
                .map((node) => {
                  const common = {
                    id: node.id,
                    x: node.x,
                    y: node.y,
                    rotation: node.rotation,
                    draggable: !readonly && !mobile && !node.locked,
                    onClick: () => onSelect?.(node.id),
                    onTap: () => onSelect?.(node.id),
                    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => change(node.id, { x: quantize(e.target.x()), y: quantize(e.target.y()) }),
                    onTransformEnd: (e: Konva.KonvaEventObject<Event>) => {
                      const n = e.target;
                      const w = Math.max(10, node.width * n.scaleX()),
                        h = Math.max(10, node.height * n.scaleY());
                      n.scaleX(1);
                      n.scaleY(1);
                      change(node.id, { x: quantize(n.x()), y: quantize(n.y()), width: Math.round(w), height: Math.round(h), rotation: Math.round(n.rotation()) });
                    }
                  };
                  if (node.kind === 'IMAGE' && node.assetId) return <Picture key={node.id} node={node} common={common} url={assetUrl(node.assetId, context)} />;
                  if (node.kind === 'TEXT' || node.kind === 'MATERIAL')
                    return (
                      <Text
                        key={node.id}
                        {...common}
                        visible={editing?.id !== node.id}
                        onDblClick={() => editText(node)}
                        onDblTap={() => editText(node)}
                        text={node.text ?? ''}
                        width={node.width}
                        height={node.height}
                        fill={node.fill || '#242a27'}
                        fontSize={node.fontSize || 24}
                        fontFamily="sans-serif"
                      />
                    );
                  if (node.kind === 'ELLIPSE')
                    return <Ellipse key={node.id} {...common} offsetX={-node.width / 2} offsetY={-node.height / 2} radiusX={node.width / 2} radiusY={node.height / 2} fill={node.fill} />;
                  return <Rect key={node.id} {...common} width={node.width} height={node.height} fill={node.fill || '#dbc6a6'} />;
                })}
              {!readonly && !mobile && (
                <Transformer
                  ref={transformer}
                  borderStroke="#d5ac2f"
                  anchorStroke="#d5ac2f"
                  anchorFill="#fff8d8"
                  flipEnabled={false}
                  boundBoxFunc={(old, next) => (Math.abs(next.width) < 10 || Math.abs(next.height) < 10 ? old : next)}
                />
              )}
            </Layer>
          </Stage>
          {editing && editedNode && (
            <textarea
              aria-label="캔버스 텍스트 편집"
              autoFocus
              value={editing.text}
              style={{
                position: 'absolute',
                top: editedNode.y * displayScale,
                left: editedNode.x * displayScale,
                width: editedNode.width * displayScale,
                height: Math.max(50, editedNode.height * displayScale),
                minHeight: 0,
                padding: 0,
                borderRadius: 0,
                fontSize: (editedNode.fontSize || 24) * displayScale,
                lineHeight: 1,
                color: editedNode.fill,
                transform: `rotate(${editedNode.rotation}deg)`,
                transformOrigin: 'top left',
                zIndex: 2
              }}
              onChange={(e) => setEditing({ ...editing, text: e.target.value })}
              onCompositionStart={() => {
                composing.current = true;
              }}
              onCompositionEnd={() => {
                composing.current = false;
              }}
              onBlur={() => finishText(true)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault();
                  e.stopPropagation();
                  finishText(false);
                } else if (e.key === 'Enter' && !e.shiftKey && !composing.current && !e.nativeEvent.isComposing && e.nativeEvent.keyCode !== 229) {
                  e.preventDefault();
                  finishText(true);
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
export function SceneEditor({
  scenes,
  onChange,
  assets,
  document,
  cardMode = false,
  sceneId,
  onSceneSelect
}: {
  scenes: Scene[];
  onChange: (s: Scene[]) => void;
  assets: Asset[];
  document?: Document;
  cardMode?: boolean;
  sceneId?: string;
  onSceneSelect?: (id: string) => void;
}) {
  const mobile = useMobileEditor();
  const { tool } = useContext(WorkspaceToolsContext);
  const [sceneIndex, setSceneIndex] = useEditorState(cardMode ? 'card-scene-index' : 'scene-index', 0);
  const [search, setSearch] = useEditorState('scene-search', '');
  const [kindFilter, setKindFilter] = useEditorState('scene-kind-filter', 'ALL');
  const settings = useRef<HTMLDetailsElement>(null);
  const scene = scenes.find((entry) => entry.id === sceneId) ?? scenes[Math.min(sceneIndex, Math.max(0, scenes.length - 1))];
  const [selected, setSelected] = useEditorState(`selected:${scene?.id ?? 'empty'}`, '');
  const matchingScenes = scenes.filter(item => item.name.toLocaleLowerCase().includes(search.toLocaleLowerCase().trim()) && (kindFilter === 'ALL' || (item.kind ?? 'SCENE') === kindFilter));
  const matchingIndex = matchingScenes.findIndex(item => item.id === scene?.id);
  const layoutIndex = document?.presentation.cardLayouts?.findIndex((layout) => scene?.id === `${layout.id}-front` || scene?.id === `${layout.id}-back`) ?? -1;
  const fieldBase = cardMode ? `presentation.cardLayouts.${layoutIndex}.${scene?.id.endsWith('-back') ? 'back' : 'front'}` : `presentation.scenes.${scenes.indexOf(scene)}`;
  const sizeBase = cardMode ? `presentation.cardLayouts.${layoutIndex}` : fieldBase;
  const nodeBase = `${fieldBase}.nodes.${scene?.nodes.findIndex((node) => node.id === selected) ?? -1}`;
  useEffect(() => {
    function focus(event: Event) {
      const path = (event as CustomEvent<string>).detail;
      if (!path.startsWith(`${fieldBase}.nodes.`)) return;
      const node = scene?.nodes[Number(path.slice(`${fieldBase}.nodes.`.length).split('.')[0])];
      if (node) setSelected(node.id);
    }
    window.addEventListener('studio-focus-field', focus);
    return () => window.removeEventListener('studio-focus-field', focus);
  }, [fieldBase, scene, setSelected]);
  function referenceName(group: string, id: string) {
    const item = ((document?.[group] ?? []) as Data[]).find((item) => item.id === id);
    return String(item?.name ?? item?.title ?? ({INTRO:'도입',READING:'자료 읽기',INVESTIGATION:'조사',DISCUSSION:'토론',VOTE:'투표',VOTING:'투표',ENDING:'엔딩'} as Record<string,string>)[String(item?.kind)] ?? '연결 대상 없음');
  }
  function update(next: Scene) {
    onChange(scenes.map((s) => (s.id === next.id ? next : s)));
  }
  function addScene() {
    const next: Scene = {
      id: `scene-${crypto.randomUUID().slice(0, 8)}`,
      name: '새 장면',
      kind: 'SCENE',
      referenceId: '',
      phaseIds: [],
      width: 1280,
      height: 720,
      background: '#fffaf0',
      bgmAssetId: null,
      nodes: []
    };
    onChange([...scenes, next]);
    setSceneIndex(scenes.length);
    onSceneSelect?.(next.id);
    setSelected('');
  }
  const node = scene?.nodes.find((n) => n.id === selected);
  function updateNode(delta: Partial<CanvasNode>) {
    if (scene) update({ ...scene, nodes: scene.nodes.map((n) => (n.id === selected ? { ...n, ...delta } : n)) });
  }
  function chooseScene(id: string) {
    setSceneIndex(scenes.findIndex((scene) => scene.id === id));
    onSceneSelect?.(id);
  }
  function add(kind: CanvasNode['kind']) {
    const hex = /^#([0-9a-f]{6})$/i.exec(scene.background)?.[1];
    const brightness = hex ? [0, 2, 4].reduce((sum, offset, channel) => sum + parseInt(hex.slice(offset, offset + 2), 16) * [0.299, 0.587, 0.114][channel], 0) : 255;
    const textColor = brightness < 140 ? '#fffaf0' : '#242a27';
    const id = `node-${crypto.randomUUID().slice(0, 8)}`;
    update({
      ...scene,
      nodes: [
        ...scene.nodes,
        {
          id,
          kind,
          x: 40,
          y: 40,
          width: 220,
          height: 100,
          rotation: 0,
          fill: kind === 'TEXT' ? textColor : '#e8c58c',
          text: kind === 'TEXT' ? '내용을 입력하세요' : '',
          fontSize: 24,
          assetId: null,
          locked: false,
          hidden: false,
          bindingType: 'NONE',
          bindingId: ''
        }
      ]
    });
    setSelected(id);
  }
  const filmstrip = !cardMode && scenes.length > 0 && (
    <section className={c.filmstrip} aria-label="장면 목록">
      <span className={c.filmstripLabel}>
        장면 <strong>{scenes.length}</strong>
      </span>
      <ol>
        {matchingScenes.map((item) => { const index = scenes.indexOf(item); return (
          <li key={item.id}>
            <button
              className={c.sceneThumbnail}
              aria-pressed={item.id === scene?.id}
              onClick={() => chooseScene(item.id)}
              title={`${item.name} · ${item.kind === 'ROLE' ? '역할 자료' : item.kind === 'CLUE' ? '단서 자료' : '공용 장면'} · ${item.phaseIds?.length ? item.phaseIds.map((id) => referenceName('phases', id)).join(', ') : '모든 단계'}${item.referenceId ? ` · ${referenceName(item.kind === 'ROLE' ? 'roles' : 'clues', item.referenceId)}` : ''}`}
            >
              <svg viewBox={`0 0 ${item.width} ${item.height}`} aria-hidden="true" preserveAspectRatio="xMidYMid meet">
                <rect width={item.width} height={item.height} fill={item.background} />
                {item.nodes
                  .filter((node) => !node.hidden)
                  .map((node) => (
                    <g key={node.id} transform={`translate(${node.x} ${node.y}) rotate(${node.rotation})`}>
                      {node.kind === 'IMAGE' && node.assetId ? (
                        <image href={assetUrl(node.assetId)} width={node.width} height={node.height} preserveAspectRatio="none" />
                      ) : node.kind === 'TEXT' || node.kind === 'MATERIAL' ? (
                        <text y={node.fontSize || 24} fill={node.fill} fontSize={node.fontSize || 24}>
                          {node.text?.split('\n')[0]?.slice(0, 60)}
                        </text>
                      ) : node.kind === 'ELLIPSE' ? (
                        <ellipse cx={node.width / 2} cy={node.height / 2} rx={node.width / 2} ry={node.height / 2} fill={node.fill} />
                      ) : (
                        <rect width={node.width} height={node.height} fill={node.fill} />
                      )}
                    </g>
                  ))}
              </svg>
              <span>
                {String(index + 1).padStart(2, '0')} · {item.name}
              </span>
            </button>
            <div className={c.sceneReorder}>
              {[-1, 1].map((direction) => (
                <button
                  key={direction}
                  disabled={mobile || index + direction < 0 || index + direction >= scenes.length}
                  aria-label={`${item.name} ${direction < 0 ? '앞으로' : '뒤로'}`}
                  onClick={() => {
                    const next = [...scenes];
                    [next[index], next[index + direction]] = [next[index + direction], next[index]];
                    onChange(next);
                    setSceneIndex(next.findIndex((entry) => entry.id === scene?.id));
                  }}
                >
                  {direction < 0 ? '←' : '→'}
                </button>
              ))}
            </div>
          </li>
        ); })}
      </ol>
      <button className={c.addSceneTile} disabled={mobile} onClick={addScene} aria-label="새 장면 추가">
        <Icon name="create" size={20} />
        <span>장면</span>
      </button>
      <p>
        장면 선택은 게임의
        <br />
        진행 단계를 바꾸지 않습니다.
      </p>
    </section>
  );
  return (
    <div className={`${p.sceneEditor} ${c.sceneEditor}`}>
      {!cardMode && <div className={d.toolbar}>
        <label>장면·자료 검색<input type="search" aria-label="장면·자료 검색" value={search} onChange={event => setSearch(event.target.value)} placeholder="이름으로 찾기"/></label>
        <label>종류<select aria-label="장면 종류 필터" value={kindFilter} onChange={event => setKindFilter(event.target.value)}><option value="ALL">전체</option><option value="SCENE">공용 장면</option><option value="ROLE">역할 자료</option><option value="CLUE">단서 자료</option></select></label>
        <button disabled={matchingIndex <= 0} onClick={() => chooseScene(matchingScenes[matchingIndex - 1].id)}>이전 자료</button>
        <button disabled={matchingIndex < 0 || matchingIndex >= matchingScenes.length - 1} onClick={() => chooseScene(matchingScenes[matchingIndex + 1].id)}>다음 자료</button>
      </div>}
      <div className={`${s.row} ${p.sceneSwitch}`}>
        {cardMode && (
          <div className={p.faceToggle} role="group" aria-label="카드 면 전환">
            {scenes.map((face) => (
              <button key={face.id} aria-pressed={face.id === scene?.id} onClick={() => chooseScene(face.id)}>
                <WorkspaceGlyph name={face.id.endsWith('-back') ? 'back' : 'front'} />
                {face.name}
              </button>
            ))}
          </div>
        )}
        {!cardMode && (
          <span className={p.switchLabel}>
            <WorkspaceGlyph name="canvas" />
            편집 장면
          </span>
        )}
        {!cardMode && (
          <select aria-label="편집할 장면" value={scene?.id ?? ''} onChange={(e) => chooseScene(e.target.value)}>
            {scenes.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        )}
        {!cardMode && (
          <button disabled={mobile} onClick={addScene}>
            <Icon name="create" size={18} />
            장면 추가
          </button>
        )}
        {scene && !cardMode && (
          <button
            disabled={mobile}
            onClick={() => {
              onChange(scenes.filter((s) => s.id !== scene.id));
              setSceneIndex(0);
            }}
          >
            <WorkspaceGlyph name="trash" />
            장면 삭제
          </button>
        )}
      </div>
      {scene && !cardMode && <div className={d.summary} aria-label="장면 연결 요약">
        <span>{scene.kind === 'ROLE' ? '역할 자료' : scene.kind === 'CLUE' ? '단서 자료' : '공용 장면'}</span>
        <span>{scene.phaseIds?.length ? scene.phaseIds.map(id => referenceName('phases', id)).join(' · ') : '모든 단계'}</span>
        {scene.referenceId && <button onClick={() => {const group = scene.kind === 'ROLE' ? 'roles' : 'clues'; navigateEditor(`${group}.${((document?.[group] ?? []) as Data[]).findIndex(item => item.id === scene.referenceId)}`);}}>{referenceName(scene.kind === 'ROLE' ? 'roles' : 'clues', scene.referenceId)} →</button>}
        {(scene.phaseIds ?? []).map(id => <button key={id} onClick={() => navigateEditor(`phases.${((document?.phases ?? []) as Data[]).findIndex(item => item.id === id)}`)}>{referenceName('phases', id)} →</button>)}
        <span>음악 · {assets.find(asset => asset.id === scene.bgmAssetId)?.name ?? '없음'}</span>
        <button onClick={() => {if (settings.current) {settings.current.open = true; settings.current.dispatchEvent(new Event('studio-reveal', {bubbles:true})); settings.current.scrollIntoView({block:'nearest'});}}}>장면 설정</button>
      </div>}
      {scene ? (
        <WorkspacePanels memoryKey={`scene:${scene.id}`}
          preview={<><CardFace design={{width:scene.width,height:scene.height,background:scene.background,nodes:scene.nodes.filter(node => !node.hidden).map(node => ({...node,kind:node.kind === 'MATERIAL' ? 'TEXT' : node.kind}))}} label={`${scene.name} 편집 미리보기`}/><p>{scene.name} · {node?.text || '선택한 요소'}</p></>}
          selectionKey={node?.id ?? null}
          onClearSelection={() => setSelected('')}
          footer={filmstrip}
          layers={
            <>
              <div className={`${p.panelHeading} ${p.layersHeading}`}>
                <WorkspaceGlyph name="layers" />
                <h3>레이어 (위쪽이 앞)</h3>
                <span className={p.countBadge} aria-label={`${scene.nodes.length}개 요소`}>
                  {scene.nodes.length}
                </span>
              </div>
              {!scene.nodes.length && (
                <p className={p.emptyLayers}>
                  텍스트나 이미지를 추가하면
                  <br />
                  이곳에서 순서를 관리할 수 있어요.
                </p>
              )}
              <ul className={`${s.layers} ${p.layerList}`}>
                {[...scene.nodes].reverse().map((n) => (
                  <li key={n.id}>
                    <button
                      className={n.id === selected ? s.selected : ''}
                      aria-label={`${n.locked ? '🔒 ' : ''}${n.hidden ? '숨김 · ' : ''}${n.text || n.kind}`}
                      aria-pressed={n.id === selected}
                      onClick={() => setSelected(n.id)}
                    >
                      <span className={p.layerGlyph}>
                        <WorkspaceGlyph
                          name={{ TEXT: 'text', IMAGE: 'image', RECT: 'rect', ELLIPSE: 'ellipse', MATERIAL: 'material' }[n.kind] as 'text' | 'image' | 'rect' | 'ellipse' | 'material'}
                          size={16}
                        />
                      </span>
                      <span className={p.layerName}>
                        {n.hidden ? '숨김 · ' : ''}
                        {n.text || n.kind}
                      </span>
                      {n.locked && <WorkspaceGlyph name="lock" size={14} />}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          }
          left={
            <>
              <div className={c.palette}>
                <span className={c.paletteEyebrow}>장면 꾸미기</span>
                <h3>{tool === 'text' ? '텍스트' : tool === 'background' ? '배경과 장면' : tool === 'materials' ? '자료와 연결' : '요소'}</h3>
                {tool !== 'background' && (
                  <>
                    <p>{tool === 'materials' && !cardMode ? '자료를 배치하고 역할·단서·조사 장소와 연결하세요.' : '캔버스에 추가한 요소를 선택해 내용과 모양을 바꿔 보세요.'}</p>
                    <div className={c.paletteGrid}>
                      {(['TEXT', 'IMAGE', 'RECT', 'ELLIPSE', 'MATERIAL'] as const)
                        .filter(
                          (kind) =>
                            (!cardMode || kind !== 'MATERIAL') &&
                            (tool !== 'text' || kind === 'TEXT') &&
                            (tool !== 'materials' || kind === 'MATERIAL' || kind === 'IMAGE' || (cardMode && kind === 'TEXT'))
                        )
                        .map((kind) => (
                          <button key={kind} disabled={mobile} onClick={() => add(kind)}>
                            <WorkspaceGlyph
                              size={26}
                              name={{ TEXT: 'text', IMAGE: 'image', RECT: 'rect', ELLIPSE: 'ellipse', MATERIAL: 'material' }[kind] as 'text' | 'image' | 'rect' | 'ellipse' | 'material'}
                            />
                            {{ TEXT: '텍스트', IMAGE: '이미지', RECT: '사각형', ELLIPSE: '타원', MATERIAL: '자료' }[kind]} 요소 만들기
                          </button>
                        ))}
                    </div>
                  </>
                )}
              </div>
              <details ref={settings} className={c.sceneSettings} open={tool === 'background' || cardMode || undefined}>
                <summary>{cardMode ? '카드 면 설정' : '장면 설정'}</summary>
                <div className={p.panelHeading}>
                  <WorkspaceGlyph name="settings" />
                  <h3>{cardMode ? '카드 면 설정' : '장면 설정'}</h3>
                </div>
                {!cardMode && (
                  <>
                    <label data-field-path={`${fieldBase}.name`}>
                      장면 이름
                      <input value={scene.name} onChange={(e) => update({ ...scene, name: e.target.value })} />
                    </label>
                    <label data-field-path={`${fieldBase}.kind`}>
                      장면 종류
                      <select
                        disabled={mobile}
                        value={scene.kind ?? 'SCENE'}
                        onChange={(e) => update({ ...scene, kind: e.target.value as Scene['kind'], width: e.target.value === 'SCENE' ? 1280 : 720, height: e.target.value === 'SCENE' ? 720 : 1080 })}
                      >
                        <option value="SCENE">공용 장면</option>
                        <option value="ROLE">역할별 자료</option>
                        <option value="CLUE">단서 자료</option>
                      </select>
                    </label>
                    {scene.kind !== 'SCENE' && (
                      <label data-field-path={`${fieldBase}.referenceId`}>
                        연결할 역할·단서
                        <select disabled={mobile} value={scene.referenceId ?? ''} onChange={(e) => update({ ...scene, referenceId: e.target.value })}>
                          <option value="">선택하세요</option>
                          {((document?.[scene.kind === 'ROLE' ? 'roles' : 'clues'] ?? []) as Data[]).map((item) => (
                            <option key={String(item.id)} value={String(item.id)}>
                              {String(item.name ?? item.title ?? item.id)}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    <Field
                      name="phaseIds"
                      path={`presentation.scenes.${scenes.indexOf(scene)}.phaseIds`}
                      value={scene.phaseIds ?? []}
                      onChange={(value) => update({ ...scene, phaseIds: value as string[] })}
                    />
                  </>
                )}
                <label data-field-path={`${fieldBase}.background`}>
                  배경
                  <input type="color" value={scene.background} onChange={(e) => update({ ...scene, background: e.target.value })} />
                </label>
                {!cardMode && (
                  <label data-field-path={`${fieldBase}.bgmAssetId`}>
                    배경음
                    <select value={scene.bgmAssetId ?? ''} onChange={(e) => update({ ...scene, bgmAssetId: e.target.value || null })}>
                      <option value="">없음</option>
                      {assets
                        .filter((a) => a.mimeType.startsWith('audio/'))
                        .map((a) => (
                          <option value={a.id} key={a.id}>
                            {a.name}
                          </option>
                        ))}
                    </select>
                  </label>
                )}
                {!cardMode && scene.bgmAssetId && <audio controls preload="none" src={assetUrl(scene.bgmAssetId)} aria-label="장면 배경음 미리듣기" style={{width:"100%"}}/>}
                {(['width', 'height'] as const).map((key) => (
                  <label key={key} data-field-path={`${sizeBase}.${key}`}>
                    {cardMode ? (key === 'width' ? '디자인 너비' : '디자인 높이') : key === 'width' ? '장면 너비' : '장면 높이'}
                    <input disabled={mobile} type="number" min={100} max={4000} value={scene[key]} onChange={(e) => update({ ...scene, [key]: Number(e.target.value) })} />
                  </label>
                ))}
              </details>
            </>
          }
          center={
            <>
              <div className={`${p.toolbox} ${c.quickTools}`} role="toolbar" aria-label="캔버스 도구">
                <span className={p.toolboxLabel}>선택해서 바로 편집</span>
                <div className={p.toolItems}>
                  {(['TEXT', 'IMAGE', 'RECT', 'ELLIPSE', 'MATERIAL'] as const)
                    .filter((kind) => !cardMode || kind !== 'MATERIAL')
                    .map((kind, i) => (
                      <button disabled={mobile} key={kind} title={`${['텍스트', '이미지', '사각형', '타원', '자료'][i]} 추가`} onClick={() => add(kind)}>
                        <WorkspaceGlyph name={['text', 'image', 'rect', 'ellipse', 'material'][i] as 'text' | 'image' | 'rect' | 'ellipse' | 'material'} />
                        <span>{['텍스트', '이미지', '사각형', '타원', '자료'][i]} 추가</span>
                      </button>
                    ))}
                </div>
              </div>
              <SceneCanvas key={scene.id} scene={scene} selected={selected} onSelect={setSelected} onChange={update} />
              <p className={p.canvasHelp}>
                <span>텍스트를 두 번 누르거나 속성에서 내용을 편집하세요.</span>
                <span>
                  <kbd>Enter</kbd> 적용 <kbd>Shift + Enter</kbd> 줄바꿈 <kbd>Esc</kbd> 취소
                </span>
              </p>
            </>
          }
          right={
            <>
              <div className={p.panelHeading}>
                <WorkspaceGlyph name="settings" />
                <h3>선택한 요소</h3>
                {node && <span className={p.typeBadge}>{{ TEXT: '텍스트', IMAGE: '이미지', RECT: '사각형', ELLIPSE: '타원', MATERIAL: '자료' }[node.kind]}</span>}
              </div>
              {node ? (
                <>
                  <details open className={d.inspectorSection}><summary>내용</summary>
                  {(node.kind === 'TEXT' || node.kind === 'MATERIAL') && (
                    <label data-field-path={`${nodeBase}.text`}>
                      내용
                      <textarea aria-label="내용" value={node.text} onChange={(e) => updateNode({ text: e.target.value })} />
                    </label>
                  )}
                  </details>
                  <details open className={d.inspectorSection}><summary>배치</summary>
                  <div className={s.geometryFields}>
                    {(['x', 'y', 'width', 'height', 'rotation', 'fontSize'] as const)
                      .filter((key) => key !== 'fontSize' || node.kind === 'TEXT' || node.kind === 'MATERIAL')
                      .map((key) => (
                        <label key={key} data-field-path={`${nodeBase}.${key}`}>
                          {{ x: '가로 위치', y: '세로 위치', width: '너비', height: '높이', rotation: '회전', fontSize: '글자 크기' }[key]}
                          <input disabled={mobile} type="number" value={node[key]} onChange={(e) => updateNode({ [key]: Number(e.target.value) })} />
                        </label>
                      ))}
                  </div>
                  </details>
                  <details open className={d.inspectorSection}><summary>모양</summary>
                  <label data-field-path={`${nodeBase}.fill`}>
                    색상
                    <input type="color" value={node.fill} onChange={(e) => updateNode({ fill: e.target.value })} />
                  </label>
                  {node.kind === 'IMAGE' && (
                    <label data-field-path={`${nodeBase}.assetId`}>
                      이미지
                      <select value={node.assetId ?? ''} onChange={(e) => updateNode({ assetId: e.target.value || null })}>
                        <option value="">없음</option>
                        {assets
                          .filter((a) => a.mimeType.startsWith('image/'))
                          .map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))}
                      </select>
                    </label>
                  )}
                  </details>
                  {!cardMode && (
                    <details open className={d.inspectorSection}><summary>연결</summary>
                      <label data-field-path={`${nodeBase}.bindingType`}>
                        자료 연결
                        <select disabled={mobile} value={node.bindingType} onChange={(e) => updateNode({ bindingType: e.target.value as CanvasNode['bindingType'], bindingId: '' })}>
                          {['NONE', 'ROLE', 'CLUE', 'TARGET'].map((v) => (
                            <option key={v} value={v}>
                              {{ NONE: '연결 없음', ROLE: '역할 자료', CLUE: '단서', TARGET: '조사 장소' }[v]}
                            </option>
                          ))}
                        </select>
                      </label>
                      {node.bindingType !== 'NONE' && (
                        <label data-field-path={`${nodeBase}.bindingId`}>
                          연결할 자료
                          <select disabled={mobile} value={node.bindingId} onChange={(e) => updateNode({ bindingId: e.target.value })}>
                            <option value="">선택하세요</option>
                            {((document?.[{ ROLE: 'roles', CLUE: 'clues', TARGET: 'targets' }[node.bindingType as 'ROLE' | 'CLUE' | 'TARGET']] ?? []) as Data[]).map((item) => (
                              <option key={String(item.id)} value={String(item.id)}>
                                {String(item.name ?? item.title ?? item.id)}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}
                      {node.bindingType !== 'NONE' && node.bindingId && <button onClick={() => {const group = {ROLE:'roles',CLUE:'clues',TARGET:'targets'}[node.bindingType as 'ROLE'|'CLUE'|'TARGET']; navigateEditor(`${group}.${((document?.[group] ?? []) as Data[]).findIndex(item => item.id === node.bindingId)}`);}}>연결 자료로 이동 →</button>}
                    </details>
                  )}
                  <details open className={d.inspectorSection}><summary>정렬과 레이어</summary>
                  <label className={s.checkLabel}>
                    <input disabled={mobile} type="checkbox" checked={node.locked} onChange={(e) => updateNode({ locked: e.target.checked })} />
                    잠금
                  </label>
                  <label className={s.checkLabel}>
                    <input disabled={mobile} type="checkbox" checked={node.hidden} onChange={(e) => updateNode({ hidden: e.target.checked })} />
                    편집 화면에서 숨김
                  </label>
                  <h4 className={p.propertyHeading}>{cardMode ? '카드 면 기준 정렬' : '장면 기준 정렬'}</h4>
                  <div className={`${s.row} ${p.alignmentTools}`}>
                    <button disabled={mobile} onClick={() => updateNode({ x: 0 })}>
                      왼쪽
                    </button>
                    <button disabled={mobile} onClick={() => updateNode({ x: (scene.width - node.width) / 2 })}>
                      가로 가운데
                    </button>
                    <button disabled={mobile} onClick={() => updateNode({ x: scene.width - node.width })}>
                      오른쪽
                    </button>
                    <button disabled={mobile} onClick={() => updateNode({ y: 0 })}>
                      위쪽
                    </button>
                    <button disabled={mobile} onClick={() => updateNode({ y: (scene.height - node.height) / 2 })}>
                      세로 가운데
                    </button>
                    <button disabled={mobile} onClick={() => updateNode({ y: scene.height - node.height })}>
                      아래쪽
                    </button>
                  </div>
                  </details>
                  <p className={s.subtle}>
                    {cardMode ? '숨김은 편집용입니다. 카드 앞뒷면의 공개는 플레이 중 서버가 정합니다.' : '숨김은 개인 자료 권한을 대신하지 않습니다. 개인 자료는 종류와 자료 연결로 지정하세요.'}
                  </p>
                  <div className={`${s.row} ${p.layerActions}`}>
                    <button
                      disabled={mobile}
                      onClick={() => {
                        const copy = { ...node, id: `node-${crypto.randomUUID().slice(0, 8)}`, x: node.x + 20, y: node.y + 20 };
                        update({ ...scene, nodes: [...scene.nodes, copy] });
                        setSelected(copy.id);
                      }}
                    >
                      <WorkspaceGlyph name="copy" size={16} />
                      복제
                    </button>
                    <button disabled={mobile} onClick={() => update({ ...scene, nodes: [...scene.nodes.filter((n) => n.id !== node.id), node] })}>
                      맨 앞으로
                    </button>
                    <button disabled={mobile} onClick={() => update({ ...scene, nodes: [node, ...scene.nodes.filter((n) => n.id !== node.id)] })}>
                      맨 뒤로
                    </button>
                    <button
                      className={p.dangerButton}
                      disabled={mobile}
                      onClick={() => {
                        update({ ...scene, nodes: scene.nodes.filter((n) => n.id !== node.id) });
                        setSelected('');
                      }}
                    >
                      <WorkspaceGlyph name="trash" size={16} />
                      삭제
                    </button>
                  </div>
                </>
              ) : (
                <div className={p.emptyInspector}>
                  <WorkspaceGlyph name="settings" size={28} />
                  <strong>요소를 선택하세요.</strong>
                  <p>
                    캔버스나 레이어에서 고르면
                    <br />
                    내용과 모양을 바꿀 수 있어요.
                  </p>
                </div>
              )}
            </>
          }
        />
      ) : (
        <p>장면을 추가해 배경·텍스트·이미지를 배치하세요.</p>
      )}
    </div>
  );
}
