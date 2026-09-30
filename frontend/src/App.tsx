import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, Navigate, NavLink, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import type { Activity, User } from '~/common/types';
import { activityPath } from '~/common/time';
import { command, errorMessage, get, resetCsrf, sessionExpiredEvent, sessionRestoredEvent } from '~/services/api';
import { ErrorNotice, UserContext, useUser } from '~/components/ui';
import { useEvents } from '~/hooks/use-events';
import { HomePage, AuthPage, CatalogPage, ScenarioPage, RoomsPage, LobbyPage, MatchPage, AccountPage, AdminPage } from '~/pages/pages';
import { GamePage } from '~/pages/game';
import s from '~/styles/app.module.scss';

function SignedIn() {
  const user = useUser();
  const location = useLocation();
  return user ? <Outlet /> : <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
}
function AdminOnly() {
  const user = useUser();
  return user?.admin ? <Outlet /> : <div className={s.empty}>관리자 권한이 필요합니다.</div>;
}
function Layout() {
  const user = useUser();
  const cache = useQueryClient();
  const navigate = useNavigate();
  const [logoutError, setLogoutError] = useState('');
  const connection = useEvents(user?.id);
  const activity = useQuery({ queryKey: ['activity'], queryFn: () => get<Activity>('/me/activity'), enabled: !!user, refetchInterval: 15000 });
  async function logout() {
    try {
      await command('POST', '/auth/logout', {});
      resetCsrf();
      cache.clear();
      navigate('/');
      window.location.reload();
    } catch (error) {
      setLogoutError(errorMessage(error));
    }
  }
  return (
    <>
      <a className={s.skip} href="#main">
        본문 바로가기
      </a>
      <header className={s.siteHeader}>
        <Link to="/" className={s.brand}>
          <span className={s.logo} aria-hidden="true">
            m
          </span>
          미스터리 망고<span className={s.beta}>MVP</span>
        </Link>
        <nav aria-label="주요 메뉴">
          <NavLink to="/scenarios">작품 탐색</NavLink>
          <NavLink to="/rooms">모집방</NavLink>
          <NavLink to="/match">바로 매칭</NavLink>
        </nav>
        <div className={s.accountNav}>
          {user ? (
            <>
              <Link to="/account">{user.displayName}</Link>
              {user.admin && <Link to="/admin">관리</Link>}
              <button className={s.ghost} onClick={() => void logout()}>
                로그아웃
              </button>
            </>
          ) : (
            <Link className={s.button} to="/login">
              로그인
            </Link>
          )}
        </div>
      </header>
      {user && (
        <div className={s.connection}>
          <span className={connection === 'connected' ? s.online : s.offline} />
          {connection === 'connected' ? '실시간 연결됨' : '실시간 연결 복구 중 · 15초마다 최신 상태 확인'}
          {activity.data && activity.data.kind !== 'IDLE' && <Link to={activityPath(activity.data.kind, activity.data.referenceId)}>참여 중인 활동으로 돌아가기 →</Link>}
        </div>
      )}
      <main id="main" className={s.main}>
        <ErrorNotice message={logoutError} />
        <Outlet />
      </main>
      <footer className={s.footer}>
        <span>미스터리 망고</span>
        <span>당신의 한마디로 달라지는 이야기.</span>
        <span>비밀 자료와 대화는 참가자에게만 공개됩니다.</span>
      </footer>
    </>
  );
}
export default function App() {
  const cache = useQueryClient();
  const [sessionExpired, setSessionExpired] = useState(false);
  const auth = useQuery({ queryKey: ['me'], queryFn: () => get<User | null>('/auth/me'), retry: false, staleTime: 60000 });
  useEffect(() => {
    const expire = () => {
      setSessionExpired(true);
      void cache.cancelQueries();
      cache.clear();
      cache.setQueryData(['me'], null);
    };
    const restore = () => setSessionExpired(false);
    window.addEventListener(sessionExpiredEvent, expire);
    window.addEventListener(sessionRestoredEvent, restore);
    return () => {
      window.removeEventListener(sessionExpiredEvent, expire);
      window.removeEventListener(sessionRestoredEvent, restore);
    };
  }, [cache]);
  const expired = sessionExpired || (auth.isError && axios.isAxiosError(auth.error) && auth.error.response?.status === 401);
  if (auth.isPending && !expired) return <div className={s.loading}>미스터리 망고를 준비하고 있어요…</div>;
  return (
    <UserContext.Provider value={expired ? null : (auth.data ?? null)}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<AuthPage />} />
          <Route path="register" element={<AuthPage register />} />
          <Route path="scenarios" element={<CatalogPage />} />
          <Route path="scenarios/:id" element={<ScenarioPage />} />
          <Route path="rooms" element={<RoomsPage />} />
          <Route element={<SignedIn />}>
            <Route path="rooms/:id" element={<LobbyPage />} />
            <Route path="match" element={<MatchPage />} />
            <Route path="games/:id" element={<GamePage />} />
            <Route path="account" element={<AccountPage />} />
            <Route element={<AdminOnly />}>
              <Route path="admin" element={<AdminPage />} />
            </Route>
          </Route>
          <Route
            path="*"
            element={
              <div className={s.empty}>
                <h1>페이지를 찾을 수 없어요.</h1>
                <Link to="/">처음으로 돌아가기</Link>
              </div>
            }
          />
        </Route>
      </Routes>
    </UserContext.Provider>
  );
}
