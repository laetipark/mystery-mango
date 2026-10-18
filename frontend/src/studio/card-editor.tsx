import { SceneEditor } from './canvas';
import { referenceLabel, referenceUses, useMobileEditor, WorkspaceGlyph } from './workspace';
import type { Asset, CardLayout, CardLayoutNode, CanvasNode, Document, Scene } from './types';
import s from './studio.module.scss';
import p from './workspace-polish.module.scss';
import c from './contextual-workspace.module.scss';
import { useEditorState, navigateEditor } from './editor-memory';
import d from './editor-details.module.scss';
import { Icon } from '~/components/icon';
export function newCardLayout(name = '새 카드 디자인'): CardLayout {
  return {
    id: `layout-${crypto.randomUUID().slice(0, 8)}`,
    name,
    width: 600,
    height: 850,
    front: {
      background: '#fffaf0',
      nodes: [
        { id: `node-${crypto.randomUUID().slice(0, 8)}`, kind: 'TEXT', x: 48, y: 64, width: 504, height: 150, rotation: 0, fill: '#264d3e', text: name, fontSize: 40, locked: false, hidden: false }
      ]
    },
    back: {
      background: '#264d3e',
      nodes: [{ id: `node-${crypto.randomUUID().slice(0, 8)}`, kind: 'RECT', x: 40, y: 40, width: 520, height: 770, rotation: 0, fill: '#436a55', locked: false, hidden: false }]
    }
  };
}
function sceneFor(layout: CardLayout, side: 'front' | 'back'): Scene {
  return {
    id: `${layout.id}-${side}`,
    name: side === 'front' ? '앞면' : '뒷면',
    kind: 'SCENE',
    width: layout.width,
    height: layout.height,
    background: layout[side].background,
    bgmAssetId: null,
    phaseIds: [],
    nodes: layout[side].nodes.map((node) => ({
      ...node,
      text: node.text ?? '',
      fill: node.fill ?? '#264d3e',
      fontSize: node.fontSize ?? 24,
      assetId: node.assetId ?? null,
      locked: node.locked ?? false,
      hidden: node.hidden ?? false,
      bindingType: 'NONE',
      bindingId: ''
    }))
  };
}
function visual(node: CanvasNode): CardLayoutNode {
  return {
    id: node.id,
    kind: node.kind as CardLayoutNode['kind'],
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    rotation: node.rotation,
    fill: node.fill,
    text: node.text,
    fontSize: node.fontSize,
    assetId: node.assetId,
    locked: node.locked,
    hidden: node.hidden
  };
}
export function CardLayoutEditor({
  document,
  assets,
  selectedId,
  side,
  onSelect,
  onSide,
  patch,
  origin,
  onReturn
}: {
  origin?: string;
  onReturn?: () => void;
  document: Document;
  assets: Asset[];
  selectedId: string;
  side: 'front' | 'back';
  onSelect: (id: string) => void;
  onSide: (side: 'front' | 'back') => void;
  patch: (fn: (d: Document) => Document) => void;
}) {
  const mobile = useMobileEditor();
  const [search, setSearch] = useEditorState('layout-search', '');
  const layouts = document.presentation.cardLayouts ?? [],
    layout = layouts.find((item) => item.id === selectedId) ?? layouts[0];
  const scenes = layout ? [sceneFor(layout, 'front'), sceneFor(layout, 'back')] : [];
  const matching = layouts.filter((item) => item.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  const selectedIndex = matching.findIndex((item) => item.id === layout?.id);
  const used = layout ? referenceUses(document, layout.id, `presentation.cardLayouts.${layouts.indexOf(layout)}`) : [];
  return (
    <div className={`${s.cardDesigner} ${p.cardDesigner} ${c.cardDesigner} ${d.cardEditor}`}>
      <nav className={d.cardPath} aria-label="카드 편집 경로">
        <button onClick={onReturn}>← 게임판으로</button>
        <div className={d.cardBreadcrumb}>
          {origin && (
            <>
              <span className={d.cardOrigin} title={referenceLabel(document, origin)}>
                {referenceLabel(document, origin)}
              </span>
              <span aria-hidden="true">›</span>
            </>
          )}
          <strong title={layout?.name}>{layout?.name ?? '디자인 목록'}</strong>
          <span className={d.cardPathFace}>› {side === 'front' ? '앞면' : '뒷면'}</span>
        </div>
      </nav>
      <details className={d.cardNavigation} open={!mobile || undefined}>
        <summary>디자인 목록과 이름</summary>
        <div className={d.cardNavigationBody}>
          <label>
            디자인 검색
            <input type="search" aria-label="카드 디자인 검색" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="이름으로 검색" />
          </label>
          <label>
            편집할 카드 디자인
            <select value={layout?.id ?? ''} onChange={(e) => onSelect(e.target.value)}>
              <option value="" disabled>
                디자인을 추가하세요
              </option>
              {[...(layout && !matching.includes(layout) ? [layout] : []), ...matching].map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          {layout && (
            <label data-field-path={`presentation.cardLayouts.${layouts.indexOf(layout)}.name`}>
              카드 디자인 이름
              <input
                value={layout.name}
                onChange={(e) =>
                  patch((d) => ({
                    ...d,
                    presentation: { ...d.presentation, cardLayouts: (d.presentation.cardLayouts ?? []).map((item) => (item.id === layout.id ? { ...item, name: e.target.value } : item)) }
                  }))
                }
              />
            </label>
          )}
          <div className={d.cardNavigationActions}>
            <div className={d.cardPagination}>
              <span>{matching.length}개</span>
              <button aria-label="이전 디자인" title="이전 디자인" disabled={selectedIndex <= 0} onClick={() => onSelect(matching[selectedIndex - 1].id)}>
                <span aria-hidden="true">‹</span>
              </button>
              <button aria-label="다음 디자인" title="다음 디자인" disabled={selectedIndex < 0 || selectedIndex >= matching.length - 1} onClick={() => onSelect(matching[selectedIndex + 1].id)}>
                <span aria-hidden="true">›</span>
              </button>
            </div>
            <button
              className={d.cardAdd}
              disabled={mobile}
              onClick={() => {
                const next = newCardLayout();
                patch((d) => ({ ...d, presentation: { ...d.presentation, cardLayouts: [...(d.presentation.cardLayouts ?? []), next] } }));
                onSelect(next.id);
              }}
            >
              <Icon name="create" size={18} />
              카드 디자인 추가
            </button>
          </div>
        </div>
      </details>
      {layout ? (
        <>
          <div className={p.cardMeta}>
            <span>
              <WorkspaceGlyph name="front" size={16} />
              디자인 크기 {layout.width} × {layout.height}
            </span>
            <span>플레이 카드 120 × 170</span>
            <span>덱에서는 공통 뒷면을 사용합니다.</span>
          </div>
          <SceneEditor
            cardMode
            document={document}
            scenes={scenes}
            assets={assets}
            sceneId={`${layout.id}-${side}`}
            onSceneSelect={(id) => onSide(id.endsWith('-back') ? 'back' : 'front')}
            onChange={(next) => {
              const changed = next.find((scene, index) => JSON.stringify(scene) !== JSON.stringify(scenes[index]));
              if (!changed) return;
              const face = changed.id.endsWith('-back') ? 'back' : 'front';
              patch((d) => ({
                ...d,
                presentation: {
                  ...d.presentation,
                  cardLayouts: (d.presentation.cardLayouts ?? []).map((item) =>
                    item.id === layout.id
                      ? {
                          ...item,
                          width: changed.width,
                          height: changed.height,
                          [face]: { background: changed.background, nodes: changed.nodes.filter((node) => node.kind !== 'MATERIAL').map(visual) }
                        }
                      : item
                  )
                }
              }));
            }}
          />
          {used.length > 0 && (
            <div className={`${d.links} ${d.cardLinks}`} aria-label="공통 디자인을 사용하는 구성물">
              {used.map((item) => (
                <button key={item} title={referenceLabel(document, item)} onClick={() => navigateEditor(item)}>
                  {referenceLabel(document, item)} →
                </button>
              ))}
            </div>
          )}
          <div className={p.cardFooter}>
            <p>{used.length ? `이 디자인을 사용하는 곳 ${used.length}개 · 연결을 해제한 뒤 삭제할 수 있습니다.` : '테이블 구성물이나 덱 카드의 속성에서 이 디자인을 연결하세요.'}</p>
            <button
              className={p.dangerButton}
              disabled={mobile || used.length > 0}
              onClick={() => patch((d) => ({ ...d, presentation: { ...d.presentation, cardLayouts: (d.presentation.cardLayouts ?? []).filter((item) => item.id !== layout.id) } }))}
            >
              <WorkspaceGlyph name="trash" size={16} />
              카드 디자인 삭제
            </button>
          </div>
        </>
      ) : (
        <div className={`${s.emptyWorks} ${p.emptyCardDesign}`}>
          <div className={p.emptyCards} aria-hidden="true">
            <WorkspaceGlyph name="back" size={46} />
            <WorkspaceGlyph name="front" size={46} />
          </div>
          <h3>아직 카드 디자인이 없습니다</h3>
          <p>텍스트·이미지·도형으로 앞면과 뒷면을 만들 수 있습니다.</p>
        </div>
      )}
    </div>
  );
}
