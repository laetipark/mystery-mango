import { useEffect, useId, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ErrorNotice, PageTitle, QueryState } from '~/components/ui';
import { useCommand } from '~/hooks/use-command';
import { command, get } from '~/services/api';
import { SceneCanvas } from './canvas';
import {
  assetUrl,
  gameTypeNames,
  isClassic,
  type ClassicState,
  type SceneState,
  type BoardSnapshot,
  type BoardObject,
  type TableState,
  type YachtState,
  type SendAction,
  type SandboxSnapshot,
  type Data
} from './types';
import { ClassicBoard } from './classic';
import { VoicePanel } from '~/pages/game';
import s from './studio.module.scss';
import p from './play.module.scss';
import { CardVisual } from './card-face';
import { SandboxViews } from './sandbox-views';
export function ScenePanel({ data, context, send }: { data: SceneState; context: { gameId?: string; sandboxId?: string }; send?: SendAction }) {
  const [materials, setMaterials] = useState(false);
  if (!data.scene && !data.layouts?.length) return null;
  return (
    <section className={`${p.panel} ${p.scenePanel}`}>
      {data.scene && (
        <>
          <div className={s.row}>
            <h2>{data.scene.name}</h2>
            {data.canChangeScene && send && (
              <label>
                장면 전환
                <select value={data.scene.id} onChange={(e) => void send('SCENE', { sceneId: e.target.value })}>
                  {data.availableScenes.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <SceneCanvas scene={data.scene} readonly context={context} />
          {data.scene.bgmAssetId && (
            <label>
              배경음 · 재생을 눌러 시작하세요
              <audio key={data.scene.bgmAssetId} controls loop preload="none" src={assetUrl(data.scene.bgmAssetId, context)} />
            </label>
          )}
        </>
      )}
      {data.layouts?.length > 0 && (
        <>
          <button aria-expanded={materials} onClick={() => setMaterials(!materials)}>
            내가 볼 수 있는 자료 {materials ? '접기' : '읽기'}
          </button>
          {materials &&
            data.layouts.map((layout) => (
              <article key={layout.id}>
                <h3>{layout.name}</h3>
                <SceneCanvas scene={layout} readonly context={context} />
                <div className={s.preview}>
                  {layout.nodes
                    .filter((n) => n.text)
                    .map((n) => (
                      <p key={n.id}>{n.text}</p>
                    ))}
                </div>
              </article>
            ))}
        </>
      )}
    </section>
  );
}

function PlayTabs({ id, label, options, value, onChange }: { id: string; label: string; options: [string, string][]; value: string; onChange: (value: string) => void }) {
  return (
    <div className={`${p.tabs} ${p.mobileTabs}`} role="tablist" aria-label={label}>
      {options.map(([key, title], index) => (
        <button
          key={key}
          id={`${id}-${key}-tab`}
          type="button"
          role="tab"
          aria-controls={`${id}-${key}-panel`}
          aria-selected={value === key}
          tabIndex={value === key ? 0 : -1}
          onClick={() => onChange(key)}
          onKeyDown={(event) => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : options.length - 1)) % options.length;
            onChange(options[next][0]);
            document.getElementById(`${id}-${options[next][0]}-tab`)?.focus();
          }}
        >
          {title}
        </button>
      ))}
    </div>
  );
}

