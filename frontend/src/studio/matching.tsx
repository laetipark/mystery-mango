import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCommand } from '~/hooks/use-command';
import { errorMessage, get, http } from '~/services/api';
import type { Page, Scenario, Ticket, Proposal } from '~/common/types';
import { Deadline, ErrorNotice, PageTitle, useUser } from '~/components/ui';
import { gameTypeNames, type GameType } from './types';
import s from './studio.module.scss';
import m from './matching.module.scss';

const catalogKey = ['scenarios', 'board-match', 'all', 'partial'] as const;
const boardTypes: GameType[] = ['TABLETOP', 'YACHT', 'GOMOKU', 'REVERSI', 'CHECKERS'];
type BoardCatalog = { items: Scenario[]; failedTypes: { gameType: GameType; message: string }[] };
async function boardCatalog(signal: AbortSignal, previous?: BoardCatalog): Promise<BoardCatalog> {
  const byType = await Promise.all(
    boardTypes.map(async (gameType) => {
      const items: Scenario[] = [];
      let page = 0;
      try {
        for (;;) {
          signal.throwIfAborted();
          const { data } = await http.get<Page<Scenario>>('/scenarios', { params: { gameType, size: 50, page }, signal });
          items.push(...data.items);
          if ((data.page + 1) * data.size >= data.total) return { items, failedTypes: [] };
          if (!data.items.length) throw new Error('작품 목록이 변경되었습니다. 다시 불러와 주세요.');
          page++;
        }
      } catch (error) {
        if (signal.aborted || axios.isCancel(error)) throw error;
        // Keep pages already loaded, including earlier successful reads of this type.
        // Selecting a work still checks its current public detail independently.
        return { items: [...(previous?.items.filter((item) => item.gameType === gameType) ?? []), ...items], failedTypes: [{ gameType, message: errorMessage(error) }] };
      }
    })
  );
  signal.throwIfAborted();
  return {
    items: [...new Map(byType.flatMap((result) => result.items).map((item) => [item.id, item])).values()].sort((a, b) => a.title.localeCompare(b.title, 'ko')),
    failedTypes: byType.flatMap((result) => result.failedTypes)
  };
}

