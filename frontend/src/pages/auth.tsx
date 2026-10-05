import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorNotice, PageTitle } from '~/components/ui';
import { kakaoAuthorizeUrl, kakaoErrorMessage, safeNextPath } from '~/common/auth';
import type { AuthProviders, KakaoAuthorize, User } from '~/common/types';
import { command, errorMessage, get, resetCsrf, sessionRestoredEvent } from '~/services/api';
import s from '~/styles/app.module.scss';

export function AuthPage({ register = false }: { register?: boolean }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState<'kakao' | 'local' | null>(null);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const cache = useQueryClient();
  const next = safeNextPath(params.get('next'));
  const providers = useQuery({ queryKey: ['auth-providers'], queryFn: () => get<AuthProviders>('/auth/providers'), retry: false, staleTime: 60000 });
  const alternativePath = `${register ? '/login' : '/register'}${next === '/' ? '' : `?${new URLSearchParams({ next })}`}`;

  async function loginWithKakao() {
    if (pending || !providers.data?.kakaoConfigured) return;
    setError('');
    setPending('kakao');
    try {
      const result = await command<KakaoAuthorize>('POST', '/auth/kakao', { next });
      window.location.assign(kakaoAuthorizeUrl(result.authorizeUrl));
    } catch (failure) {
      setError(errorMessage(failure));
      setPending(null);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (pending || !providers.data?.localLoginEnabled) return;
    setError('');
    setPending('local');
    try {
      const user = await command<User>('POST', `/auth/${register ? 'register' : 'login'}`, { email, password, ...(register ? { displayName: name } : {}) });
      resetCsrf();
      cache.clear();
      cache.setQueryData(['me'], user);
      window.dispatchEvent(new Event(sessionRestoredEvent));
      navigate(next);
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setPending(null);
    }
  }

  return (
    <div className={s.authCard}>
      <PageTitle eyebrow="다음 이야기에 참여하세요" title={register ? '처음 오셨나요?' : '다시 만나 반가워요.'} />
      <p className={s.authIntro}>카카오 계정으로 간편하게 시작하세요. 처음 이용하는 분은 로그인과 함께 가입됩니다.</p>
      <ErrorNotice message={error || (!pending ? kakaoErrorMessage(params.get('kakaoError')) : '')} />
      <button
        type="button"
        className={s.kakaoButton}
        disabled={!!pending || !providers.data?.kakaoConfigured}
        onClick={() => void loginWithKakao()}
        aria-label="카카오 로그인"
        aria-describedby="kakao-login-status"
        aria-busy={pending === 'kakao'}
      >
        <img src="/images/kakao-login-ko.svg" width="224" height="46" alt="" aria-hidden="true" />
      </button>
      <p id="kakao-login-status" className={s.authStatus} role="status">
        {pending === 'kakao'
          ? '카카오 로그인 화면으로 이동하고 있어요…'
          : providers.isPending
            ? '로그인 방법을 확인하고 있어요…'
            : providers.isError
              ? '로그인 방법을 불러오지 못했어요. 다시 시도해 주세요.'
              : !providers.data?.kakaoConfigured
                ? '지금은 카카오 로그인을 이용할 수 없어요. 잠시 후 다시 시도해 주세요.'
                : ''}
      </p>
      {providers.isError && (
        <button type="button" onClick={() => void providers.refetch()}>
          다시 시도
        </button>
      )}
      {providers.data?.localLoginEnabled && (
        <>
          <h2 className={s.authDivider}>이메일로 {register ? '가입하기' : '로그인'}</h2>
          <form onSubmit={(e) => void submit(e)} className={s.form}>
            {register && (
              <label>
                이름
                <input autoComplete="nickname" required maxLength={40} value={name} onChange={(e) => setName(e.target.value)} />
              </label>
            )}
            <label>
              이메일
              <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label>
              비밀번호
              <input
                type="password"
                autoComplete={register ? 'new-password' : 'current-password'}
                required
                minLength={register ? 10 : undefined}
                maxLength={72}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button className={s.primary} disabled={!!pending}>
              {pending === 'local' ? '잠시만 기다려 주세요…' : register ? '회원가입' : '로그인'}
            </button>
          </form>
          <p>
            {register ? '이미 계정이 있나요?' : '미스터리 망고가 처음인가요?'} <Link to={alternativePath}>{register ? '로그인' : '회원가입'}</Link>
          </p>
        </>
      )}
    </div>
  );
}
