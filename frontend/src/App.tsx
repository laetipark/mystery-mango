import { AuthPage } from '~/pages/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { lazy, Suspense, useEffect, useState } from 'react';
import { captureInvitePath } from '~/services/invites';
import axios from 'axios';
import { Link, Navigate, NavLink, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import type { Activity, User } from '~/common/types';
import { activityPath } from '~/common/time';
import { command, errorMessage, get, resetCsrf, sessionExpiredEvent, sessionRestoredEvent } from '~/services/api';
import { ErrorNotice, UserContext, useUser } from '~/components/ui';
import { Icon } from '~/components/icon';
import { useEvents } from '~/hooks/use-events';
import { HomePage, CatalogPage, ScenarioPage, RoomsPage, LobbyPage, MatchPage, AccountPage, AdminPage } from '~/pages/pages';
import { GamePage } from '~/pages/game';
const StudioPage = lazy(() => import('~/studio/pages').then((m) => ({ default: m.StudioPage })));
const StudioEditorPage = lazy(() => import('~/studio/pages').then((m) => ({ default: m.StudioEditorPage })));
const SandboxPage = lazy(() => import('~/studio/runtime').then((m) => ({ default: m.SandboxPage })));
const ReviewPage = lazy(() => import('~/studio/reviews').then((m) => ({ default: m.ReviewPage })));
import s from '~/styles/app.module.scss';

function SignedIn() {
  const user = useUser();
  const location = useLocation();
  return user ? <Outlet /> : <Navigate to={`/login?next=${encodeURIComponent(captureInvitePath(location.pathname + location.search))}`} replace />;
}
function AdminOnly() {
  const user = useUser();
  return user?.admin ? <Outlet /> : <div className={s.empty}>관리자 권한이 필요합니다.</div>;
}
function Layout() {
  const user = useUser();
  const location = useLocation();
  const workspace = /^\/studio\/.+/.test(location.pathname);
  const home = location.pathname === '/';
  const studioEditor = /^\/studio\/[^/]+$/.test(location.pathname);
  const navigation = [
    { to: '/scenarios', name: '작품 탐색', short: '탐색', icon: 'explore' },
    { to: '/rooms', name: '모집방', short: '모집방', icon: 'rooms' },
    { to: '/match', name: '바로 매칭', short: '매칭', icon: 'match' },
    { to: '/studio', name: '작품 만들기', short: '만들기', icon: 'create' }
  ] as const;
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
      {!studioEditor && (
        <header className={`${s.siteHeader} ${workspace ? s.workspaceHeader : ''} ${home ? s.homeHeader : ''}`}>
          <Link to="/" className={s.brand}>
            <img className={s.logo} src="/images/mango-detective.png" alt="" aria-hidden="true" width={42} height={42} />
            미스터리 망고
          </Link>
          <nav aria-label="주요 메뉴" className={s.desktopNav}>
            {navigation.map((item) => (
              <NavLink key={item.to} to={item.to}>
                {item.name}
              </NavLink>
            ))}
          </nav>
          <div className={s.accountNav}>
            {user ? (
              <details className={s.accountMenu} key={location.pathname}>
                <summary aria-label="계정 메뉴">
                  <span className={s.accountAvatar}>
                    <Icon name="user" size={17} />
                  </span>
                  <span className={s.accountName}>{user.displayName}</span>
                  <span aria-hidden="true">⌄</span>
                </summary>
                <div className={s.accountDropdown}>
                  <span>{user.displayName}</span>
                  <Link to="/account">내 서재·계정</Link>
                  {user.admin && <Link to="/admin">관리</Link>}
                  <button onClick={() => void logout()}>로그아웃</button>
                </div>
              </details>
            ) : (
              <Link className={s.button} to="/login">
                로그인
              </Link>
            )}
          </div>
        </header>
      )}
      {user && !studioEditor && (
        <div className={`${s.connection} ${workspace ? s.workspaceConnection : ''}`}>
          <span className={connection === 'connected' ? s.online : s.offline} />
          {connection === 'connected' ? '실시간 연결됨' : '실시간 연결 복구 중 · 15초마다 최신 상태 확인'}
          {activity.data && activity.data.kind !== 'IDLE' && <Link to={activityPath(activity.data.kind, activity.data.referenceId)}>참여 중인 활동으로 돌아가기 →</Link>}
        </div>
      )}
      <main id="main" className={`${s.main} ${workspace ? s.workspaceMain : ''} ${studioEditor ? s.studioEditorMain : ''} ${home ? s.homeMain : ''}`} tabIndex={-1}>
        <ErrorNotice message={logoutError} />
        <Outlet />
      </main>
      {!workspace && (
        <footer className={`${s.footer} ${home ? s.homeFooter : ''}`}>
          <span>미스터리 망고</span>
          <span>함께 만드는 이야기, 함께 즐기는 게임.</span>
          <span>비밀 자료와 대화는 참가자에게만 공개됩니다.</span>
        </footer>
      )}
      {!workspace && (
        <nav aria-label="모바일 주요 메뉴" className={s.mobileNavigation}>
          {navigation.map((item) => (
            <NavLink key={item.to} to={item.to}>
              <Icon name={item.icon} />
              <span>{item.short}</span>
            </NavLink>
          ))}
        </nav>
      )}
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
      <Suspense fallback={<div className={s.loading}>화면을 불러오고 있어요…</div>}>
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
              <Route path="studio" element={<StudioPage />} />
              <Route path="studio/sandboxes/:id" element={<SandboxPage />} />
              <Route path="studio/:id" element={<StudioEditorPage />} />
              <Route element={<AdminOnly />}>
                <Route path="admin" element={<AdminPage />} />
                <Route path="admin/reviews/:id" element={<ReviewPage />} />
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
      </Suspense>
    </UserContext.Provider>
  );
}
