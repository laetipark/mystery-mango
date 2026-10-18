import { useQueries } from '@tanstack/react-query';
import { get } from '~/services/api';
import type { Data, SandboxSnapshot } from './types';
import s from './sandbox-views.module.scss';

/** 작품 소유자의 시험 세션만 사용한다. 열람 판정은 각 자리의 서버 응답을 따른다. */
export function SandboxViews({ id, capacity }: { id: string; capacity: number }) {
  const queries = useQueries({
    queries: Array.from({ length: capacity }, (_, seat) => ({
      queryKey: ['sandbox', id, seat],
      queryFn: () => get<SandboxSnapshot>(`/author/sandboxes/${id}?seat=${seat}`),
      refetchOnWindowFocus: false
    }))
  });
  return (
    <section className={s.comparison} aria-label="역할별 자료 비교">
      <header>
        <span>AUTHOR VIEW</span>
        <h2>역할마다 보이는 자료를 확인하세요</h2>
        <p>동일한 시험의 각 자리에서 서버가 제공한 자료입니다. 플레이 조작은 현재 자리를 선택해 진행하세요.</p>
      </header>
      <div className={s.cards}>
        {queries.map((query, seat) => {
          if (query.isPending)
            return (
              <article key={seat}>
                <p role="status">{seat + 1}번 자리 자료를 불러오는 중…</p>
              </article>
            );
          if (query.isError)
            return (
              <article key={seat}>
                <p role="alert">{seat + 1}번 자리 자료를 불러오지 못했습니다.</p>
                <button onClick={() => void query.refetch()}>다시 불러오기</button>
              </article>
            );
          const state = query.data.state as Data,
            role = state.myRole as Data,
            phase = state.phase as Data;
          const clues = (state.clues ?? []) as Data[],
            materials = (state.materials ?? []) as Data[];
          return (
            <article key={seat} aria-label={`${String(role.name)}의 자료`}>
              <div className={s.person}>
                <span>{String.fromCharCode(65 + seat)}</span>
                <div>
                  <h3>{String(role.name)}</h3>
                  <small>
                    {seat + 1}번 자리 ·{' '}
                    {({ READING: '자료 읽기', INVESTIGATION: '조사', DISCUSSION: '토론', VOTE: '투표', ENDING: '엔딩' } as Record<string, string>)[String(phase.kind)] ?? String(phase.kind)}
                  </small>
                </div>
                <em>서버 시험</em>
              </div>
              <div className={s.private}>
                <small>나에게만 공개 · 역할 자료</small>
                <p>{String(role.secret ?? '')}</p>
              </div>
              {clues.map((clue) => (
                <div key={String(clue.id)} className={clue.public ? s.public : s.private}>
                  <small>{clue.public ? '공개 단서' : '이 자리에서 열람 가능'}</small>
                  <strong>{String(clue.title)}</strong>
                  <p>{String(clue.text)}</p>
                </div>
              ))}
              {materials.map((material) => (
                <div key={String(material.id)} className={s.public}>
                  <small>공개 자료</small>
                  <p>{String(material.text)}</p>
                </div>
              ))}
              {!clues.length && !materials.length && <p className={s.empty}>아직 확보하거나 공개한 단서가 없습니다.</p>}
              <footer>이 자리의 응답만 표시 · 개별 열람 범위 확인</footer>
            </article>
          );
        })}
      </div>
      <p className={s.note}>자료 비교는 작품 소유자의 시험 기능입니다. 실제 참가자는 자신의 자료만 볼 수 있습니다.</p>
    </section>
  );
}