export function BoardMatchPage() {
  const cache = useQueryClient();
  const [params, setParams] = useSearchParams(),
    navigate = useNavigate(),
    user = useUser(),
    action = useCommand();
  const [capacity, setCapacity] = useState(2),
    [mode, setMode] = useState('TEXT'),
    [requeue, setRequeue] = useState(true),
    [search, setSearch] = useState('');
  const scenario = params.get('scenario'),
    ticketId = params.get('ticket');
  const catalog = useQuery({
    queryKey: catalogKey,
    queryFn: ({ signal }) => boardCatalog(signal, cache.getQueryData<BoardCatalog>(catalogKey)),
    retry: false,
    staleTime: 30000
  });
  const detail = useQuery({
    queryKey: ['scenario', scenario, 'board-match'],
    queryFn: () => get<Scenario>(`/scenarios/${encodeURIComponent(scenario!)}`),
    enabled: !!scenario,
    retry: false,
    refetchOnWindowFocus: false
  });
  const selected = detail.isSuccess ? detail.data : undefined;
  const eligible = !!selected?.gameType && boardTypes.includes(selected.gameType) && (selected.supportedPlayerCounts ?? [selected.playerCount]).some((n) => n >= 2);
  const filtered = (catalog.data?.items ?? []).filter((item) => item.title.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  const options = selected && !filtered.some((item) => item.id === selected.id) ? [selected, ...filtered] : filtered;
  function selectScenario(id: string) {
    setParams({ gameType: 'TABLETOP', ...(id ? { scenario: id } : {}) });
  }

  const ticket = useQuery({ queryKey: ['ticket', ticketId], queryFn: () => get<Ticket>(`/match-tickets/${ticketId}`), enabled: !!ticketId, refetchInterval: 3000 });
  const proposalId = params.get('proposal') ?? ticket.data?.proposalId;
  const proposal = useQuery({ queryKey: ['proposal', proposalId], queryFn: () => get<Proposal>(`/match-proposals/${proposalId}`), enabled: !!proposalId, refetchInterval: 3000 });
  useEffect(() => {
    if (proposal.data?.roomId) navigate(`/rooms/${proposal.data.roomId}`, { replace: true });
  }, [proposal.data?.roomId, navigate]);
  const counts = eligible ? (selected!.supportedPlayerCounts ?? [selected!.playerCount]).filter((n) => n >= 2) : [],
    chosen = counts.includes(capacity) ? capacity : counts[0],
    chosenMode = selected?.modes.includes(mode as 'TEXT' | 'DISCORD') ? mode : (selected?.modes[0] ?? '');
  return (
    <div className={s.studio}>
      <PageTitle title="보드게임 매칭">같은 작품·인원·대화 방식을 선택한 참가자를 모읍니다. 이전에 플레이한 작품도 다시 즐길 수 있습니다.</PageTitle>
      <Link to="/match">머더미스터리 매칭 →</Link>
      <ErrorNotice message={action.error} />
      {proposal.data && proposal.data.status === 'ACCEPTING' ? (
        <section className={s.panel}>
          <h2>함께할 그룹을 찾았어요</h2>
          <Deadline endsAt={proposal.data.expiresAt} />
          <p>{proposal.data.members.map((m) => `${m.displayName}: ${m.accepted ? '수락' : '대기'}`).join(' · ')}</p>
          <button disabled={action.pending || proposal.data.members.find((m) => m.userId === user.id)?.accepted} onClick={() => void action.run('POST', `/match-proposals/${proposalId}/accept`)}>
            참가 수락
          </button>
          <button
            disabled={action.pending}
            onClick={async () => {
              if (await action.run('POST', `/match-proposals/${proposalId}/reject`)) setParams({ gameType: 'TABLETOP' });
            }}
          >
            거절
          </button>
          <p>전원이 수락하면 선택한 작품의 대기실로 이동합니다.</p>
        </section>
      ) : ticket.data && ['WAITING', 'PROPOSED'].includes(ticket.data.status) ? (
        <section className={s.panel}>
          <h2>함께할 사람을 찾고 있어요</h2>
          <p>
            {ticket.data.capacity}명 · {ticket.data.mode} · {new Date(ticket.data.queuedAt).toLocaleTimeString('ko-KR')}부터 대기
          </p>
          <button
            disabled={action.pending}
            onClick={async () => {
              if (await action.run('DELETE', `/match-tickets/${ticketId}`)) setParams({ gameType: 'TABLETOP', ...(scenario ? { scenario } : {}) });
            }}
          >
            대기 취소
          </button>
        </section>
      ) : (
        <section className={`${s.panel} ${m.form}`} aria-label="매칭할 작품 선택">
          <div className={m.heading}>
            <h2>함께할 작품을 골라주세요</h2>
            <p>공개된 보드게임 전체를 제목으로 찾을 수 있어요. 작품을 고르면 지원하는 인원과 대화 방식이 나타납니다.</p>
          </div>
          <label>
            작품 검색
            <input type="search" value={search} placeholder="작품 제목으로 검색" onChange={(e) => setSearch(e.target.value)} />
          </label>
          {catalog.isPending && <p role="status">공개 작품 전체를 불러오고 있어요…</p>}
          {catalog.isError && (
            <div className={m.notice}>
              <ErrorNotice message={`작품 목록을 모두 불러오지 못했습니다. ${errorMessage(catalog.error)}`} />
              <button onClick={() => void catalog.refetch()}>작품 목록 다시 불러오기</button>
            </div>
          )}
          {!!catalog.data?.failedTypes.length && (
            <div className={m.notice} role="alert">
              <p>작품 목록을 모두 불러오지 못했습니다. 불러온 작품은 선택할 수 있지만 검색 결과에 일부 작품이 빠질 수 있어요.</p>
              <ul>
                {catalog.data.failedTypes.map(({ gameType, message }) => (
                  <li key={gameType}>
                    {gameTypeNames[gameType]} · {message}
                  </li>
                ))}
              </ul>
              <button disabled={catalog.isFetching} onClick={() => void catalog.refetch()}>
                {catalog.isFetching ? '목록 다시 확인 중…' : '작품 목록 다시 불러오기'}
              </button>
            </div>
          )}
          {catalog.isSuccess && (
            <p className={m.hint} role="status">
              {catalog.data.failedTypes.length
                ? `${search.trim() ? `검색 결과 ${filtered.length}개 · ` : ''}불러온 작품 ${catalog.data.items.length}개 · 일부 목록 미확인`
                : search.trim()
                  ? `검색 결과 ${filtered.length}개 · 전체 ${catalog.data.items.length}개`
                  : `선택할 수 있는 공개 작품 ${catalog.data.items.length}개`}
            </p>
          )}
          <label>
            작품
            <select aria-label="작품" value={scenario ?? ''} onChange={(e) => selectScenario(e.target.value)}>
              <option value="">작품을 선택하세요</option>
              {scenario && !options.some((item) => item.id === scenario) && <option value={scenario}>{detail.isPending ? '선택한 작품 확인 중…' : '선택한 작품을 확인할 수 없어요'}</option>}
              {options.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title} · {gameTypeNames[item.gameType ?? 'TABLETOP']}
                </option>
              ))}
            </select>
          </label>
          {scenario && detail.isPending && <p role="status">선택한 작품의 공개 버전을 확인하고 있어요…</p>}
          {scenario && detail.isError && (
            <div className={m.notice} role="alert">
              <p>이 작품의 공개 정보를 확인할 수 없습니다. 공개가 종료되었거나 주소가 올바르지 않을 수 있어요.</p>
              <p>{errorMessage(detail.error)}</p>
              <div>
                <button onClick={() => void detail.refetch()}>선택 작품 다시 확인</button>
                <button onClick={() => selectScenario('')}>작품 선택 해제</button>
              </div>
            </div>
          )}
          {selected && !eligible && (
            <p className={m.notice} role="alert">
              이 작품은 보드게임 자동 매칭 대상이 아닙니다. 2명 이상이 함께할 수 있는 보드게임을 선택해 주세요.
            </p>
          )}
          {selected && eligible && (
            <div className={m.selected}>
              <strong>{selected.title}</strong>
              <p>{selected.synopsis}</p>
              <Link to={`/scenarios/${selected.id}`}>작품 자세히 보기 →</Link>
            </div>
          )}
          <div className={m.options}>
            <label>
              인원
              <select aria-label="인원" value={chosen ?? ''} disabled={!eligible} onChange={(e) => setCapacity(Number(e.target.value))}>
                {!counts.length && <option value="">작품 선택 후 표시</option>}
                {counts.map((n) => (
                  <option value={n} key={n}>
                    {n}명
                  </option>
                ))}
              </select>
            </label>
            <label>
              대화 방식
              <select aria-label="대화 방식" value={chosenMode} disabled={!eligible} onChange={(e) => setMode(e.target.value)}>
                {!selected?.modes.length && <option value="">작품 선택 후 표시</option>}
                {(selected?.modes ?? []).map((value) => (
                  <option key={value} value={value}>
                    {value === 'TEXT' ? '텍스트 채팅' : 'Discord 음성 + 텍스트'}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className={m.check}>
            <input type="checkbox" checked={requeue} onChange={(e) => setRequeue(e.target.checked)} />
            다른 참가자가 거절하면 원래 순서로 다시 대기
          </label>
          <button
            disabled={!eligible || !chosen || !chosenMode || action.pending}
            onClick={async () => {
              if (!selected || !eligible) return;
              const result = await action.run<{ ticketId: string }>('POST', '/match-tickets', {
                gameType: selected.gameType,
                scenarioVersionId: selected.versionId,
                capacity: chosen,
                language: selected.language,
                mode: chosenMode,
                maxMinutes: Math.min(360, selected.estimatedMinutes),
                requeue
              });
              if (result) setParams({ gameType: selected.gameType ?? 'TABLETOP', ticket: result.ticketId, ...(scenario ? { scenario } : {}) });
            }}
          >
            매칭 시작
          </button>
        </section>
      )}
    </div>
  );
}
