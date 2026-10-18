import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Group, Rect, Text, Transformer } from 'react-konva';
import type Konva from 'konva';
import { AuthorFormContext, Field } from './forms';
import { CardVisual } from './card-face';
import { WorkspacePanels, useMobileEditor } from './workspace';
import type { Asset, CardDesign, Data, Document, TableDefinition, TableObjectDefinition, Value } from './types';
import s from './studio.module.scss';
import { useEditorState } from './editor-memory';
import d from './editor-details.module.scss';
const EMPTY_TABLE: TableDefinition = { objects: [], decks: [] };
const names = { CARD: '카드', TOKEN: '말', DICE: '주사위', COUNTER: '카운터' };
const id = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
export function TableEditor({
  document,
  assets,
  patch,
  openLayout
}: {
  document: Document;
  assets: Asset[];
  patch: (fn: (d: Document) => Document) => void;
  openLayout: (id?: string, target?: { kind: 'object' | 'card' | 'deck'; id: string; deckId?: string }) => void;
}) {
  const mobile = useMobileEditor();
  const [transient, setTransient] = useState<Record<string, { x: number; y: number; width: number; height: number }>>({});
  const [selected, setSelected] = useEditorState('table-selected', ''),
    [selectedCard, setSelectedCard] = useEditorState('table-selected-card', '');
  const [scale, setScale] = useState(1),
    [zoom, setZoom] = useEditorState('table-zoom', 0);
  const [search, setSearch] = useEditorState('table-search', '');
  const [filter, setFilter] = useEditorState('table-filter', 'ALL');
  const [cardSearch, setCardSearch] = useEditorState('deck-card-search', '');
  const [snap, setSnap] = useEditorState('snap-grid', false);
  const quantize = (value: number) => Math.round(value / (snap ? 10 : 1)) * (snap ? 10 : 1);
  const surface = useRef<HTMLDivElement>(null),
    stage = useRef<Konva.Stage>(null),
    transformer = useRef<Konva.Transformer>(null);
  const table = document.tabletop ?? EMPTY_TABLE;
  const object = table.objects.find((item) => item.id === selected),
    deck = table.decks.find((item) => item.id === selected);
  const card = deck?.cards.find((item) => item.id === selectedCard);
  useEffect(() => {
    const element = surface.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setScale(Math.min(1, element.clientWidth / 1000)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const selectedPiece = selected && [...table.objects, ...table.decks].some((item) => item.id === selected);
    const node = selectedPiece && !mobile ? stage.current?.findOne((candidate: Konva.Node) => candidate.id() === selected) : undefined;
    transformer.current?.nodes(node ? [node] : []);
  }, [selected, table, mobile]);
  useEffect(() => {
    function focus(event: Event) {
      const path = (event as CustomEvent<string>).detail;
      if (!path.startsWith('tabletop')) return;
      const parts = path.split('.');
      const item = parts[1] === 'objects' ? table.objects[Number(parts[2])] : parts[1] === 'decks' ? table.decks[Number(parts[2])] : undefined;
      setSelected(item?.id ?? '');
      setSelectedCard(item && 'cards' in item && parts[3] === 'cards' ? item.cards[Number(parts[4])]?.id ?? '' : '');
      window.setTimeout(() => {
        const fields = Array.from(window.document.querySelectorAll<HTMLElement>('[data-field-path]'));
        fields.find(element => element.dataset.fieldPath?.startsWith(path) && !element.closest('[hidden]'))?.querySelector<HTMLElement>('input,select,textarea,button')?.focus({preventScroll:true});
      }, 30);
    }
    window.addEventListener('studio-focus-field', focus);
    return () => window.removeEventListener('studio-focus-field', focus);
  }, [table, setSelected, setSelectedCard]);
  const displayScale = (!mobile && zoom) || scale;
  function design(layoutId: string | null | undefined, side: 'front' | 'back'): CardDesign | undefined {
    const layout = document.presentation.cardLayouts?.find((item) => item.id === layoutId);
    return layout ? { width: layout.width, height: layout.height, ...layout[side] } : undefined;
  }
  function duplicate() {
    if (!piece) return;
    const copy = structuredClone(piece);
    copy.id = id(object ? 'piece' : 'deck');
    copy.name = `${copy.name} 복사`;
    copy.x += 24;
    copy.y += 24;
    if ('cards' in copy) copy.cards = copy.cards.map((card) => ({ ...card, id: id('card') }));
    change((table) => ('cards' in copy ? { ...table, decks: [...table.decks, copy] } : { ...table, objects: [...table.objects, copy] }));
    setSelected(copy.id);
    setSelectedCard('');
  }
  function reorderCard(cardId: string, direction: number) {
    if (!deck) return;
    change((table) => ({
      ...table,
      decks: table.decks.map((item) => {
        if (item.id !== deck.id) return item;
        const cards = [...item.cards],
          index = cards.findIndex((card) => card.id === cardId);
        if (index + direction < 0 || index + direction >= cards.length) return item;
        [cards[index], cards[index + direction]] = [cards[index + direction], cards[index]];
        return { ...item, cards };
      })
    }));
  }
  function change(fn: (t: TableDefinition) => TableDefinition) {
    patch((d) => ({ ...d, tabletop: fn(d.tabletop ?? { objects: [], decks: [] }) }));
  }
  function move(key: string, delta: Partial<TableObjectDefinition>) {
    change((t) => ({ ...t, objects: t.objects.map((o) => (o.id === key ? { ...o, ...delta } : o)), decks: t.decks.map((o) => (o.id === key ? { ...o, x: delta.x ?? o.x, y: delta.y ?? o.y } : o)) }));
  }
  function add(kind: TableObjectDefinition['kind']) {
    const piece: TableObjectDefinition = {
      id: id('piece'),
      kind,
      name: `새 ${names[kind]}`,
      text: '',
      assetId: null,
      backAssetId: null,
      ...(kind === 'CARD' ? { layoutId: null } : {}),
      x: 80,
      y: 80,
      width: kind === 'CARD' ? 120 : 80,
      height: kind === 'CARD' ? 170 : 80,
      locked: false,
      faceUp: kind !== 'CARD',
      sides: 6,
      value: kind === 'DICE' ? 1 : 0
    };
    change((t) => ({ ...t, objects: [...t.objects, piece] }));
    setSelected(piece.id);
  }
  function addDeck() {
    const key = id('deck');
    change((t) => ({
      ...t,
      decks: [...t.decks, { id: key, name: '새 카드 덱', x: 380, y: 100, backAssetId: null, backLayoutId: null, cards: [{ id: id('card'), name: '첫 카드', text: '', assetId: null, layoutId: null }] }]
    }));
    setSelected(key);
    setSelectedCard('');
  }
  const piece = object ?? deck;
  const matches = (name: string) => name.toLocaleLowerCase().includes(search.toLocaleLowerCase().trim());
  const objects = table.objects.filter(item => (filter === 'ALL' || filter === item.kind) && matches(item.name));
  const decks = table.decks.filter(item => (filter === 'ALL' || filter === 'DECK') && (matches(item.name) || item.cards.some(card => matches(card.name))));
  const choices = [...objects, ...decks];
  const choiceIndex = choices.findIndex(item => item.id === selected);
  const matchingCards = deck?.cards.filter(item => item.name.toLocaleLowerCase().includes(cardSearch.toLocaleLowerCase().trim())) ?? [];
  const cardIndex = matchingCards.findIndex(item => item.id === card?.id);

  return (
    <AuthorFormContext document={document} assets={assets}>
      <WorkspacePanels memoryKey="table"
        preview={piece && <><div style={{maxWidth:120,margin:'auto'}}><CardVisual design={design(card?.layoutId ?? (object ? object.layoutId : deck?.backLayoutId), object?.faceUp || card ? 'front' : 'back')} name={card?.name ?? piece.name} text={card?.text ?? object?.text} assetId={card?.assetId ?? object?.assetId ?? deck?.backAssetId}/></div><p>{card?.name ?? piece.name}</p></>}
        selectionKey={piece?.id ?? null}
        onClearSelection={() => {
          setSelected('');
          setSelectedCard('');
        }}
        left={
          <>
            <span className={s.eyebrow}>테이블 구성</span>
            <h3>실제 플레이 구성물</h3>
            <div className={s.addGrid}>
              {Object.entries(names).map(([kind, name]) => (
                <button disabled={mobile} key={kind} onClick={() => add(kind as TableObjectDefinition['kind'])}>
                  {name} 추가
                </button>
              ))}
              <button disabled={mobile} onClick={addDeck}>
                카드 덱 추가
              </button>
            </div>
            <p className={s.subtle}>개인 카드는 플레이 중 각 자리의 손패로 전달합니다.</p>
            <label>구성물 검색<input type="search" aria-label="구성물 검색" placeholder="카드·덱·말 이름" value={search} onChange={event => setSearch(event.target.value)}/></label>
            <label>구성물 종류<select aria-label="구성물 종류 필터" value={filter} onChange={event => setFilter(event.target.value)}><option value="ALL">전체</option>{Object.entries(names).map(([kind,name]) => <option value={kind} key={kind}>{name}</option>)}<option value="DECK">카드 덱</option></select></label>
            {!choices.length && <p>검색과 일치하는 구성물이 없습니다.</p>}
            <h4>공용 구성물</h4>
            <div className={s.structureSection}>
              {objects.map((item) => (
                <button
                  key={item.id}
                  className={item.id === selected ? s.selected : ''}
                  onClick={() => {
                    setSelected(item.id);
                    setSelectedCard('');
                  }}
                >
                  {names[item.kind]} · {item.name}
                </button>
              ))}
            </div>
            <h4>카드 덱</h4>
            <div className={s.structureSection}>
              {decks.map((item) => (
                <button
                  key={item.id}
                  className={item.id === selected ? s.selected : ''}
                  onClick={() => {
                    setSelected(item.id);
                    setSelectedCard('');
                  }}
                >
                  {item.name} · {item.cards.length}장
                </button>
              ))}
            </div>
          </>
        }
        center={
          <div className={s.tableWorkspace}>
            {!mobile && <label className={s.checkLabel}><input type="checkbox" checked={snap} onChange={event => setSnap(event.target.checked)}/> 10px 격자 맞춤</label>}
            <div className={s.sectionHeading}>
              <div>
                <span className={s.eyebrow}>테이블 배치</span>
                <h2>플레이할 자리를 구성하세요</h2>
              </div>
              <label>
                보기 배율
                <select disabled={mobile} value={mobile ? 0 : zoom} onChange={(e) => setZoom(Number(e.target.value))}>
                  <option value={0}>화면에 맞추기</option>
                  <option value={0.5}>50%</option>
                  <option value={0.75}>75%</option>
                  <option value={1}>100%</option>
                </select>
              </label>
            </div>
            <p className={s.mobileNotice}>모바일에서는 구성물 선택과 문구·이미지 교체를 권장합니다. 정교한 배치는 PC에서 편집하세요.</p>
            <div ref={surface} tabIndex={mobile ? undefined : 0} role="group" aria-label="게임판 배치: 방향키로 이동"
              onKeyDown={event => {
                if (mobile || !piece || ('locked' in piece && piece.locked) || event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229 || event.altKey || event.ctrlKey || event.metaKey || (event.target as HTMLElement).closest('input,select,textarea,[contenteditable="true"]') || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
                event.preventDefault(); const step = event.shiftKey ? 10 : 1;
                move(piece.id,{x:piece.x + (event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0), y:piece.y + (event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0)});
              }} className={s.tableCanvas} data-testid="author-tabletop-surface">
              <div className={s.tableStage} style={{ width: 1000 * displayScale, height: 650 * displayScale }}>
                <Stage
                  ref={stage}
                  onMouseDown={(event) => {
                    if (!mobile) surface.current?.focus({preventScroll:true});
                    if (event.target === event.target.getStage()) {
                      setSelected('');
                      setSelectedCard('');
                    }
                  }}
                  onTouchStart={(event) => {
                    if (event.target === event.target.getStage()) {
                      setSelected('');
                      setSelectedCard('');
                    }
                  }}
                  width={1000 * displayScale}
                  height={650 * displayScale}
                  scaleX={displayScale}
                  scaleY={displayScale}
                >
                  <Layer>
                    <Rect width={1000} height={650} fill="#e3e9d8" listening={false} />
                    {[...table.objects, ...table.decks].map((item) => {
                      const isDeck = 'cards' in item;
                      const width = isDeck ? 120 : item.width,
                        height = isDeck ? 170 : item.height;
                      return (
                        <Group
                          key={item.id}
                          id={item.id}
                          x={item.x}
                          y={item.y}
                          width={width}
                          height={height}
                          draggable={!mobile}
                          onClick={() => {
                            setSelected(item.id);
                            setSelectedCard('');
                          }}
                          onTap={() => {
                            setSelected(item.id);
                            setSelectedCard('');
                          }}
                          onDragMove={(e) => setTransient({ [item.id]: { x: e.target.x(), y: e.target.y(), width, height } })}
                          onDragEnd={(e) => {
                            move(item.id, { x: quantize(e.target.x()), y: quantize(e.target.y()) });
                            setTransient({});
                          }}
                          onTransform={(e) => setTransient({ [item.id]: { x: e.target.x(), y: e.target.y(), width: width * e.target.scaleX(), height: height * e.target.scaleY() } })}
                          onTransformEnd={(e) => {
                            const node = e.target;
                            const w = Math.max(20, width * node.scaleX()),
                              h = Math.max(20, height * node.scaleY());
                            node.scaleX(1);
                            node.scaleY(1);
                            move(item.id, { x: Math.round(node.x()), y: Math.round(node.y()), width: Math.round(w), height: Math.round(h) });
                            setTransient({});
                          }}
                        >
                          <Rect
                            width={width}
                            height={height}
                            fill={isDeck ? '#264d3e' : '#fffaf0'}
                            cornerRadius={8}
                            stroke={item.id === selected ? '#d09529' : '#9eae92'}
                            strokeWidth={item.id === selected ? 3 : 1}
                          />
                          {isDeck && <Rect x={5} y={5} width={width - 10} height={height - 10} stroke="#7f9b84" cornerRadius={6} />}
                          <Text x={8} y={12} width={width - 16} text={item.name} fill={isDeck ? '#fffaf0' : '#264d3e'} fontSize={16} align="center" />
                          <Text
                            x={8}
                            y={height / 2}
                            width={width - 16}
                            text={isDeck ? `${item.cards.length}장` : item.kind === 'DICE' || item.kind === 'COUNTER' ? String(item.value) : item.kind === 'CARD' ? '앞·뒷면 편집' : '●'}
                            fill={isDeck ? '#efb64d' : '#8e6b29'}
                            fontSize={isDeck || (!isDeck && item.kind === 'CARD') ? 14 : 25}
                            align="center"
                          />
                        </Group>
                      );
                    })}
                    {!mobile && <Transformer ref={transformer} rotateEnabled={false} resizeEnabled={!!object} keepRatio={false} flipEnabled={false} />}
                  </Layer>
                </Stage>
                <div className={s.tableOverlays} aria-hidden="true">
                  {[...table.objects, ...table.decks].map((item) => {
                    const isDeck = 'cards' in item;
                    if (!isDeck && item.kind !== 'CARD') return null;
                    const bounds = transient[item.id] ?? { x: item.x, y: item.y, width: isDeck ? 120 : item.width, height: isDeck ? 170 : item.height };
                    const face = design(isDeck ? item.backLayoutId : item.layoutId, isDeck || !item.faceUp ? 'back' : 'front');
                    return (
                      <div
                        key={item.id}
                        className={s.tableCardVisual}
                        style={{
                          left: bounds.x * displayScale + 2,
                          top: bounds.y * displayScale + 2,
                          width: Math.max(1, bounds.width * displayScale - 4),
                          height: Math.max(1, bounds.height * displayScale - 4)
                        }}
                      >
                        <CardVisual
                          design={face}
                          assetId={isDeck || !item.faceUp ? item.backAssetId : item.assetId}
                          name={isDeck ? item.name : item.faceUp ? item.name : '카드 뒷면'}
                          text={!isDeck && item.faceUp ? item.text : undefined}
                        />
                        {isDeck && <small className={s.deckCount}>{item.cards.length}장</small>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <p className={s.subtle}>1000 × 650 작업 영역 · 끌어서 이동하고 선택한 구성물의 모서리로 크기를 조절합니다. 덱과 덱 카드는 120 × 170 크기입니다.</p>
          </div>
        }
        right={
          <>
            <span className={s.eyebrow}>선택한 구성물</span>
            <div className={d.links}><button disabled={choiceIndex <= 0} onClick={() => {setSelected(choices[choiceIndex - 1].id);setSelectedCard('');}}>이전 구성물</button><button disabled={choiceIndex < 0 || choiceIndex >= choices.length - 1} onClick={() => {setSelected(choices[choiceIndex + 1].id);setSelectedCard('');}}>다음 구성물</button></div>
            <h3>{piece?.name ?? '구성물을 선택하세요'}</h3>
            {object && (
              <>
                <Field
                  name="object"
                  path={`tabletop.objects.${table.objects.indexOf(object)}`}
                  value={
                    {
                      ...Object.fromEntries(
                        Object.entries(object).filter(([key]) =>
                          key === 'sides'
                            ? object.kind === 'DICE'
                            : key === 'value'
                              ? ['DICE', 'COUNTER'].includes(object.kind)
                              : ['backAssetId', 'layoutId', 'faceUp'].includes(key)
                                ? object.kind === 'CARD'
                                : true
                        )
                      ),
                      ...(object.kind === 'CARD' ? { layoutId: object.layoutId ?? null } : {})
                    } as unknown as Data
                  }
                  onChange={(value) => change((t) => ({ ...t, objects: t.objects.map((o) => (o.id === object.id ? { ...o, ...(value as unknown as TableObjectDefinition) } : o)) }))}
                />
                {object.kind === 'CARD' && (
                  <button disabled={mobile && !object.layoutId} className={s.primaryAction} onClick={() => openLayout(object.layoutId ?? undefined, { kind: 'object', id: object.id })}>
                    카드 앞·뒷면 디자인
                  </button>
                )}
                <button disabled={mobile} onClick={() => change((t) => ({ ...t, objects: t.objects.filter((o) => o.id !== object.id) }))}>
                  구성물 삭제
                </button>
              </>
            )}
            {deck && (
              <>
                <Field
                  name="deck"
                  path={`tabletop.decks.${table.decks.indexOf(deck)}`}
                  value={{ ...Object.fromEntries(Object.entries(deck).filter(([key]) => key !== 'cards')), backLayoutId: deck.backLayoutId ?? null } as Data}
                  onChange={(value) => change((t) => ({ ...t, decks: t.decks.map((d) => (d.id === deck.id ? { ...d, ...(value as Data) } : d)) }))}
                />
                <button disabled={mobile && !deck.backLayoutId} onClick={() => openLayout(deck.backLayoutId ?? undefined, { kind: 'deck', id: deck.id })}>
                  덱 공통 뒷면 디자인
                </button>
                <h4>덱 안의 카드</h4>
                <label>덱 카드 검색<input type="search" aria-label="덱 카드 검색" value={cardSearch} onChange={event => setCardSearch(event.target.value)}/></label>
                <div className={d.links}><button disabled={cardIndex <= 0} onClick={() => setSelectedCard(matchingCards[cardIndex - 1].id)}>이전 카드</button><button disabled={cardIndex < 0 || cardIndex >= matchingCards.length - 1} onClick={() => setSelectedCard(matchingCards[cardIndex + 1].id)}>다음 카드</button><button onClick={() => setSelectedCard('')}>카드 목록</button></div>
                <select aria-label="편집할 덱 카드" value={card?.id ?? ''} onChange={(e) => setSelectedCard(e.target.value)}>
                  <option value="">카드를 선택하세요</option>
                  {[...(card && !matchingCards.includes(card) ? [card] : []),...matchingCards].map((item) => (
                    <option value={item.id} key={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <div className={s.deckCards}>
                  {matchingCards.map((item) => { const index = deck.cards.indexOf(item); return (
                    <div key={item.id} className={s.deckCardRow}>
                      <button className={item.id === selectedCard ? s.selected : ''} onClick={() => setSelectedCard(item.id)} aria-label={`덱 카드 ${index + 1} ${item.name}`}>
                        <span className={s.cardThumbnail}>
                          <CardVisual design={design(item.layoutId, 'front')} assetId={item.assetId} name={item.name} text={item.text} />
                        </span>
                        <span>
                          {index + 1}. {item.name}
                        </span>
                      </button>
                      <div>
                        <button disabled={mobile || index === 0} aria-label={`${item.name} 위로`} onClick={() => reorderCard(item.id, -1)}>
                          ↑
                        </button>
                        <button disabled={mobile || index === deck.cards.length - 1} aria-label={`${item.name} 아래로`} onClick={() => reorderCard(item.id, 1)}>
                          ↓
                        </button>
                      </div>
                    </div>
                  ); })}
                </div>
                <button
                  disabled={mobile}
                  onClick={() => {
                    const key = id('card');
                    change((t) => ({ ...t, decks: t.decks.map((d) => (d.id === deck.id ? { ...d, cards: [...d.cards, { id: key, name: '새 카드', text: '', assetId: null, layoutId: null }] } : d)) }));
                    setSelectedCard(key);
                  }}
                >
                  덱 카드 추가
                </button>
                {card && (
                  <>
                    <Field
                      name="card"
                      path={`tabletop.decks.${table.decks.indexOf(deck)}.cards.${deck.cards.indexOf(card)}`}
                      value={{ ...card, layoutId: card.layoutId ?? null } as unknown as Value}
                      onChange={(value) =>
                        change((t) => ({ ...t, decks: t.decks.map((d) => (d.id === deck.id ? { ...d, cards: d.cards.map((c) => (c.id === card.id ? (value as unknown as typeof card) : c)) } : d)) }))
                      }
                    />
                    <button disabled={mobile && !card.layoutId} className={s.primaryAction} onClick={() => openLayout(card.layoutId ?? undefined, { kind: 'card', id: card.id, deckId: deck.id })}>
                      이 카드 앞면 디자인
                    </button>
                    <p className={s.subtle}>뒷면은 덱 공통 디자인을 사용합니다.</p>
                    <button disabled={mobile} onClick={() => change((t) => ({ ...t, decks: t.decks.map((d) => (d.id === deck.id ? { ...d, cards: d.cards.filter((c) => c.id !== card.id) } : d)) }))}>
                      이 카드 삭제
                    </button>
                  </>
                )}
                <button disabled={mobile} onClick={() => change((t) => ({ ...t, decks: t.decks.filter((d) => d.id !== deck.id) }))}>
                  덱 삭제
                </button>
              </>
            )}
            {piece && (
              <button disabled={mobile} onClick={duplicate}>
                구성물 복제
              </button>
            )}
            {!piece && <p>왼쪽 목록이나 테이블에서 구성물을 선택하세요.</p>}
          </>
        }
      />
    </AuthorFormContext>
  );
}
