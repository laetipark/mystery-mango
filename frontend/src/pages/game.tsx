import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Badge, Deadline, Empty, ErrorNotice, QueryState, useUser } from '~/components/ui';
import type { Game, Message } from '~/common/types';
import { phaseNames } from '~/common/time';
import { command, errorMessage, get } from '~/services/api';
import { useCommand } from '~/hooks/use-command';
import s from '~/styles/app.module.scss';

type VoiceState = { provider: string; configured: boolean; status: string; connected: boolean; channelUrl: string | null; channelKind: string | null; message: string };
export function GamePage() {
  const { id } = useParams();
  const game = useQuery({ queryKey: ['game', id], queryFn: () => get<Game>(`/games/${id}/snapshot`), refetchInterval: 15000 });
  useEffect(() => {
    const ping = () => {
      if (document.visibilityState === 'visible') void command('POST', `/games/${id}/heartbeat`, {}).catch(() => undefined);
    };
    ping();
    const timer = setInterval(ping, 15000);
    return () => clearInterval(timer);
  }, [id]);
  return <QueryState query={game}>{(snapshot) => <GameBoard game={snapshot} />}</QueryState>;
}
function VoicePanel({ id }: { id: string }) {
  const action = useCommand();
  const voice = useQuery({ queryKey: ['voice', id], queryFn: () => get<VoiceState>(`/games/${id}/voice-state`), refetchInterval: 15000 });
  return (
    <div className={s.voicePanel}>
      <h3>음성 상태</h3>
      {voice.isPending ? (
        <p>음성 설정 확인 중…</p>
      ) : voice.isError ? (
        <ErrorNotice message={errorMessage(voice.error)} />
      ) : (
        <>
          <Badge>
            {voice.data.status === 'DISABLED'
              ? '미설정 · 텍스트로 대화'
              : voice.data.status === 'READY'
                ? '권한 준비 완료'
                : voice.data.status === 'PENDING'
                  ? '음성 권한 동기화 중'
                  : voice.data.status === 'CLEANED'
                    ? '음성방 종료'
                    : '음성 연결 확인 필요'}
          </Badge>
          <p>{voice.data.message}</p>
          {voice.data.configured && !['DISABLED', 'CLEANED'].includes(voice.data.status) && (
            <>
              <p>{voice.data.connected ? 'Discord 통화 연결 확인됨' : '최초 음성 입장은 Discord에서 직접 해 주세요.'}</p>
              <button disabled={action.pending} onClick={() => void action.run('POST', `/games/${id}/voice-join`)}>
                음성 참가 권한 확인
              </button>
              {voice.data.channelUrl?.startsWith('https://discord.com/channels/') && (
                <a href={voice.data.channelUrl} target="_blank" rel="noreferrer" className={s.button}>
                  Discord {voice.data.channelKind === 'WHISPER' ? '밀담' : '전체'} 음성 열기 ↗
                </a>
              )}
              <small>마이크 권한·기기 선택·음소거는 Discord에서 설정하세요.</small>
            </>
          )}
        </>
      )}
      <ErrorNotice message={action.error} />
    </div>
  );
}
function GameBoard({ game }: { game: Game }) {
  const user = useUser();
  const navigate = useNavigate();
  const action = useCommand();
  const [tab, setTab] = useState('investigation');
  const [channel, setChannel] = useState('');
  const [draft, setDraft] = useState('');
  const [targetUser, setTargetUser] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [reportMessageId, setReportMessageId] = useState<string>();
  const [notice, setNotice] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [older, setOlder] = useState<Message[]>([]);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [leaveAcknowledged, setLeaveAcknowledged] = useState(false);
  const messages = useQuery({
    queryKey: ['messages', game.id, channel],
    queryFn: () => get<{ items: Message[]; hasMore: boolean }>(`/games/${game.id}/messages?size=50${channel ? `&whisperId=${channel}` : ''}`),
    refetchInterval: 15000
  });
  const whisper = game.whispers.find((w) => w.id === channel);
  const can = (actionName: string) => game.status === 'ACTIVE' && !!game.phase?.actions.includes(actionName);
  const canChat = channel ? can('WHISPER') && whisper?.status === 'ACTIVE' : can('CHAT');
  const activeWhisper = game.whispers.find((w) => w.status === 'ACTIVE');
  const allMessages = [...new Map([...older, ...(messages.data?.items ?? [])].map((message) => [message.id, message])).values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  useEffect(() => {
    setOlder([]);
    setHistoryError('');
  }, [channel]);
  async function send() {
    if (!draft.trim()) return;
    if (await action.run('POST', `/games/${game.id}/messages`, { text: draft.trim(), ...(channel ? { whisperId: channel } : {}) })) setDraft('');
  }
  async function olderMessages() {
    const first = allMessages[0];
    if (!first) return;
    setLoadingOlder(true);
    try {
      const result = await get<{ items: Message[]; hasMore: boolean }>(`/games/${game.id}/messages?size=50&before=${encodeURIComponent(first.id)}${channel ? `&whisperId=${channel}` : ''}`);
      setOlder((old) => [...old, ...result.items]);
      if (!result.items.length) setNotice('이전 대화를 모두 불러왔습니다.');
    } catch (failure) {
      setHistoryError(errorMessage(failure));
    } finally {
      setLoadingOlder(false);
    }
  }
  async function report() {
    if (await action.run('POST', '/reports', { gameId: game.id, targetUserId: targetUser || undefined, messageId: reportMessageId, reason: reportReason })) {
      setReportReason('');
      setReportMessageId(undefined);
      setNotice('신고를 접수했습니다.');
    }
  }
  return (
    <>
      <div className={s.gameTop}>
        <div>
          <span className={s.eyebrow}>나의 사건 기록</span>
          <h1>{game.status === 'COMPLETED' ? '이야기가 끝났습니다.' : game.status === 'ABORTED' ? '플레이가 중단되었습니다.' : (phaseNames[game.phase?.kind ?? ''] ?? '게임 진행')}</h1>
        </div>
        <div className={s.gameClock}>
          {game.status === 'PAUSED' ? (
            <Badge>진행 일시 정지</Badge>
          ) : (
            game.phase && game.status !== 'COMPLETED' && game.status !== 'ABORTED' && <Deadline endsAt={game.phase.endsAt} serverTime={game.serverTime} />
          )}
          <span>진행 상황 자동 저장</span>
        </div>
      </div>
      {game.status === 'PAUSED' && (
        <div className={s.warning} role="status">
          Discord 음성 권한을 동기화하고 있습니다. 완료될 때까지 게임 진행과 행동이 잠시 멈춥니다.
        </div>
      )}
      <ErrorNotice message={action.error} />
      {notice && (
        <p className={s.success} role="status">
          {notice}
        </p>
      )}
      <div className={s.mobileTabs} role="tablist" aria-label="게임 화면">
        {[
          ['role', '내 역할'],
          ['investigation', '조사 · 진행'],
          ['chat', '대화']
        ].map(([key, label]) => (
          <button
            key={key}
            id={`tab-${key}`}
            role="tab"
            aria-controls={`panel-${key}`}
            aria-selected={tab === key}
            tabIndex={tab === key ? 0 : -1}
            onClick={() => setTab(key)}
            onKeyDown={(event) => {
              if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
              event.preventDefault();
              const keys = ['role', 'investigation', 'chat'];
              const next = event.key === 'Home' ? keys[0] : event.key === 'End' ? keys[2] : keys[(keys.indexOf(key) + (event.key === 'ArrowRight' ? 1 : 2)) % 3];
              setTab(next);
              document.getElementById(`tab-${next}`)?.focus();
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div className={s.gameGrid}>
        <aside id="panel-role" role="tabpanel" aria-labelledby="tab-role" className={`${s.gameColumn} ${tab !== 'role' ? s.mobileHidden : ''}`}>
          <section className={`${s.panel} ${s.privatePanel}`}>
            <Badge>나만 볼 수 있는 비밀</Badge>
            <span className={s.roleAvatar}>{game.myRole.name.slice(0, 1)}</span>
            <h2 data-testid="my-role">{game.myRole.name}</h2>
            <div className={s.prose}>{game.myRole.secret}</div>
            <hr />
            <h3>나의 목표</h3>
            <p>{game.myRole.objective}</p>
            {game.phase?.kind === 'READING' && (
              <button className={s.primary} disabled={action.pending || game.phase.ready || game.status !== 'ACTIVE'} onClick={() => void action.run('POST', `/games/${game.id}/phase-ready`)}>
                {game.phase.ready ? '✓ 읽기 완료' : '자료를 모두 읽었어요'}
              </button>
            )}
          </section>
          <section className={s.panel}>
            <h2>참가자</h2>
            {game.participants.map((participant) => (
              <div className={s.playerRow} key={participant.userId}>
                <span className={s.avatar}>{participant.displayName.slice(0, 1)}</span>
                <div>
                  <strong>{participant.roleName}</strong>
                  <small>
                    {participant.displayName}
                    {participant.userId === user.id ? ' (나)' : ''} · {participant.connected ? '접속 중' : '재접속 대기'}
                  </small>
                </div>
                {participant.userId !== user.id && (
                  <button
                    className={s.smallButton}
                    aria-label={`${participant.displayName} 님에게 밀담 초대`}
                    disabled={!can('WHISPER') || action.pending || !!activeWhisper}
                    onClick={() => void action.run('POST', `/games/${game.id}/whispers`, { inviteeId: participant.userId })}
                  >
                    밀담
                  </button>
                )}
              </div>
            ))}
          </section>
        </aside>
        <section id="panel-investigation" role="tabpanel" aria-labelledby="tab-investigation" className={`${s.gameColumn} ${tab !== 'investigation' ? s.mobileHidden : ''}`}>
          <section className={s.panel}>
            <div className={s.sectionHeading}>
              <Badge>{phaseNames[game.phase?.kind ?? ''] ?? game.status}</Badge>
              <span className={s.muted}>모든 참가자에게 공개</span>
            </div>
            <div className={s.prose}>{game.phase?.publicText}</div>
            {game.materials.map((material) => (
              <p className={s.material} key={material.id}>
                {material.text}
              </p>
            ))}
          </section>
          {game.ending && (
            <section className={`${s.panel} ${s.ending}`} data-testid="ending">
              <span className={s.eyebrow}>우리의 엔딩</span>
              <h2>{game.ending.title}</h2>
              <p className={s.prose}>{game.ending.text}</p>
              <Badge>개인 목표 {game.ending.objectiveAchieved ? '달성' : '미달성'}</Badge>
              <Link className={s.button} to="/account">
                플레이 기록 보기 →
              </Link>
            </section>
          )}
          {game.status === 'ABORTED' && (
            <section className={s.panel}>
              <p>이 플레이는 완료와 별개로 중단 기록에 남습니다.</p>
              <Link to="/account">내 기록으로 돌아가기</Link>
            </section>
          )}
          {!game.ending && game.targets.length > 0 && (
            <section className={s.panel}>
              <div className={s.sectionHeading}>
                <h2>현장 조사</h2>
                <Badge>남은 조사 {game.investigationsRemaining}회</Badge>
              </div>
              <div className={s.targetGrid}>
                {game.targets.map((target) => (
                  <button
                    className={s.target}
                    key={target.id}
                    disabled={!can('INVESTIGATE') || target.investigated || game.investigationsRemaining <= 0 || action.pending}
                    onClick={() => void action.run('POST', `/games/${game.id}/investigations`, { targetId: target.id })}
                  >
                    <span aria-hidden="true">⌕</span>
                    <strong>{target.name}</strong>
                    <small>{target.investigated ? '조사 완료' : '단서 살펴보기'}</small>
                  </button>
                ))}
              </div>
              {!can('INVESTIGATE') && <p className={s.note}>조사 단계에서 조사할 수 있습니다.</p>}
            </section>
          )}
          {game.ballot && (
            <section className={s.panel}>
              <h2>범인 투표</h2>
              <p>{game.ballot.allowChange ? '마감 전에는 투표를 바꿀 수 있습니다.' : '한 번 제출한 투표는 바꿀 수 없습니다.'} 동률과 미제출은 작품 규칙에 따라 처리됩니다.</p>
              {game.ballot.submitted && (
                <p className={s.success}>현재 투표: {game.ballot.myVote ? (game.participants.find((p) => p.roleId === game.ballot?.myVote)?.roleName ?? '제출 완료') : '기권'}</p>
              )}
              <label>
                범인으로 지목할 인물
                <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                  <option value="">인물을 선택하세요</option>
                  {game.participants.map((p) => (
                    <option key={p.roleId} value={p.roleId}>
                      {p.roleName}
                    </option>
                  ))}
                </select>
              </label>
              <div className={s.actions}>
                <button
                  className={s.primary}
                  disabled={!can('VOTE') || !selectedRole || action.pending || (game.ballot.submitted && !game.ballot.allowChange)}
                  onClick={() => void action.run('PUT', `/games/${game.id}/ballots/${game.ballot?.id}/me`, { roleId: selectedRole })}
                >
                  투표 제출
                </button>
                {game.ballot.allowAbstain && (
                  <button
                    disabled={!can('VOTE') || action.pending || (game.ballot.submitted && !game.ballot.allowChange)}
                    onClick={() => void action.run('PUT', `/games/${game.id}/ballots/${game.ballot?.id}/me`, { roleId: null })}
                  >
                    기권
                  </button>
                )}
              </div>
            </section>
          )}
          <section className={s.panel}>
            <div className={s.sectionHeading}>
              <h2>내가 볼 수 있는 단서</h2>
              <span>{game.clues.length}개</span>
            </div>
            {game.clues.length ? (
              <div className={s.clueList}>
                {game.clues.map((clue) => (
                  <article className={clue.public ? s.publicClue : s.privateClue} key={clue.id}>
                    <div className={s.row}>
                      <Badge>{clue.public ? '전체 공개' : clue.owned ? '내가 소유한 비밀' : '공유받은 비밀'}</Badge>
                    </div>
                    <h3>{clue.title}</h3>
                    <p className={s.prose}>{clue.text}</p>
                    {clue.owned && !clue.public && (
                      <div className={s.actions}>
                        {clue.sharePolicy !== 'PRIVATE' && (
                          <button disabled={!can('SHARE') || action.pending} onClick={() => void action.run('POST', `/games/${game.id}/clue-shares`, { clueId: clue.id, scope: 'PUBLIC' })}>
                            전체 공개하기
                          </button>
                        )}
                        {clue.sharePolicy === 'PUBLIC_AND_WHISPER' && activeWhisper && (
                          <button
                            disabled={!can('SHARE') || action.pending}
                            onClick={() => void action.run('POST', `/games/${game.id}/clue-shares`, { clueId: clue.id, scope: 'WHISPER', whisperId: activeWhisper.id })}
                          >
                            현재 밀담 상대에게 공유
                          </button>
                        )}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <Empty>아직 열람할 수 있는 단서가 없습니다.</Empty>
            )}
            <p className={s.note}>공유된 단서는 상대방의 열람 기록에 남습니다. 공유는 소유권을 넘기는 행동이 아닙니다.</p>
          </section>
        </section>
        <aside id="panel-chat" role="tabpanel" aria-labelledby="tab-chat" className={`${s.gameColumn} ${tab !== 'chat' ? s.mobileHidden : ''}`}>
          <section className={s.panel}>
            <h2>대화</h2>
            <label>
              대화방
              <select value={channel} onChange={(e) => setChannel(e.target.value)}>
                <option value="">전체 대화</option>
                {game.whispers
                  .filter((w) => w.status !== 'INVITED')
                  .map((w, index) => (
                    <option key={w.id} value={w.id}>
                      밀담 {index + 1}
                      {w.status === 'CLOSED' ? ' (종료 · 기록)' : ''}
                    </option>
                  ))}
              </select>
            </label>
            {channel && <p className={s.note}>발송 당시 참가자만 대화를 읽을 수 있습니다.</p>}
            {game.whispers
              .filter((w) => w.status === 'INVITED')
              .map((w) => (
                <div key={w.id} className={s.whisperInvite}>
                  <p>
                    {game.participants.find((p) => p.userId === (w.inviterId === user.id ? w.inviteeId : w.inviterId))?.displayName} 님
                    {w.inviterId === user.id ? '의 수락을 기다립니다.' : '이 밀담을 요청했습니다.'}
                  </p>
                  {w.inviteeId === user.id && (
                    <button
                      disabled={!can('WHISPER') || action.pending}
                      onClick={async () => {
                        if (await action.run('POST', `/games/${game.id}/whispers/${w.id}/accept`)) setChannel(w.id);
                      }}
                    >
                      밀담 수락
                    </button>
                  )}
                  <button className={s.ghost} disabled={action.pending || game.status !== 'ACTIVE'} onClick={() => void action.run('POST', `/games/${game.id}/whispers/${w.id}/leave`)}>
                    초대 취소 / 거절
                  </button>
                </div>
              ))}
            {activeWhisper && (
              <div className={s.actions}>
                <button onClick={() => setChannel(activeWhisper.id)}>진행 중인 밀담 보기</button>
                <button
                  disabled={action.pending || game.status !== 'ACTIVE'}
                  onClick={async () => {
                    if (await action.run('POST', `/games/${game.id}/whispers/${activeWhisper.id}/leave`)) setChannel('');
                  }}
                >
                  밀담 나가기
                </button>
              </div>
            )}
            <ErrorNotice message={historyError} />
            {messages.data?.hasMore && (
              <button disabled={loadingOlder} onClick={() => void olderMessages()}>
                이전 대화 보기
              </button>
            )}
            <div className={s.messages} role="log" aria-label={channel ? '밀담 메시지' : '전체 메시지'} aria-live="polite">
              <QueryState query={messages}>
                {() =>
                  allMessages.length ? (
                    allMessages.map((message) => (
                      <article className={message.senderId === user.id ? s.myMessage : s.message} key={message.id}>
                        <div>
                          <strong>{message.senderName}</strong>
                          <time>{new Date(message.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</time>
                        </div>
                        <p>{message.text}</p>
                        {message.senderId !== user.id && (
                          <button
                            className={s.messageReport}
                            onClick={() => {
                              setTargetUser(message.senderId);
                              setReportMessageId(message.id);
                              setNotice('아래 신고 양식에서 내용을 작성해 주세요.');
                            }}
                          >
                            신고
                          </button>
                        )}
                      </article>
                    ))
                  ) : (
                    <Empty>아직 대화가 없습니다.</Empty>
                  )
                }
              </QueryState>
            </div>
            <form
              className={s.chatForm}
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
            >
              <label className={s.srOnly} htmlFor="chat-message">
                메시지
              </label>
              <textarea
                id="chat-message"
                placeholder={canChat ? '대화를 입력하세요…' : '지금은 대화할 수 없습니다.'}
                maxLength={2000}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                disabled={!canChat}
                rows={2}
              />
              <button className={s.primary} disabled={!canChat || !draft.trim() || action.pending}>
                보내기
              </button>
            </form>
          </section>
          <section className={s.panel}>
            <VoicePanel id={game.id} />
          </section>
          <details className={s.panel}>
            <summary>이용자 차단 · 신고</summary>
            <div className={s.form}>
              <label>
                대상 이용자
                <select value={targetUser} onChange={(e) => setTargetUser(e.target.value)}>
                  <option value="">게임 관련 신고</option>
                  {game.participants
                    .filter((p) => p.userId !== user.id)
                    .map((p) => (
                      <option key={p.userId} value={p.userId}>
                        {p.displayName}
                      </option>
                    ))}
                </select>
              </label>
              <button
                disabled={!targetUser || action.pending}
                onClick={async () => {
                  if (await action.run('POST', '/me/blocks', { userId: targetUser })) setNotice('이 이용자와 앞으로 자동 매칭되지 않습니다.');
                }}
              >
                이용자 차단
              </button>
              <label>
                신고 내용
                <textarea value={reportReason} onChange={(e) => setReportReason(e.target.value)} maxLength={2000} />
              </label>
              <button disabled={reportReason.trim().length < 5 || action.pending} onClick={() => void report()}>
                신고 접수
              </button>
            </div>
          </details>
          {['ACTIVE', 'PAUSED'].includes(game.status) && (
            <details className={s.panel}>
              <summary>플레이 중단 논의</summary>
              <p>정상 연결 중에는 전원의 동의가 필요합니다. 장기 미복귀자가 있으면 연결된 참가자의 합의로 중단할 수 있습니다.</p>
              <p>
                중단 동의 {game.abortVotes}/{game.abortRequired}
              </p>
              <button disabled={!game.canRequestAbort || action.pending || game.status === 'PAUSED'} onClick={() => void action.run('POST', `/games/${game.id}/abort-vote`)}>
                중단에 동의하기
              </button>
              <hr />
              <label className={s.check}>
                <input type="checkbox" checked={leaveAcknowledged} onChange={(e) => setLeaveAcknowledged(e.target.checked)} />
                게임에서 나가면 다시 참가하거나 비밀 자료를 볼 수 없음을 확인했습니다.
              </label>
              <button
                disabled={!leaveAcknowledged || action.pending}
                onClick={async () => {
                  if (await action.run('POST', `/games/${game.id}/leave`)) navigate('/account');
                }}
              >
                게임에서 영구적으로 나가기
              </button>
            </details>
          )}
        </aside>
      </div>
    </>
  );
}
