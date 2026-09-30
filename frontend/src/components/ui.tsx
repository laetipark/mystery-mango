import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { UseQueryResult } from '@tanstack/react-query';
import type { Scenario, User } from '~/common/types';
import { clockText, difficultyNames, secondsUntil } from '~/common/time';
import { errorMessage } from '~/services/api';
import s from '~/styles/app.module.scss';

export const UserContext = createContext<User | null>(null);
export const useUser = () => useContext(UserContext)!;
export function ErrorNotice({ message }: { message?: string }) {
  return message ? (
    <div className={s.error} role="alert">
      {message}
    </div>
  ) : null;
}
export function Empty({ children }: { children: ReactNode }) {
  return <div className={s.empty}>{children}</div>;
}
export function QueryState<T>({ query, children }: { query: UseQueryResult<T>; children: (data: T) => ReactNode }) {
  if (query.isPending)
    return (
      <div className={s.loading} role="status">
        내용을 불러오고 있어요…
      </div>
    );
  if (query.isError)
    return (
      <div className={s.panel}>
        <ErrorNotice message={errorMessage(query.error)} />
        <button onClick={() => void query.refetch()}>다시 시도</button>
      </div>
    );
  return <>{children(query.data)}</>;
}
export function PageTitle({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <header className={s.pageTitle}>
      {eyebrow && <span className={s.eyebrow}>{eyebrow}</span>}
      <h1>{title}</h1>
      {children && <p>{children}</p>}
    </header>
  );
}
export function Badge({ children }: { children: ReactNode }) {
  return <span className={s.badge}>{children}</span>;
}
export function ScenarioCard({ scenario, action }: { scenario: Scenario; action?: ReactNode }) {
  return (
    <article className={s.scenarioCard}>
      <div className={s.cardArt} aria-hidden="true">
        <span>?</span>
        <span>{scenario.genre}</span>
      </div>
      <div className={s.cardBody}>
        <div className={s.row}>
          <Badge>{difficultyNames[scenario.difficulty] ?? scenario.difficulty}</Badge>
          {scenario.rank !== undefined && <Badge>추천 {scenario.rank + 1}순위</Badge>}
          <span className={s.muted}>
            {scenario.playerCount}명 · 약 {scenario.estimatedMinutes}분*
          </span>
        </div>
        <h2>
          <Link to={`/scenarios/${scenario.id}`}>{scenario.title}</Link>
        </h2>
        <p>{scenario.synopsis}</p>
        <div className={s.cardFooter}>
          <span className={s.muted}>* 샘플 작품 시간은 추정값</span>
          {action ?? (
            <Link to={`/scenarios/${scenario.id}`} className={s.textLink}>
              작품 살펴보기 ↗
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
export function Deadline({ endsAt, serverTime }: { endsAt: string; serverTime?: string }) {
  const [sample, setSample] = useState(() => ({ at: Date.now(), serverAt: serverTime ? Date.parse(serverTime) : Date.now() }));
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    setSample({ at: Date.now(), serverAt: serverTime ? Date.parse(serverTime) : Date.now() });
  }, [serverTime]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const left = secondsUntil(endsAt, sample.serverAt + now - sample.at);
  return (
    <span className={s.timer} aria-label={`남은 시간 ${clockText(left)}`}>
      {left === 0 ? '서버 결과 확인 중' : clockText(left)}
    </span>
  );
}