function foreground(hex: string) {
  const rgb = hex
    .slice(1)
    .match(/../g)
    ?.map((v) => parseInt(v, 16)) ?? [24, 32, 43];
  return rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114 > 150 ? '#172333' : '#ffffff';
}
export const yachtCategories: Record<string, string> = {
  ONES: '1의 합',
  TWOS: '2의 합',
  THREES: '3의 합',
  FOURS: '4의 합',
  FIVES: '5의 합',
  SIXES: '6의 합',
  CHOICE: '초이스',
  FOUR_KIND: '포카드',
  FULL_HOUSE: '풀하우스',
  SMALL_STRAIGHT: '스몰 스트레이트',
  LARGE_STRAIGHT: '라지 스트레이트',
  YACHT: '요트'
};
export function YachtBoard({ state, seat, send, pending, names = {} }: { state: YachtState; seat: number; send: SendAction; pending: boolean; names?: Record<number, string> }) {
  const [scoreView, setScoreView] = useState('record');
  const tabs = useId();
  const ownScore = state.scores.find((player) => player.seat === seat);
  const ownTurn = state.turnSeat === seat && !state.finished;
  return (
    <section className={p.panel}>
      <span className={p.eyebrow}>다섯 주사위, 이번 차례의 선택</span>
      <h2>{state.finished ? '게임 종료' : `${names[state.turnSeat] ?? `${state.turnSeat + 1}번 자리`}의 차례`}</h2>
      {state.finished && <p role="status">{state.winners.length ? `우승: ${state.winners.map((n) => names[n] ?? `${n + 1}번 자리`).join(', ')}` : '승자를 정하지 않고 게임을 종료했습니다.'}</p>}
      <div className={p.yachtTop}>
        <div className={p.dice}>
          {state.dice.map((die, index) => (
            <button
              key={index}
              aria-label={`주사위 ${index + 1}: ${die}, ${state.held[index] ? '유지 중' : '유지 안 함'}`}
              aria-pressed={state.held[index]}
              disabled={!ownTurn || pending || state.rollsRemaining === 3 || state.rollsRemaining <= 0}
              className={state.held[index] ? p.selected : ''}
              style={{ background: state.appearance?.diceColor, color: state.appearance?.pipColor }}
              onClick={() => void send('HOLD', { indices: state.held.map((held, i) => ((i === index ? !held : held) ? i : -1)).filter((i) => i >= 0) })}
            >
              {die || '?'}
              <small>{state.held[index] ? '유지' : '누르면 유지'}</small>
            </button>
          ))}
        </div>
        <button className={`${p.primary} ${p.roll}`} disabled={!ownTurn || pending || state.rollsRemaining <= 0} onClick={() => void send('ROLL')}>
          주사위 굴리기 ({state.rollsRemaining}회 남음)
        </button>
        <p className={p.muted}>남길 주사위를 누른 뒤 다시 굴려 보세요. 점수칸을 기록하면 이번 차례가 끝납니다.</p>
      </div>
      <PlayTabs
        id={tabs}
        label="요트 점수 보기"
        options={[
          ['record', '내 점수 기록'],
          ['scores', '전체 점수판']
        ]}
        value={scoreView}
        onChange={setScoreView}
      />
      <div id={`${tabs}-record-panel`} role="tabpanel" aria-labelledby={`${tabs}-record-tab`} className={`${p.scoreCards} ${scoreView !== 'record' ? p.mobileHidden : ''}`}>
        <p className={p.muted}>내 합계 {ownScore?.total ?? 0}점 · 기록한 점수는 되돌릴 수 없습니다.</p>
        {Object.entries(yachtCategories).map(([key, label]) => (
          <div className={p.scoreCard} key={key}>
            <div>
              <strong>{label}</strong>
              <small>{ownScore?.categories[key] == null ? '아직 기록하지 않았어요' : `${ownScore.categories[key]}점 기록 완료`}</small>
            </div>
            {Object.hasOwn(state.availableScores, key) ? (
              <button disabled={!ownTurn || pending} onClick={() => void send('SCORE', { category: key })}>
                {state.availableScores[key]}점 기록
              </button>
            ) : (
              <span>{ownScore?.categories[key] ?? '—'}</span>
            )}
          </div>
        ))}
      </div>
      <div id={`${tabs}-scores-panel`} role="tabpanel" aria-labelledby={`${tabs}-scores-tab`} className={`${p.scoreTable} ${scoreView !== 'scores' ? p.mobileHidden : ''}`}>
        <table style={{ borderColor: state.appearance?.scoreboardColor }}>
          <thead style={{ background: state.appearance?.scoreboardColor ?? '#ffffff', color: foreground(state.appearance?.scoreboardColor ?? '#ffffff') }}>
            <tr>
              <th>점수칸</th>
              {state.scores.map((p) => (
                <th key={p.seat}>
                  {names[p.seat] ?? `${p.seat + 1}번 자리`}
                  {p.seat === seat ? ' (나)' : ''}
                  {p.forfeited ? ' · 기권' : p.rank ? ` · ${p.rank}위` : ''}
                </th>
              ))}
              <th>내 점수 기록</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(yachtCategories).map(([key, label]) => (
              <tr key={key}>
                <th>{label}</th>
                {state.scores.map((p) => (
                  <td key={p.seat}>{p.categories[key] ?? '—'}</td>
                ))}
                <td>
                  {Object.hasOwn(state.availableScores, key) && (
                    <button disabled={!ownTurn || pending} onClick={() => void send('SCORE', { category: key })}>
                      {state.availableScores[key]}점 기록
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {[
              ['upperTotal', '상단 합계'],
              ['bonus', '보너스'],
              ['total', '합계']
            ].map(([key, label]) => (
              <tr key={key}>
                <th>{label}</th>
                {state.scores.map((p) => (
                  <td key={p.seat}>{p[key as 'total' | 'bonus' | 'upperTotal']}</td>
                ))}
                <td />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
function TableCard({
  object,
  context,
  selected,
  onSelect,
  move,
  scale = 1,
  positioned = false
}: {
  object: BoardObject;
  context: { gameId?: string; sandboxId?: string };
  selected: boolean;
  onSelect: () => void;
  move?: (x: number, y: number) => void;
  scale?: number;
  positioned?: boolean;
}) {
  const start = useRef<{ x: number; y: number; id: number } | undefined>(undefined);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const asset = object.ownerSeat != null || object.faceUp ? object.assetId : object.backAssetId;
  return (
    <button
      className={`${p.tablePiece} ${selected ? p.selected : ''} ${object.faceDesign !== undefined ? p.withDesign : ''}`}
      style={
        positioned
          ? { position: 'absolute', left: object.x + offset.x, top: object.y + offset.y, width: object.width, height: object.height, minHeight: 0, overflow: 'hidden', touchAction: 'none' }
          : undefined
      }
      onClick={onSelect}
      onPointerDown={(e) => {
        e.stopPropagation();
        if (!move) return;
        start.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const p = start.current;
        if (p) setOffset({ x: (e.clientX - p.x) / scale, y: (e.clientY - p.y) / scale });
      }}
      onPointerCancel={() => {
        start.current = undefined;
        setOffset({ x: 0, y: 0 });
      }}
      onPointerUp={(e) => {
        const p = start.current;
        start.current = undefined;
        setOffset({ x: 0, y: 0 });
        if (p && move && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 6)
          move(Math.max(0, Math.min(1000 - object.width, object.x + (e.clientX - p.x) / scale)), Math.max(0, Math.min(650 - object.height, object.y + (e.clientY - p.y) / scale)));
      }}
      aria-label={object.name ?? (object.kind === 'CARD' ? '카드' : '물체')}
    >
      <CardVisual design={object.faceDesign} assetId={asset} name={object.name} text={object.text} context={context} label={object.kind === 'CARD' ? '카드' : '물체'} />
      {object.kind === 'DICE' || object.kind === 'COUNTER' ? <p>{object.value}</p> : null}
      {object.locked && <small>잠김</small>}
    </button>
  );
}
export function TableBoard({
  state,
  seat,
  send,
  pending,
  context,
  capacity,
  canFinish = true,
  activeSeats
}: {
  state: TableState;
  seat: number;
  send: SendAction;
  pending: boolean;
  context: { gameId?: string; sandboxId?: string };
  capacity: number;
  canFinish?: boolean;
  activeSeats?: number[];
}) {
  const [selected, setSelected] = useState(''),
    [recipient, setRecipient] = useState(seat),
    [counter, setCounter] = useState(0),
    [place, setPlace] = useState(false),
    [scale, setScale] = useState(1),
    [point, setPoint] = useState({ x: 0, y: 0 }),
    [dock, setDock] = useState('pieces');
  const tabs = useId();
  const viewport = useRef<HTMLDivElement>(null),
    table = useRef<HTMLDivElement>(null);
  const object = state.objects.find((o) => o.id === selected),
    allowed = !!object && (!object.locked || canFinish) && !pending && !state.finished;
  const publicObjects = state.objects.filter((o) => o.ownerSeat == null),
    hand = state.objects.filter((o) => o.ownerSeat === seat);
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => setScale(Math.min(1, entries[0].contentRect.width / 1000)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  function select(o: BoardObject) {
    setSelected(o.id);
    setCounter(o.value ?? 0);
    setPoint({ x: o.x, y: o.y });
    setPlace(false);
    setDock('controls');
  }
  function move(x: number, y: number) {
    if (object) void send('MOVE', { objectId: object.id, x, y });
    setPlace(false);
  }
  function beginPlace() {
    setPlace(true);
    viewport.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  return (
    <section className={p.panel}>
      <div className={p.sectionHeader}>
        <div>
          <span className={p.eyebrow}>함께 만드는 플레이</span>
          <h2>자유 테이블 {state.finished ? '· 종료' : `· ${state.turnSeat + 1}번 자리 차례`}</h2>
        </div>
        <span className={p.chip}>내 손패 {hand.length}장</span>
      </div>
      <p className={p.muted}>구성물을 끌어 옮기거나 아래 목록에서 선택해 조작하세요. 규칙과 승패는 참가자가 함께 진행합니다.</p>
      {state.finished && (
        <p role="status" className={p.status}>
          참가자가 수동 기록한 점수이며, 자동 검증된 순위가 아닙니다.
        </p>
      )}
      {place && (
        <p role="status" className={p.status}>
          선택한 물체를 놓을 테이블 위치를 터치하세요. <button onClick={() => setPlace(false)}>위치 지정 취소</button>
        </p>
      )}
      <div ref={viewport} className={p.tableViewport} style={{ touchAction: 'pan-y', height: 650 * scale }}>
        <div
          ref={table}
          className={p.tableSurface}
          data-testid="tabletop-surface"
          style={{ position: 'relative', width: 1000, height: 650, transform: `scale(${scale})`, transformOrigin: 'top left', cursor: place ? 'crosshair' : undefined }}
          onPointerDown={(e) => {
            if (!place || !object || !allowed || !table.current) return;
            const r = table.current.getBoundingClientRect();
            move(
              Math.max(0, Math.min(1000 - object.width, (e.clientX - r.left) / scale - object.width / 2)),
              Math.max(0, Math.min(650 - object.height, (e.clientY - r.top) / scale - object.height / 2))
            );
          }}
        >
          {state.decks.map((deck) => (
            <button
              key={`deck-${deck.id}`}
              className={`${p.tablePiece} ${deck.backDesign !== undefined ? p.withDesign : ''}`}
              style={{ position: 'absolute', left: deck.x, top: deck.y, width: 110, height: 150, overflow: 'hidden' }}
              aria-label={`${deck.name} 덱, ${deck.count}장`}
              disabled={pending || state.finished || deck.count === 0}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => void send('DRAW', { deckId: deck.id })}
            >
              <CardVisual design={deck.backDesign} assetId={deck.backAssetId} name={deck.name} context={context} label="덱 뒷면" />
            </button>
          ))}
          {publicObjects.map((o) => (
            <TableCard
              key={o.id}
              object={o}
              context={context}
              selected={o.id === selected}
              onSelect={() => select(o)}
              scale={scale}
              positioned
              move={!pending && !state.finished && (!o.locked || canFinish) ? (x, y) => void send('MOVE', { objectId: o.id, x, y }) : undefined}
            />
          ))}
        </div>
      </div>
      <PlayTabs
        id={tabs}
        label="테이블 도구"
        options={[
          ['pieces', '구성물·덱'],
          ['hand', `내 손패 ${hand.length}`],
          ['controls', '선택·조작']
        ]}
        value={dock}
        onChange={setDock}
      />
      <div className={p.tableDock}>
        <section id={`${tabs}-pieces-panel`} role="tabpanel" aria-labelledby={`${tabs}-pieces-tab`} className={`${p.dockPanel} ${dock !== 'pieces' ? p.mobileHidden : ''}`}>
          <h3>공용 구성물</h3>
          <div className={p.objectList}>
            {publicObjects.map((o) => (
              <button key={o.id} className={o.id === selected ? p.selected : ''} onClick={() => select(o)}>
                {o.name ?? '카드'}
                {o.kind === 'DICE' || o.kind === 'COUNTER' ? ` · ${o.value ?? 0}` : ''}
              </button>
            ))}
          </div>
          <h3>덱</h3>
          {state.decks.length === 0 && <p className={p.muted}>이 테이블에는 덱이 없습니다.</p>}
          {state.decks.map((deck) => (
            <article className={p.deck} key={deck.id}>
              <div className={p.cardPreview}>
                <CardVisual design={deck.backDesign} assetId={deck.backAssetId} context={context} label="덱 뒷면" />
              </div>
              <div>
                <strong>
                  {deck.name} · {deck.count}장
                </strong>
                <div className={p.row}>
                  <button disabled={pending || state.finished || deck.count === 0} onClick={() => void send('DRAW', { deckId: deck.id })}>
                    내 손으로 뽑기
                  </button>
                  <button disabled={pending || state.finished} onClick={() => void send('SHUFFLE', { deckId: deck.id })}>
                    섞기
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
        <section id={`${tabs}-hand-panel`} role="tabpanel" aria-labelledby={`${tabs}-hand-tab`} className={`${p.dockPanel} ${dock !== 'hand' ? p.mobileHidden : ''}`}>
          <h3>
            내 손패 <span className={p.muted}>{hand.length}장</span>
          </h3>
          <p className={p.muted}>내 앞면만 보입니다. 카드를 선택해 테이블에 놓거나 전달하세요.</p>
          <div className={p.hand}>
            {hand.map((o) => (
              <TableCard key={o.id} object={o} context={context} selected={o.id === selected} onSelect={() => select(o)} />
            ))}
          </div>
          {!hand.length && <p className={p.muted}>덱에서 카드를 뽑으면 여기에 나타납니다.</p>}
          <div className={p.row}>
            {state.hands.map((h) => (
              <small key={h.seat}>
                {h.seat + 1}번 손패: {h.count}장
              </small>
            ))}
          </div>
        </section>
        <section id={`${tabs}-controls-panel`} role="tabpanel" aria-labelledby={`${tabs}-controls-tab`} className={`${p.dockPanel} ${dock !== 'controls' ? p.mobileHidden : ''}`}>
          <h3>{object ? (object.name ?? '선택한 카드') : '구성물을 선택하세요'}</h3>
          {!object && <p className={p.muted}>테이블이나 손패의 구성물을 선택하면 사용할 수 있는 조작이 나타납니다.</p>}
          {object && (
            <>
              {object.locked && !canFinish && <p>방장이 잠근 물체입니다.</p>}
              <div className={p.controls}>
                {object.ownerSeat == null && (
                  <>
                    <button disabled={!allowed} onClick={beginPlace}>
                      위치 지정
                    </button>
                    <label>
                      가로 위치
                      <input type="number" value={point.x} onChange={(e) => setPoint({ ...point, x: Number(e.target.value) })} />
                    </label>
                    <label>
                      세로 위치
                      <input type="number" value={point.y} onChange={(e) => setPoint({ ...point, y: Number(e.target.value) })} />
                    </label>
                    <button disabled={!allowed} onClick={() => move(point.x, point.y)}>
                      위치 적용
                    </button>
                  </>
                )}
                {object.kind === 'CARD' && (
                  <>
                    <button disabled={!allowed} onClick={() => void send('FLIP', { objectId: object.id })}>
                      앞뒤 뒤집기
                    </button>
                    <button disabled={!allowed} onClick={() => void send('TRANSFER', { objectId: object.id, toSeat: null })}>
                      공용 테이블에 놓기
                    </button>
                    <label>
                      전달할 자리
                      <select value={recipient} onChange={(e) => setRecipient(Number(e.target.value))}>
                        {(activeSeats ?? Array.from({ length: capacity }, (_, n) => n)).map((n) => (
                          <option key={n} value={n}>
                            {n + 1}번
                          </option>
                        ))}
                      </select>
                    </label>
                    <button disabled={!allowed} onClick={() => void send('TRANSFER', { objectId: object.id, toSeat: recipient })}>
                      전달
                    </button>
                  </>
                )}
                {object.kind === 'DICE' && (
                  <button disabled={!allowed} onClick={() => void send('ROLL', { objectId: object.id })}>
                    굴리기
                  </button>
                )}
                {object.kind === 'COUNTER' && (
                  <>
                    <input aria-label="카운터 값" type="number" value={counter} onChange={(e) => setCounter(Number(e.target.value))} />
                    <button disabled={!allowed} onClick={() => void send('COUNTER', { objectId: object.id, value: counter })}>
                      값 적용
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </section>
      </div>
      <div className={p.turnActions}>
        <button disabled={pending || state.finished || (!canFinish && state.turnSeat !== seat)} onClick={() => void send('NEXT_TURN')}>
          다음 차례
        </button>
        {canFinish && (
          <button disabled={pending || state.finished} onClick={() => void send('FINISH')}>
            플레이 마치기
          </button>
        )}
      </div>
    </section>
  );
}
export function BoardGamePage() {
  const { id } = useParams();
  const query = useQuery({ queryKey: ['board', id], queryFn: () => get<BoardSnapshot>(`/games/${id}/board-snapshot`), refetchInterval: 5000 });
  useEffect(() => {
    const ping = () => {
      if (document.visibilityState === 'visible') void command('POST', `/games/${id}/heartbeat`, {}).catch(() => undefined);
    };
    ping();
    const t = setInterval(ping, 15000);
    return () => clearInterval(t);
  }, [id]);
  return <QueryState query={query}>{(data) => <LiveBoard data={data} />}</QueryState>;
}
function LiveBoard({ data }: { data: BoardSnapshot }) {
  const action = useCommand(),
    navigate = useNavigate();
  const [text, setText] = useState(''),
    [view, setView] = useState('board');
  const tabs = useId();
  const names = Object.fromEntries(data.participants.map((player) => [player.seat, player.displayName]));
  const messages = useQuery({
    queryKey: ['messages', data.id],
    queryFn: () => get<{ items: { id: string; displayName?: string; senderName?: string; text: string }[] }>(`/games/${data.id}/messages?size=50`),
    refetchInterval: 5000
  });
  const send: SendAction = async (type, payload = {}) => {
    if (type === 'SCENE') await action.run('POST', `/games/${data.id}/scene`, payload);
    else await action.run('POST', `/games/${data.id}/board-commands`, { type, expectedVersion: data.stateVersion, payload });
  };
  return (
    <div className={p.playShell}>
      <header className={p.header}>
        <div>
          <span className={p.eyebrow}>우리의 플레이 테이블</span>
          <h1>{gameTypeNames[data.gameType]}</h1>
          <p>
            {data.participants.length}명이 함께 · 내 자리 {data.mySeat + 1}번
          </p>
        </div>
        <span className={p.chip}>진행 상황 자동 저장</span>
      </header>
      <ErrorNotice message={action.error} />
      {data.status === 'ABORTED' && (
        <p className={p.status} role="status">
          게임이 중단되었습니다.
        </p>
      )}
      {data.status === 'PAUSED' && (
        <p className={p.status} role="status">
          Discord 권한과 음성 연결을 동기화하는 동안 게임이 일시 정지되었습니다.
        </p>
      )}
      <PlayTabs
        id={tabs}
        label="보드게임 화면"
        options={[
          ['board', '게임판'],
          ['info', '참가자·자료'],
          ['chat', '대화']
        ]}
        value={view}
        onChange={setView}
      />
      <div className={p.boardLayout}>
        <section id={`${tabs}-board-panel`} role="tabpanel" aria-labelledby={`${tabs}-board-tab`} className={`${p.boardMain} ${view !== 'board' ? p.mobileHidden : ''}`}>
          {isClassic(data.gameType) ? (
            <ClassicBoard gameType={data.gameType} state={data.state as ClassicState} seat={data.mySeat} send={send} pending={action.pending || data.status !== 'ACTIVE'} names={names} />
          ) : data.gameType === 'YACHT' ? (
            <YachtBoard state={data.state as YachtState} seat={data.mySeat} send={send} pending={action.pending || data.status !== 'ACTIVE'} names={names} />
          ) : (
            <TableBoard
              state={data.state as TableState}
              seat={data.mySeat}
              send={send}
              pending={action.pending || data.status !== 'ACTIVE'}
              context={{ gameId: data.id }}
              capacity={data.participants.length}
              activeSeats={data.participants.filter((player) => player.active).map((player) => player.seat)}
              canFinish={data.participants.find((player) => player.seat === data.mySeat)?.userId === data.hostId}
            />
          )}
        </section>
        <aside id={`${tabs}-info-panel`} role="tabpanel" aria-labelledby={`${tabs}-info-tab`} className={`${p.boardAside} ${view !== 'info' ? p.mobileHidden : ''}`}>
          <section className={p.panel}>
            <span className={p.eyebrow}>함께하는 사람들</span>
            <h2>참가자</h2>
            <ul className={p.people}>
              {data.participants.map((player) => (
                <li key={player.userId}>
                  <span className={p.seat}>{player.seat + 1}</span>
                  <div>
                    <strong>
                      {player.displayName}
                      {player.seat === data.mySeat ? ' (나)' : ''}
                    </strong>
                    <small>
                      {player.active ? '플레이 중' : '참가 종료'}
                      {player.userId === data.hostId ? ' · 방장' : ''}
                    </small>
                  </div>
                  {player.seat === data.state.turnSeat && data.status === 'ACTIVE' && <span className={p.chip}>차례</span>}
                </li>
              ))}
            </ul>
          </section>
          {(data.scene || data.layouts?.length > 0) && (
            <details className={`${p.panel} ${p.details}`}>
              <summary>작품 장면·내 자료</summary>
              <ScenePanel data={{ ...data, canChangeScene: data.canChangeScene && data.status === 'ACTIVE' }} context={{ gameId: data.id }} send={send} />
            </details>
          )}
        </aside>
        <aside id={`${tabs}-chat-panel`} role="tabpanel" aria-labelledby={`${tabs}-chat-tab`} className={`${p.chatPane} ${view !== 'chat' ? p.mobileHidden : ''}`}>
          <section className={p.panel}>
            <h2>전체 대화</h2>
            <div className={p.messageLog} role="log" aria-label="전체 대화 메시지" aria-live="polite">
              {messages.data?.items.length ? (
                messages.data.items.map((message) => (
                  <p key={message.id}>
                    <strong>{message.displayName ?? message.senderName ?? '참가자'}</strong>
                    {message.text}
                  </p>
                ))
              ) : (
                <p className={p.muted}>함께할 이야기를 남겨 보세요.</p>
              )}
            </div>
            <form
              className={p.messageForm}
              onSubmit={(event) => {
                event.preventDefault();
                if (text.trim() && data.status === 'ACTIVE' && !action.pending)
                  void (async () => {
                    if (await action.run('POST', `/games/${data.id}/messages`, { text })) setText('');
                  })();
              }}
            >
              <label>
                메시지
                <textarea value={text} maxLength={2000} rows={2} onChange={(event) => setText(event.target.value)} disabled={data.status !== 'ACTIVE'} />
              </label>
              <button className={p.primary} disabled={!text.trim() || action.pending || data.status !== 'ACTIVE'}>
                보내기
              </button>
            </form>
          </section>
          <details className={`${p.panel} ${p.details}`}>
            <summary>음성·플레이 관리</summary>
            <VoicePanel id={data.id} />
            {data.canRequestAbort && (
              <>
                <p>
                  중단 동의 {data.abortVotes ?? 0}/{data.abortRequired ?? data.participants.filter((player) => player.active).length}명
                </p>
                <button disabled={action.pending} onClick={() => void action.run('POST', `/games/${data.id}/abort-vote`)}>
                  게임 중단에 동의
                </button>
              </>
            )}
            {!['COMPLETED', 'ABORTED'].includes(data.status) && (
              <p>
                <button
                  disabled={action.pending}
                  onClick={async () => {
                    if (await action.run('POST', `/games/${data.id}/leave`)) navigate('/account');
                  }}
                >
                  게임에서 나가기
                </button>
              </p>
            )}
          </details>
        </aside>
      </div>
      {['COMPLETED', 'ABORTED'].includes(data.status) && <Link to="/account">플레이 기록으로 돌아가기</Link>}
    </div>
  );
}
export function SandboxPage() {
  const { id } = useParams(),
    [params] = useSearchParams();
  return id ? <SandboxWorkspace id={id} capacity={Math.min(4, Math.max(1, Number(params.get('capacity')) || 4))} /> : <p>시험할 작품을 선택해 주세요.</p>;
}
export function SandboxWorkspace({ id, capacity, onExit, versionLabel }: { id: string; capacity: number; onExit?: () => void; versionLabel?: string }) {
  return <SandboxSession key={id} id={id} capacity={capacity} onExit={onExit} versionLabel={versionLabel} />;
}
function SandboxSession({ id, capacity: requestedCapacity, onExit, versionLabel }: { id: string; capacity: number; onExit?: () => void; versionLabel?: string }) {
  const [compare, setCompare] = useState(false);
  const [seat, setSeat] = useState(0),
    [view, setView] = useState('board');
  const tabs = useId();
  const query = useQuery({ queryKey: ['sandbox', id, seat], queryFn: () => get<SandboxSnapshot>(`/author/sandboxes/${id}?seat=${seat}`), refetchOnWindowFocus: false });
  const capacity = query.data?.capacity ?? requestedCapacity;
  const action = useCommand();
  const send: SendAction = async (type, payload = {}) => {
    if (query.data) await action.run('POST', `/author/sandboxes/${id}/commands`, { seat, type, expectedVersion: query.data.stateVersion, payload });
  };
  return (
    <div className={p.playShell}>
      {onExit ? (
        <div>
          <button onClick={onExit}>← 편집으로 돌아가기</button>
        </div>
      ) : (
        <Link to="/studio">← 작품 스튜디오</Link>
      )}
      <PageTitle title="혼자 테스트">{versionLabel ? `${versionLabel} · ` : ''}자리를 바꾸며 플레이를 확인하세요. 실제 플레이 기록에 남지 않습니다.</PageTitle>
      <div className={p.sandboxToolbar}>
        <label>
          현재 자리
          <select value={seat} onChange={(event) => setSeat(Number(event.target.value))}>
            {Array.from({ length: capacity }, (_, index) => (
              <option key={index} value={index}>
                {index + 1}번 자리
              </option>
            ))}
          </select>
        </label>
        <div className={p.row}>
          <button disabled={action.pending} onClick={() => void send('RESET')}>
            처음부터 다시
          </button>
          {query.data?.gameType === 'MURDER_MYSTERY' && (
            <button aria-pressed={compare} onClick={() => setCompare(!compare)}>
              {compare ? '플레이 조작 보기' : '역할별 자료 비교'}
            </button>
          )}
          {query.data?.gameType === 'MURDER_MYSTERY' && (
            <button disabled={action.pending} onClick={() => void send('ADVANCE_TIME')}>
              다음 시간으로
            </button>
          )}
        </div>
      </div>
      <ErrorNotice message={action.error} />
      {compare && query.data?.gameType === 'MURDER_MYSTERY' && <SandboxViews id={id} capacity={capacity} />}
      <div className={p.sandboxBody} hidden={compare && query.data?.gameType === 'MURDER_MYSTERY'}>
        <PlayTabs
          id={tabs}
          label="시험 화면"
          options={[
            ['board', '플레이'],
            ['scene', '장면·자료']
          ]}
          value={view}
          onChange={setView}
        />
        <QueryState query={query}>
          {(data) => (
            <div className={p.boardLayout}>
              <div id={`${tabs}-board-panel`} role="tabpanel" aria-labelledby={`${tabs}-board-tab`} className={`${p.boardMain} ${view !== 'board' ? p.mobileHidden : ''}`}>
                {isClassic(data.gameType) ? (
                  <ClassicBoard gameType={data.gameType} state={data.state as ClassicState} seat={seat} send={send} pending={action.pending} />
                ) : data.gameType === 'YACHT' ? (
                  <YachtBoard state={data.state as YachtState} seat={seat} send={send} pending={action.pending} />
                ) : data.gameType === 'TABLETOP' ? (
                  <TableBoard state={data.state as TableState} seat={seat} send={send} pending={action.pending} context={{ sandboxId: data.id }} capacity={capacity} />
                ) : (
                  <MysteryPreview state={data.state as Data} send={send} pending={action.pending} />
                )}
              </div>
              <aside id={`${tabs}-scene-panel`} role="tabpanel" aria-labelledby={`${tabs}-scene-tab`} className={`${p.sandboxScene} ${view !== 'scene' ? p.mobileHidden : ''}`}>
                <ScenePanel data={{ ...data, canChangeScene: true }} context={{ sandboxId: data.id }} send={send} />
              </aside>
            </div>
          )}
        </QueryState>
      </div>
    </div>
  );
}
function MysteryPreview({ state, send, pending }: { state: Data; send: SendAction; pending: boolean }) {
  const role = (state.myRole ?? {}) as Data,
    phase = (state.phase ?? {}) as Data;
  const [voted, setVoted] = useState('');
  const participants = (state.participants ?? []) as Data[];
  return (
    <div className={p.panel}>
      <h2>
        {String(phase.kind ?? '진행')} · {String(state.status ?? '')}
      </h2>
      <p>{String(phase.publicText ?? '')}</p>
      <h3>{String(role.name ?? '역할')}</h3>
      <p className={s.preview}>{String(role.secret ?? '')}</p>
      <button disabled={pending} onClick={() => void send('PHASE_READY')}>
        이 자리 읽기 완료
      </button>
      <h3>조사 대상</h3>
      <div className={s.row}>
        {((state.targets ?? []) as Data[]).map((t) => (
          <button key={String(t.id)} disabled={pending} onClick={() => void send('INVESTIGATE', { targetId: t.id })}>
            {String(t.name)}
          </button>
        ))}
      </div>
      <h3>단서</h3>
      {((state.clues ?? []) as Data[]).map((c) => (
        <article key={String(c.id)}>
          <strong>{String(c.title)}</strong>
          <p>{String(c.text)}</p>
          <button disabled={pending} onClick={() => void send('SHARE', { clueId: c.id, scope: 'PUBLIC' })}>
            공개하기
          </button>
        </article>
      ))}
      <label>
        범인 역할 식별자
        <input list="preview-roles" value={voted} onChange={(e) => setVoted(e.target.value)} />
        <datalist id="preview-roles">
          {participants.map((p) => (
            <option key={String(p.roleId)} value={String(p.roleId)}>
              {String(p.roleName ?? p.roleId)}
            </option>
          ))}
        </datalist>
      </label>
      <button disabled={pending} onClick={() => void send('VOTE', { roleId: voted || null })}>
        {voted ? '투표' : '기권'}
      </button>
      {state.ending && (
        <article>
          <h3>{String((state.ending as Data).title)}</h3>
          <p>{String((state.ending as Data).text)}</p>
        </article>
      )}
    </div>
  );
}
