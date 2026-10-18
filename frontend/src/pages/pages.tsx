import { lazy, Suspense, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Badge, Deadline, Empty, ErrorNotice, PageTitle, QueryState, ScenarioCard, useUser } from '~/components/ui';
import type { Activity, AdminScenario, Block, History, Page, PlayMode, Proposal, Report, Room, RoomCard, Scenario, Ticket } from '~/common/types';
import { activityPath } from '~/common/time';
import { difficultyNames } from '~/common/time';
import { command, errorMessage, get } from '~/services/api';
import { useCommand } from '~/hooks/use-command';
import { createInviteToken, forgetCreatedInvite, getCreatedInvite, rememberCreatedInvite } from '~/services/invites';
import s from '~/styles/app.module.scss';
import { BoardMatchPage } from '~/studio/matching';
const ReviewList = lazy(() => import('~/studio/reviews').then((m) => ({ default: m.ReviewList })));
import { gameTypeNames, isClassic } from '~/studio/types';
import { HomeLanding } from './home';
import { captureInvitePath, clearReceivedInvite, receivedInvite } from '~/services/invites';

const listItems = <T,>(value: Page<T> | T[]) => (Array.isArray(value) ? value : value.items);
function ModeSelect({ value, onChange, disabled = false, allowedModes = ['TEXT', 'DISCORD'] }: { value: PlayMode; onChange: (mode: PlayMode) => void; disabled?: boolean; allowedModes?: PlayMode[] }) {
  const meta = useQuery({ queryKey: ['meta'], queryFn: () => get<{ voiceProvider: string; voiceConfigured: boolean }>('/meta') });
  return (
    <label>
      대화 방식
      <select value={value} onChange={(e) => onChange(e.target.value as PlayMode)} disabled={disabled || allowedModes.length === 1}>
        {allowedModes.includes('TEXT') && <option value="TEXT">텍스트 채팅</option>}
        {allowedModes.includes('DISCORD') && (
          <option value="DISCORD" disabled={!meta.data?.voiceConfigured}>
            Discord 음성 + 텍스트{!meta.data?.voiceConfigured ? ' (미설정)' : ''}
          </option>
        )}
      </select>
    </label>
  );
}
export function HomePage() {
  return <HomeLanding />;
}
export function CatalogPage() {
  const [expandedFilters, setExpandedFilters] = useState(false);
  const [params, setParams] = useSearchParams();
  const requestedType = params.get('gameType') ?? '',
    gameType = Object.hasOwn(gameTypeNames, requestedType) ? requestedType : '',
    requestedCount = params.get('playerCount') ?? '',
    playerCount = ['1', '2', '3', '4'].includes(requestedCount) ? requestedCount : '',
    genre = (params.get('genre') ?? '').slice(0, 80),
    requestedDifficulty = params.get('difficulty') ?? '',
    difficulty = Object.hasOwn(difficultyNames, requestedDifficulty) ? requestedDifficulty : '',
    requestedMinutes = params.get('maxMinutes') ?? '',
    minutes = ['45', '60', '90'].includes(requestedMinutes) ? requestedMinutes : '',
    requestedPage = params.get('page') ?? '0',
    page = /^\d{1,6}$/.test(requestedPage) ? Number(requestedPage) : 0;
  const normalized = new URLSearchParams();
  for (const [key, value] of Object.entries({ gameType, playerCount, genre, difficulty, maxMinutes: minutes })) if (value) normalized.set(key, value);
  if (page) normalized.set('page', String(page));
  const normalizedSearch = normalized.toString();
  useEffect(() => {
    if (params.toString() !== normalizedSearch) setParams(normalizedSearch, { replace: true });
  }, [params, normalizedSearch, setParams]);
  function updateFilter(key: string, value: string, replace = false) {
    const next = new URLSearchParams(normalizedSearch);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setParams(next, { replace });
  }
  function setPage(value: number) {
    const next = new URLSearchParams(normalizedSearch);
    if (value > 0) next.set('page', String(value));
    else next.delete('page');
    setParams(next);
  }
  const query = useQuery({
    queryKey: ['scenarios', gameType, playerCount, genre, difficulty, minutes, page],
    queryFn: () =>
      get<Page<Scenario>>(`/scenarios?${new URLSearchParams({ page: String(page), size: '12', gameType, genre, difficulty, maxMinutes: minutes, ...(playerCount ? { playerCount } : {}) })}`)
  });
  return (
    <>
      <PageTitle eyebrow="오늘은 어떤 게임을 할까요?" title="작품 탐색">
        함께 추리하는 이야기부터 익숙한 보드게임까지, 인원과 취향에 맞춰 골라보세요.
      </PageTitle>
      <div className={s.filters}>
        <label>
          게임 종류
          <select
            aria-label="게임 종류"
            value={gameType}
            onChange={(e) => {
              updateFilter('gameType', e.target.value);
            }}
          >
            <option value="">모든 게임</option>
            {Object.entries(gameTypeNames).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label>
          인원
          <select
            aria-label="인원"
            value={playerCount}
            onChange={(e) => {
              updateFilter('playerCount', e.target.value);
            }}
          >
            <option value="">모든 인원</option>
            {[1, 2, 3, 4].map((count) => (
              <option key={count} value={count}>
                {count}인
              </option>
            ))}
          </select>
        </label>
        <button className={s.filterToggle} aria-expanded={expandedFilters} aria-controls="catalog-genre catalog-difficulty catalog-time" onClick={() => setExpandedFilters(!expandedFilters)}>
          상세 조건 <span aria-hidden="true">{expandedFilters ? '−' : '+'}</span>
        </button>
        <label id="catalog-genre" className={s.advancedFilter} data-expanded={expandedFilters}>
          장르
          <input
            placeholder="모든 장르"
            value={genre}
            onChange={(e) => {
              updateFilter('genre', e.target.value, true);
            }}
          />
        </label>
        <label id="catalog-difficulty" className={s.advancedFilter} data-expanded={expandedFilters}>
          난이도
          <select
            aria-label="난이도"
            value={difficulty}
            onChange={(e) => {
              updateFilter('difficulty', e.target.value);
            }}
          >
            <option value="">모든 난이도</option>
            {Object.entries(difficultyNames).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label id="catalog-time" className={s.advancedFilter} data-expanded={expandedFilters}>
          가능한 시간
          <select
            aria-label="가능한 시간"
            value={minutes}
            onChange={(e) => {
              updateFilter('maxMinutes', e.target.value);
            }}
          >
            <option value="">제한 없음</option>
            <option value="45">45분 이내</option>
            <option value="60">60분 이내</option>
            <option value="90">90분 이내</option>
          </select>
        </label>
      </div>
      <QueryState query={query}>
        {(data) => (
          <>
            <div className={s.catalogMeta}>
              <span>
                <strong>{data.total}개</strong>의 공개 작품
              </span>
              {(gameType || playerCount || genre || difficulty || minutes) && (
                <button
                  className={s.clearFilters}
                  onClick={() => {
                    setParams({});
                  }}
                >
                  조건 초기화
                </button>
              )}
            </div>
            {data.items.length ? (
              <div className={s.cards}>
                {data.items.map((item) => (
                  <ScenarioCard key={item.id} scenario={item} />
                ))}
              </div>
            ) : (
              <Empty>조건에 맞는 작품이 없습니다. 다른 조건으로 찾아보세요.</Empty>
            )}
            <div className={s.pagination}>
              <button disabled={!page} onClick={() => setPage(page - 1)}>
                이전
              </button>
              <span>{page + 1} 페이지</span>
              <button disabled={(page + 1) * data.size >= data.total} onClick={() => setPage(page + 1)}>
                다음
              </button>
            </div>
          </>
        )}
      </QueryState>
    </>
  );
}
export function ScenarioPage() {
  const { id } = useParams();
  const user = useUser();
  const navigate = useNavigate();
  const action = useCommand();
  const [visibility, setVisibility] = useState('PUBLIC');
  const [capacity, setCapacity] = useState(2);
  const [mode, setMode] = useState<PlayMode>('TEXT');
  const pendingInvite = useRef<string | null>(null);
  const query = useQuery({ queryKey: ['scenario', id], queryFn: () => get<Scenario>(`/scenarios/${id}`) });
  const selectedMode = query.data?.modes.includes(mode) ? mode : (query.data?.modes[0] ?? 'TEXT');
  async function create(versionId: string) {
    if (!user) {
      navigate(`/login?next=/scenarios/${id}`);
      return;
    }
    const selectedCapacity =
      query.data?.gameType && query.data.gameType !== 'MURDER_MYSTERY'
        ? query.data.supportedPlayerCounts?.includes(capacity)
          ? capacity
          : (query.data.supportedPlayerCounts?.[0] ?? 2)
        : query.data?.playerCount;
    const inviteToken = visibility === 'INVITE' ? (pendingInvite.current ??= createInviteToken()) : undefined;
    const result = await action.run<{ roomId: string; expiresAt?: string }>('POST', '/rooms', {
      scenarioVersionId: versionId,
      capacity: selectedCapacity,
      visibility,
      mode: selectedMode,
      ...(inviteToken ? { inviteToken } : {})
    });
    if (result) {
      if (inviteToken) rememberCreatedInvite(result.roomId, inviteToken);
      pendingInvite.current = null;
      navigate(`/rooms/${result.roomId}`);
    }
  }
  return (
    <QueryState query={query}>
      {(data) => (
        <>
          <PageTitle eyebrow={`${data.genre} · ${difficultyNames[data.difficulty] ?? data.difficulty}`} title={data.title}>
            {data.synopsis}
          </PageTitle>
          <div className={s.detailGrid}>
            <section className={s.panel}>
              <h2>{data.gameType && data.gameType !== 'MURDER_MYSTERY' ? gameTypeNames[data.gameType] : '이 사건의 등장인물'}</h2>
              <div className={s.roleGrid}>
                {data.roles.map((role) => (
                  <article key={role.id}>
                    <span className={s.avatar}>{role.name.slice(0, 1)}</span>
                    <h3>{role.name}</h3>
                    <p>{role.publicIntro}</p>
                  </article>
                ))}
              </div>
              <p className={s.note}>
                {data.gameType === 'TABLETOP'
                  ? '카드와 주사위를 조작하며 참가자가 규칙을 진행하는 자유 테이블입니다.'
                  : data.gameType === 'YACHT'
                    ? '서버가 차례와 굴림, 점수를 판정하는 주사위 게임입니다.'
                    : data.gameType && isClassic(data.gameType)
                      ? '서버가 가능한 수와 차례, 승패를 판정하는 2인 보드게임입니다.'
                      : '역할별 비밀 자료는 게임 시작 뒤 본인에게만 공개됩니다.'}
              </p>
            </section>
            <aside className={s.panel}>
              <Badge>{data.gameType && data.gameType !== 'MURDER_MYSTERY' ? (data.supportedPlayerCounts ?? [data.playerCount]).join('·') : data.playerCount}인 전용</Badge>
              <h2>{data.playerCount === 1 ? '혼자 플레이하기' : '함께 플레이하기'}</h2>
              <p>
                예상 {data.estimatedMinutes}분 <small>(샘플 작품 추정값)</small>
              </p>
              <div className={s.form}>
                <label>
                  모집 방식
                  <select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
                    <option value="PUBLIC">공개 모집</option>
                    <option value="INVITE">친구 초대 전용</option>
                  </select>
                </label>
                {data.gameType && data.gameType !== 'MURDER_MYSTERY' && (
                  <label>
                    플레이 인원
                    <select value={data.supportedPlayerCounts?.includes(capacity) ? capacity : (data.supportedPlayerCounts?.[0] ?? 2)} onChange={(e) => setCapacity(Number(e.target.value))}>
                      {(data.supportedPlayerCounts ?? [2, 3, 4]).map((n) => (
                        <option key={n} value={n}>
                          {n}명
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <ModeSelect value={selectedMode} onChange={setMode} allowedModes={data.modes} />
                <ErrorNotice message={action.error} />
                <button className={s.primary} disabled={action.pending} onClick={() => void create(data.versionId)}>
                  이 작품으로 방 만들기
                </button>
                {data.gameType && data.gameType !== 'MURDER_MYSTERY' && <Link to={`/match?gameType=${data.gameType}&scenario=${data.id}`}>이 작품 자동 매칭 →</Link>}
                <Link to={`/rooms?scenario=${data.id}`}>이 작품 모집방 보기 →</Link>
              </div>
            </aside>
          </div>
        </>
      )}
    </QueryState>
  );
}
export function RoomsPage() {
  const [params] = useSearchParams();
  const [page, setPage] = useState(0);
  const navigate = useNavigate();
  const user = useUser();
  const action = useCommand();
  const query = useQuery({
    queryKey: ['rooms', page, params.get('scenario')],
    queryFn: () => get<Page<RoomCard>>(`/rooms?page=${page}&size=20${params.get('scenario') ? `&scenarioId=${params.get('scenario')}` : ''}`),
    refetchInterval: 15000
  });
  async function join(id: string) {
    if (!user) {
      navigate(`/login?next=/rooms/${id}`);
      return;
    }
    const result = await action.run('POST', `/rooms/${id}/join`, {});
    if (result) navigate(`/rooms/${id}`);
  }
  return (
    <>
      <PageTitle eyebrow="함께할 사람이 기다리고 있어요" title="모집방 찾기">
        공개 모집 중인 방에 참여하거나 직접 방을 만들어보세요.
      </PageTitle>
      <div className={s.toolbar}>
        <Link className={s.primary} to="/scenarios">
          새 방 만들기 +
        </Link>
        <span>초대 전용 방은 이 목록에 표시되지 않습니다.</span>
      </div>
      <ErrorNotice message={action.error} />
      <QueryState query={query}>
        {(data) => (
          <>
            {data.items.length ? (
              <div className={s.roomList}>
                {data.items.map((room) => (
                  <article key={room.id} className={s.roomRow}>
                    <div>
                      <Badge>{room.mode === 'TEXT' ? '텍스트' : 'Discord 음성'}</Badge>
                      <h2>{room.title}</h2>
                      <span className={s.muted}>
                        방장 {room.hostName} · {room.count}/{room.capacity}명
                      </span>
                    </div>
                    <button disabled={action.pending || room.count >= room.capacity} onClick={() => void join(room.id)}>
                      참가하기 →
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <Empty>지금 모집 중인 방이 없습니다. 첫 번째 방을 열어보세요.</Empty>
            )}
            <div className={s.pagination}>
              <button disabled={!page} onClick={() => setPage(page - 1)}>
                이전
              </button>
              <button disabled={(page + 1) * data.size >= data.total} onClick={() => setPage(page + 1)}>
                다음
              </button>
            </div>
          </>
        )}
      </QueryState>
    </>
  );
}
export function LobbyPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const user = useUser();
  const navigate = useNavigate();
  const action = useCommand();
  const [invite, setInvite] = useState(() => params.get('invite') ?? (receivedInvite(id ?? '') || getCreatedInvite(id ?? '')));
  useEffect(() => {
    const clean = captureInvitePath(window.location.pathname + window.location.search);
    if (clean !== window.location.pathname + window.location.search) window.history.replaceState(null, '', clean);
  }, []);
  const [inviteExpiresAt, setInviteExpiresAt] = useState<string>();
  const pendingInvite = useRef<string | null>(null);
  useEffect(() => {
    if (id) forgetCreatedInvite(id);
  }, [id]);
  const query = useQuery({ queryKey: ['room', id], queryFn: () => get<Room>(`/rooms/${id}`), refetchInterval: 15000 });
  const joined = !!query.data?.participants.some((p) => p.userId === user.id);
  useEffect(() => {
    if (!joined) return;
    clearReceivedInvite(id ?? '');
    const ping = () => {
      if (document.visibilityState === 'visible') void command('POST', `/rooms/${id}/heartbeat`, {}).catch(() => undefined);
    };
    ping();
    const timer = setInterval(ping, 15000);
    return () => clearInterval(timer);
  }, [id, joined]);
  useEffect(() => {
    if (query.data?.gameId) navigate(`/games/${query.data.gameId}`, { replace: true });
  }, [query.data?.gameId, navigate]);
  async function start() {
    const result = await action.run<{ gameId: string }>('POST', `/rooms/${id}/start`);
    if (result) navigate(`/games/${result.gameId}`);
  }
  async function leave() {
    if (await action.run('POST', `/rooms/${id}/leave`)) navigate('/rooms');
  }
  async function inviteLink() {
    const inviteToken = (pendingInvite.current ??= createInviteToken());
    const result = await action.run<{ roomId: string; expiresAt: string }>('POST', `/rooms/${id}/invite`, { inviteToken });
    if (result) {
      setInvite(inviteToken);
      setInviteExpiresAt(result.expiresAt);
      pendingInvite.current = null;
    }
  }
  if (query.isError)
    return (
      <>
        <PageTitle title="초대받은 방에 참여하기" />
        <ErrorNotice message={errorMessage(query.error)} />
        <div className={s.panel}>
          <p>초대 링크의 참가 권한을 확인한 뒤 대기실에 들어갑니다.</p>
          <ErrorNotice message={action.error} />
          <button className={s.primary} disabled={action.pending} onClick={() => void action.run('POST', `/rooms/${id}/join`, { ...(invite ? { inviteToken: invite } : {}) })}>
            이 방에 참가하기
          </button>
        </div>
      </>
    );
  return (
    <QueryState query={query}>
      {(room) => {
        const me = room.participants.find((p) => p.userId === user.id);
        const host = room.hostId === user.id;
        return (
          <>
            <PageTitle eyebrow={room.isTest ? '비공개 테스트 방 · 기록에 남지 않음' : '플레이 준비'} title={room.title}>
              {room.capacity === 1
                ? '혼자 자료를 읽고 단서를 조사합니다.'
                : room.mode === 'TEXT'
                  ? '텍스트로 대화합니다.'
                  : 'Discord에서 음성으로 대화합니다. 계정 연결과 마이크 설정을 확인해 주세요.'}
            </PageTitle>
            <div className={s.detailGrid}>
              <section className={s.panel}>
                <div className={s.sectionHeading}>
                  <h2>
                    대기실{' '}
                    <span className={s.muted}>
                      {room.participants.length}/{room.capacity}
                    </span>
                  </h2>
                  <Badge>{room.visibility === 'INVITE' ? '초대 전용' : '공개 모집'}</Badge>
                </div>
                <div className={s.participantGrid}>
                  {room.participants.map((p) => (
                    <div className={s.participant} key={p.userId}>
                      <span className={s.avatar}>{p.displayName.slice(0, 1)}</span>
                      <strong>
                        {p.displayName}
                        {p.userId === user.id ? ' (나)' : ''}
                      </strong>
                      <span>
                        {p.userId === room.hostId ? '방장 · ' : ''}
                        {p.connected ? '접속 중' : '연결 확인 중'}
                      </span>
                      <Badge>{p.ready ? '✓ 준비 완료' : '준비 중'}</Badge>
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, room.capacity - room.participants.length) }, (_, index) => (
                    <div className={`${s.participant} ${s.vacant}`} key={index}>
                      <span>＋</span>참가자를 기다려요
                    </div>
                  ))}
                </div>
                <ErrorNotice message={action.error} />
                <div className={s.actions}>
                  {me ? (
                    <button className={s.primary} disabled={action.pending} onClick={() => void action.run('PUT', `/rooms/${id}/ready`, { ready: !me.ready })}>
                      {me.ready ? '준비 취소' : '준비 완료'}
                    </button>
                  ) : (
                    <button onClick={() => void action.run('POST', `/rooms/${id}/join`, { inviteToken: invite || undefined })}>참가하기</button>
                  )}
                  {host && (
                    <button data-testid="start-game" disabled={action.pending || room.participants.length !== room.capacity || !room.participants.every((p) => p.ready)} onClick={() => void start()}>
                      게임 시작
                    </button>
                  )}
                  <button className={s.ghost} disabled={action.pending} onClick={() => void leave()}>
                    방 나가기
                  </button>
                </div>
                <p className={s.note}>{room.capacity === 1 ? '준비 완료를 누르면 혼자 바로 시작할 수 있어요.' : `정확히 ${room.capacity}명이 모이고 전원 준비가 완료되면 방장이 시작할 수 있어요.`}</p>
              </section>
              <aside className={s.panel}>
                <h2>플레이 약속</h2>
                <p>{room.rules}</p>
                <p>비밀 자료는 본인만 읽고, 공개할 단서는 직접 공유해 주세요.</p>
                <p>게임 시작 후 역할 교체나 새로운 참가자 입장은 불가능합니다.</p>
                {room.mode === 'DISCORD' && <Link to="/account">Discord 연결 확인 →</Link>}
                {host && room.capacity > 1 && (
                  <>
                    <h3>친구 초대</h3>
                    <button disabled={action.pending} onClick={() => void inviteLink()}>
                      초대 링크 새로 만들기
                    </button>
                    {invite && (
                      <label>
                        초대 링크
                        <input readOnly value={`${location.origin}/rooms/${id}?invite=${encodeURIComponent(invite)}`} onFocus={(e) => e.target.select()} />
                      </label>
                    )}
                    {inviteExpiresAt && <p className={s.note}>초대 링크 만료: {new Date(inviteExpiresAt).toLocaleString('ko-KR')}</p>}
                    {!invite && <p className={s.note}>기존 링크의 원문은 보관하지 않습니다. 필요하면 새 링크를 만들어 주세요.</p>}
                    <button
                      className={s.ghost}
                      disabled={action.pending}
                      onClick={async () => {
                        if (await action.run('DELETE', `/rooms/${id}/invite`)) {
                          setInvite('');
                          setInviteExpiresAt(undefined);
                          pendingInvite.current = null;
                        }
                      }}
                    >
                      초대 링크 폐기
                    </button>
                  </>
                )}
              </aside>
            </div>
          </>
        );
      }}
    </QueryState>
  );
}
export function MatchPage() {
  const [params] = useSearchParams();
  const ticketId = params.get('ticket'),
    proposalId = params.get('proposal');
  const kind = useQuery({
    queryKey: ['match-route-kind', ticketId, proposalId],
    queryFn: () => get<{ gameType?: string }>(ticketId ? `/match-tickets/${ticketId}` : `/match-proposals/${proposalId}`),
    enabled: !!(ticketId || proposalId)
  });
  if ((ticketId || proposalId) && kind.isPending) return <p>매칭을 확인하고 있어요…</p>;
  const gameType = params.get('gameType') ?? kind.data?.gameType;
  return gameType && gameType !== 'MURDER_MYSTERY' ? <BoardMatchPage /> : <MurderMatchPage />;
}
function MurderMatchPage() {
  const [params, setParams] = useSearchParams();
  const ticketId = params.get('ticket');
  const explicitProposal = params.get('proposal');
  const [maxMinutes, setMinutes] = useState(90);
  const [mode, setMode] = useState<PlayMode>('TEXT');
  const [genre, setGenre] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [requeue, setRequeue] = useState(true);
  const action = useCommand();
  const navigate = useNavigate();
  const user = useUser();
  const [now, setNow] = useState(Date.now());
  const activity = useQuery({ queryKey: ['activity'], queryFn: () => get<Activity>('/me/activity'), refetchInterval: 15000 });
  const ticket = useQuery({ queryKey: ['ticket', ticketId], queryFn: () => get<Ticket>(`/match-tickets/${ticketId}`), enabled: !!ticketId, refetchInterval: 3000 });
  const proposalId = explicitProposal ?? ticket.data?.proposalId;
  const proposal = useQuery({ queryKey: ['proposal', proposalId], queryFn: () => get<Proposal>(`/match-proposals/${proposalId}`), enabled: !!proposalId, refetchInterval: 3000 });
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (proposal.data?.roomId) navigate(`/rooms/${proposal.data.roomId}`, { replace: true });
  }, [proposal.data?.roomId, navigate]);
  useEffect(() => {
    if (((!ticketId && !explicitProposal) || (explicitProposal && proposal.data?.status === 'ENDED')) && activity.data && activity.data.kind !== 'IDLE') {
      navigate(activityPath(activity.data.kind, activity.data.referenceId), { replace: true });
    }
  }, [ticketId, explicitProposal, proposal.data?.status, activity.data, navigate]);
  async function queue(e: FormEvent) {
    e.preventDefault();
    const result = await action.run<{ ticketId: string }>('POST', '/match-tickets', { language: 'ko', maxMinutes, mode, genre: genre || undefined, difficulty: difficulty || undefined, requeue });
    if (result) setParams({ ticket: result.ticketId });
  }
  async function cancel() {
    if (ticketId && (await action.run('DELETE', `/match-tickets/${ticketId}`))) setParams({});
  }
  async function reject() {
    if (await action.run('POST', `/match-proposals/${proposalId}/reject`)) setParams({});
  }
  if ((ticketId && ticket.isPending) || (explicitProposal && proposal.isPending))
    return (
      <div className={s.loading} role="status">
        현재 매칭 상태를 확인하고 있어요…
      </div>
    );
  return (
    <>
      <PageTitle eyebrow="서로 다른 네 사람이 만드는 한 이야기" title="바로 매칭">
        모두에게 새로운 작품이 있는 4인 그룹을 찾습니다. <Link to="/match?gameType=TABLETOP">보드게임 매칭 →</Link>
      </PageTitle>
      <ErrorNotice message={action.error} />
      {proposalId && proposal.data && !['ENDED', 'ROOM'].includes(proposal.data.status) ? (
        <section className={s.panel}>
          <div className={s.sectionHeading}>
            <h2>{proposal.data.status === 'ACCEPTING' ? '함께할 그룹을 찾았어요.' : '플레이할 작품에 투표해 주세요.'}</h2>
            <Deadline endsAt={proposal.data.expiresAt} />
          </div>
          <div className={s.memberChips}>
            {proposal.data.members.map((member) => (
              <Badge key={member.userId}>
                {member.displayName} · {member.accepted ? '수락 완료' : '수락 대기'}
              </Badge>
            ))}
          </div>
          {proposal.data.status === 'ACCEPTING' ? (
            <div className={s.actions}>
              <button
                className={s.primary}
                disabled={action.pending || proposal.data.members.find((m) => m.userId === user.id)?.accepted}
                onClick={() => void action.run('POST', `/match-proposals/${proposalId}/accept`)}
              >
                참가 수락
              </button>
              <button disabled={action.pending} onClick={() => void reject()}>
                거절
              </button>
            </div>
          ) : (
            <>
              <p className={s.note}>동률이면 표시된 추천 순위를 따릅니다. 전원 미투표 시 시작하지 않습니다.</p>
              <div className={s.cards}>
                {proposal.data.candidates.map((candidate) => (
                  <ScenarioCard
                    key={candidate.versionId}
                    scenario={candidate}
                    action={
                      <button
                        disabled={action.pending}
                        className={proposal.data?.myVote === candidate.versionId ? s.selected : s.primary}
                        onClick={() => void action.run('PUT', `/match-proposals/${proposalId}/scenario-vote`, { scenarioVersionId: candidate.versionId })}
                      >
                        {proposal.data?.myVote === candidate.versionId ? '✓ 투표한 작품' : '이 작품에 투표'}
                      </button>
                    }
                  />
                ))}
              </div>
              <button className={s.ghost} disabled={action.pending} onClick={() => void reject()}>
                선택 나가기
              </button>
            </>
          )}
        </section>
      ) : ticketId && ticket.data && !['CANCELLED', 'ROOM'].includes(ticket.data.status) ? (
        <section className={`${s.panel} ${s.waiting}`}>
          <span className={s.waitingIcon}>◌</span>
          <h2>함께할 사람을 찾고 있어요.</h2>
          <p>
            대기한 시간 <strong>{Math.max(0, Math.floor((now - Date.parse(ticket.data.queuedAt)) / 1000))}초</strong>
          </p>
          <p>조건에 맞는 참가자와 모두가 플레이할 수 있는 작품이 모이면 알려드릴게요.</p>
          <p className={s.note}>
            {ticket.data.language === 'ko' ? '한국어' : ticket.data.language} · {ticket.data.maxMinutes}분 이내 · {ticket.data.mode === 'TEXT' ? '텍스트' : 'Discord 음성'}
            {ticket.data.genre ? ` · ${ticket.data.genre} 선호` : ''}
            {ticket.data.difficulty ? ` · ${difficultyNames[ticket.data.difficulty]} 선호` : ''}
            <br />
            {ticket.data.requeue ? '다른 참가자가 거절하면 기존 순서로 다시 대기합니다.' : '그룹이 해제되면 대기를 종료합니다.'}
          </p>
          <p className={s.muted}>실제 참가자 4명이 필요합니다. 인원이 부족하면 계속 대기합니다.</p>
          <button disabled={action.pending} onClick={() => void cancel()}>
            대기 취소
          </button>
        </section>
      ) : (
        <section className={`${s.panel} ${s.narrow}`}>
          <h2>어떤 플레이를 원하세요?</h2>
          {proposal.data?.status === 'ENDED' && <p className={s.note}>이전 제안이 종료되었습니다. 재대기에 동의했다면 기존 티켓 상태를 확인해 주세요.</p>}
          <form onSubmit={(e) => void queue(e)} className={s.form}>
            <label>
              언어
              <select>
                <option>한국어</option>
              </select>
            </label>
            <label>
              플레이 가능한 시간
              <select value={maxMinutes} onChange={(e) => setMinutes(Number(e.target.value))}>
                <option value={45}>45분</option>
                <option value={60}>60분</option>
                <option value={90}>90분</option>
                <option value={120}>120분</option>
              </select>
            </label>
            <ModeSelect value={mode} onChange={setMode} />
            <label>
              선호 장르 (선택)
              <input value={genre} maxLength={40} onChange={(e) => setGenre(e.target.value)} placeholder="상관없음" />
            </label>
            <label>
              선호 난이도 (선택)
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option value="">상관없음</option>
                {Object.entries(difficultyNames).map(([id, name]) => (
                  <option value={id} key={id}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label className={s.check}>
              <input type="checkbox" checked={requeue} onChange={(e) => setRequeue(e.target.checked)} />
              다른 참가자가 거절하면 기존 순서로 다시 대기
            </label>
            <button className={s.primary} disabled={action.pending}>
              4인 매칭 시작
            </button>
          </form>
        </section>
      )}
      {ticket.isError && <ErrorNotice message={errorMessage(ticket.error)} />}
      {proposal.isError && <ErrorNotice message={errorMessage(proposal.error)} />}
    </>
  );
}
type DiscordAccount = { provider: string; configured: boolean; botReady: boolean; linked: boolean; discordUserId: string | null; displayName: string | null; eligible: boolean; reason: string | null };
const discordReasonMessages: Record<string, string> = {
  NOT_LINKED: 'Discord 계정을 연결하면 음성 게임 참가 가능 여부를 확인할 수 있습니다.',
  BOT_UNAVAILABLE: 'Discord 음성 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.',
  PRIVILEGED_ACCOUNT: '서버 소유자가 아닌 관리 권한 계정은 음성 게임에 참가할 수 없습니다.',
  MEMBERSHIP_PENDING: 'Discord 서버의 가입 절차를 완료해 주세요.',
  NOT_GUILD_MEMBER: '음성 게임에 참가하려면 전용 Discord 서버에 먼저 참가해 주세요.'
};
export function AccountPage() {
  const user = useUser();
  const action = useCommand();
  const [page, setPage] = useState(0);
  const [blockId, setBlockId] = useState('');
  const [reportTarget, setReportTarget] = useState('');
  const [reason, setReason] = useState('');
  const [notice, setNotice] = useState('');
  const history = useQuery({ queryKey: ['history', page], queryFn: () => get<Page<History>>(`/me/history?page=${page}&size=20`) });
  const blocks = useQuery({ queryKey: ['blocks'], queryFn: () => get<Page<Block> | Block[]>('/me/blocks') });
  const discord = useQuery({ queryKey: ['discord'], queryFn: () => get<DiscordAccount>('/me/discord') });
  async function linkDiscord() {
    const result = await action.run<{ authorizeUrl: string }>('POST', '/me/discord/link');
    if (result) {
      const url = new URL(result.authorizeUrl);
      if (url.protocol === 'https:' && ['discord.com', 'www.discord.com'].includes(url.hostname)) location.assign(url.href);
    }
  }
  return (
    <>
      <PageTitle eyebrow="나의 기록" title={`${user.displayName} 님의 서재`}>
        {user.email || '이메일 정보가 제공되지 않았어요.'}
      </PageTitle>
      <ErrorNotice message={action.error} />
      {notice && (
        <p className={s.success} role="status">
          {notice}
        </p>
      )}
      <div className={s.detailGrid}>
        <section className={s.panel}>
          <h2>플레이 기록</h2>
          <QueryState query={history}>
            {(data) => (
              <>
                {data.items.length ? (
                  data.items.map((item) => (
                    <Link key={item.gameId} to={`/games/${item.gameId}`} className={s.historyRow}>
                      <strong>{item.title}</strong>
                      <Badge>{item.status === 'COMPLETED' ? '완료' : item.status === 'ABORTED' ? '중단' : '진행 중'}</Badge>
                      <small>{item.completedAt ? new Date(item.completedAt).toLocaleDateString('ko-KR') : ''}</small>
                    </Link>
                  ))
                ) : (
                  <Empty>첫 번째 이야기를 기다리고 있어요.</Empty>
                )}
                <div className={s.pagination}>
                  <button disabled={!page} onClick={() => setPage(page - 1)}>
                    이전
                  </button>
                  <button disabled={(page + 1) * data.size >= data.total} onClick={() => setPage(page + 1)}>
                    다음
                  </button>
                </div>
              </>
            )}
          </QueryState>
        </section>
        <section className={s.panel}>
          <h2>Discord 음성 연결</h2>
          <QueryState query={discord}>
            {(data) => (
              <>
                <p>{data.linked ? `${data.displayName} 계정이 연결되었습니다.` : '음성 모드 참가 시 Discord 계정을 연결해 주세요.'}</p>
                <Badge>{!data.configured ? '미설정' : data.botReady ? '서비스 연결됨' : '봇 연결 확인 중'}</Badge>
                {data.reason && <p className={s.note}>{discordReasonMessages[data.reason] ?? '음성 게임 참가 조건을 확인해 주세요.'}</p>}
                {data.configured && <p className={s.note}>서버 소유자도 참가할 수 있습니다. 소유자는 Discord 권한상 모든 음성 채널에 접근할 수 있습니다.</p>}
                <p>최초 통화 입장, 마이크 허용·기기 선택·음소거는 Discord에서 합니다. 웹에서는 방 권한과 이동 상태를 확인합니다.</p>
                {data.linked ? (
                  <button disabled={action.pending} onClick={() => void action.run('DELETE', '/me/discord')}>
                    계정 연결 해제
                  </button>
                ) : (
                  <button disabled={!data.configured || action.pending} onClick={() => void linkDiscord()}>
                    Discord 계정 연결
                  </button>
                )}
              </>
            )}
          </QueryState>
        </section>
        <section className={s.panel}>
          <h2>차단한 이용자</h2>
          <QueryState query={blocks}>
            {(data) =>
              listItems(data).length ? (
                listItems(data).map((block) => (
                  <div className={s.historyRow} key={block.userId}>
                    <span>{block.displayName ?? block.userId}</span>
                    <button disabled={action.pending} onClick={() => void action.run('DELETE', `/me/blocks/${block.userId}`)}>
                      차단 해제
                    </button>
                  </div>
                ))
              ) : (
                <p>차단한 이용자가 없습니다.</p>
              )
            }
          </QueryState>
          <form
            className={s.form}
            onSubmit={async (e) => {
              e.preventDefault();
              if (await action.run('POST', '/me/blocks', { userId: blockId })) setBlockId('');
            }}
          >
            <label>
              차단할 이용자 ID
              <input required value={blockId} onChange={(e) => setBlockId(e.target.value)} />
            </label>
            <button disabled={action.pending}>이용자 차단</button>
          </form>
        </section>
        <section className={s.panel}>
          <h2>신고하기</h2>
          <form
            className={s.form}
            onSubmit={async (e) => {
              e.preventDefault();
              if (await action.run('POST', '/reports', { targetUserId: reportTarget || undefined, reason })) {
                setReason('');
                setNotice('신고를 접수했습니다. 관리자가 확인합니다.');
              }
            }}
          >
            <label>
              대상 이용자 ID (선택)
              <input value={reportTarget} onChange={(e) => setReportTarget(e.target.value)} />
            </label>
            <label>
              신고 내용
              <textarea required minLength={5} maxLength={2000} value={reason} onChange={(e) => setReason(e.target.value)} />
            </label>
            <button disabled={action.pending}>신고 접수</button>
          </form>
        </section>
      </div>
    </>
  );
}
export function AdminPage() {
  const [definition, setDefinition] = useState('');
  const [notice, setNotice] = useState('');
  const [parseError, setParseError] = useState('');
  const [scenarioPage, setScenarioPage] = useState(0);
  const [reportPage, setReportPage] = useState(0);
  const action = useCommand();
  const scenarios = useQuery({ queryKey: ['admin-scenarios', scenarioPage], queryFn: () => get<Page<AdminScenario>>(`/admin/scenarios?page=${scenarioPage}&size=20`) });
  const reports = useQuery({ queryKey: ['admin-reports', reportPage], queryFn: () => get<Page<Report>>(`/admin/reports?page=${reportPage}&size=20`) });
  async function submit(validate: boolean) {
    setParseError('');
    setNotice('');
    let parsed: unknown;
    try {
      parsed = JSON.parse(definition);
    } catch {
      setParseError('올바른 JSON 형식으로 입력해 주세요.');
      return;
    }
    const result = await action.run('POST', `/admin/scenarios${validate ? '/validate' : ''}`, { definition: parsed });
    if (result) setNotice(validate ? '작품 검증을 통과했습니다.' : '초안이 등록되었습니다. 목록에서 공개할 수 있습니다.');
  }
  return (
    <>
      <Suspense fallback={<p>검수 목록을 불러오는 중…</p>}>
        <ReviewList />
      </Suspense>
      <PageTitle eyebrow="관리자" title="작품과 신고 관리">
        공개된 작품 버전은 수정되지 않습니다. 변경된 작품은 새 버전으로 등록하세요.
      </PageTitle>
      <ErrorNotice message={action.error || parseError} />
      {notice && (
        <p className={s.success} role="status">
          {notice}
        </p>
      )}
      <div className={s.detailGrid}>
        <section className={s.panel}>
          <h2>작품 JSON 등록</h2>
          <label>
            JSON 파일 불러오기
            <input
              type="file"
              accept=".json,application/json"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.size > 900_000) setParseError('900KB 이하 파일을 선택해 주세요.');
                  else setDefinition(await file.text());
                }
              }}
            />
          </label>
          <label>
            작품 정의
            <textarea className={s.jsonInput} value={definition} onChange={(e) => setDefinition(e.target.value)} spellCheck={false} />
          </label>
          <div className={s.actions}>
            <button disabled={action.pending || !definition.trim()} onClick={() => void submit(true)}>
              검증
            </button>
            <button className={s.primary} disabled={action.pending || !definition.trim()} onClick={() => void submit(false)}>
              초안 등록
            </button>
          </div>
        </section>
        <section className={s.panel}>
          <h2>등록한 작품</h2>
          <QueryState query={scenarios}>
            {(data) =>
              listItems(data).map((item) => (
                <div className={s.historyRow} key={item.versionId ?? item.id}>
                  <div>
                    <strong>{item.title}</strong>
                    <small>
                      {' '}
                      v{item.version} · {item.status}
                    </small>
                  </div>
                  {item.status !== 'PUBLISHED' && (
                    <button disabled={action.pending} onClick={() => void action.run('POST', `/admin/scenarios/${item.versionId ?? item.id}/publish`)}>
                      공개
                    </button>
                  )}
                </div>
              ))
            }
          </QueryState>
          <div className={s.pagination}>
            <button disabled={!scenarioPage} onClick={() => setScenarioPage(scenarioPage - 1)}>
              이전 작품
            </button>
            <button disabled={!scenarios.data || (scenarioPage + 1) * scenarios.data.size >= scenarios.data.total} onClick={() => setScenarioPage(scenarioPage + 1)}>
              다음 작품
            </button>
          </div>
        </section>
      </div>
      <section className={`${s.panel} ${s.section}`}>
        <h2>접수된 신고</h2>
        <QueryState query={reports}>
          {(data) =>
            listItems(data).length ? (
              listItems(data).map((report) => (
                <article key={report.id} className={s.reportRow}>
                  <Badge>{report.status}</Badge>
                  <p>{report.reason}</p>
                  <small>{new Date(report.createdAt).toLocaleString('ko-KR')}</small>
                </article>
              ))
            ) : (
              <Empty>접수된 신고가 없습니다.</Empty>
            )
          }
        </QueryState>
        <div className={s.pagination}>
          <button disabled={!reportPage} onClick={() => setReportPage(reportPage - 1)}>
            이전 신고
          </button>
          <button disabled={!reports.data || (reportPage + 1) * reports.data.size >= reports.data.total} onClick={() => setReportPage(reportPage + 1)}>
            다음 신고
          </button>
        </div>
      </section>
    </>
  );
}
