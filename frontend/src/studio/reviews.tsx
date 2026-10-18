import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ErrorNotice, PageTitle, QueryState } from '~/components/ui';
import { get } from '~/services/api';
import { useCommand } from '~/hooks/use-command';
import { RulesForm } from './forms';
import { SceneCanvas } from './canvas';
import type { Document } from './types';
import s from './studio.module.scss';
import { EndingObservations } from './version-history';
export function ReviewList() {
  const query = useQuery({
    queryKey: ['scenario-reviews'],
    queryFn: () => get<{ items: { id: string; versionId: string; title: string; authorName: string; status: string; createdAt: string }[] }>('/admin/scenario-reviews')
  });
  return (
    <section className={s.panel}>
      <h2>작가 작품 검수</h2>
      <QueryState query={query}>
        {(data) => (
          <div className={s.cards}>
            {data.items.map((r) => (
              <Link key={r.id} className={s.card} to={`/admin/reviews/${r.id}`}>
                <strong>{r.title}</strong>
                <p>
                  {r.authorName} · {r.status}
                </p>
                <small>{new Date(r.createdAt).toLocaleString('ko-KR')}</small>
              </Link>
            ))}
            {!data.items.length && <p>검수 요청이 없습니다.</p>}
          </div>
        )}
      </QueryState>
    </section>
  );
}
export function ReviewPage() {
  const { id } = useParams();
  const query = useQuery({
    queryKey: ['scenario-review', id],
    queryFn: () => get<{ id: string; versionId: string; status: string; document: Document; note: string }>(`/admin/scenario-reviews/${id}`)
  });
  const [capacityChoice, setCapacityChoice] = useState(2);
  const [note, setNote] = useState(''),
    [notice, setNotice] = useState('');
  const action = useCommand(),
    navigate = useNavigate();
  async function decide(decision: string) {
    if (await action.run('POST', `/admin/scenario-reviews/${id}/decision`, { decision, note })) setNotice(decision === 'APPROVE' ? '승인하고 공개했습니다.' : '수정 요청을 전달했습니다.');
  }
  return (
    <div className={s.studio}>
      <Link to="/admin">← 관리 화면</Link>
      <QueryState query={query}>
        {(data) => (
          <>
            <PageTitle title={`작품 검수 · ${data.document.title}`}>
              {data.status} · {data.note}
            </PageTitle>
            <p>{String(data.document.synopsis)}</p>
            <fieldset disabled>
              <RulesForm document={data.document} onChange={() => undefined} />
            </fieldset>
            {data.document.presentation?.scenes.map((scene) => (
              <article key={scene.id}>
                <h2>{scene.name}</h2>
                <SceneCanvas scene={scene} readonly />
              </article>
            ))}
            {data.document.gameType === 'MURDER_MYSTERY' && <EndingObservations versionId={data.versionId}/>}
            <section className={s.panel}>
              <label>검수 시험 인원<select value={data.document.gameType === 'MURDER_MYSTERY' ? Number(data.document.playerCount) : data.document.supportedPlayerCounts.includes(capacityChoice) ? capacityChoice : data.document.supportedPlayerCounts[0]} onChange={event => setCapacityChoice(Number(event.target.value))}>
                {(data.document.gameType === 'MURDER_MYSTERY' ? [Number(data.document.playerCount)] : data.document.supportedPlayerCounts).map(count => <option key={count} value={count}>{count}명</option>)}
              </select></label>
              <button
                disabled={action.pending}
                onClick={async () => {
                  const capacity = data.document.gameType === 'MURDER_MYSTERY' ? Number(data.document.playerCount) : data.document.supportedPlayerCounts.includes(capacityChoice) ? capacityChoice : data.document.supportedPlayerCounts[0];
                  const result = await action.run<{ id: string }>('POST', '/author/sandboxes', { versionId: data.versionId, capacity });
                  if (result) navigate(`/studio/sandboxes/${result.id}?capacity=${capacity}`);
                }}
              >
                샌드박스에서 검증
              </button>
              <label>
                검수 의견
                <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={4000} />
              </label>
              <div className={s.row}>
                <button disabled={action.pending || data.status !== 'PENDING'} onClick={() => void decide('APPROVE')}>
                  승인하고 공개
                </button>
                <button disabled={action.pending || !note.trim() || data.status !== 'PENDING'} onClick={() => void decide('REQUEST_CHANGES')}>
                  수정 요청
                </button>
              </div>
              <p role="status">{notice}</p>
              <ErrorNotice message={action.error} />
            </section>
          </>
        )}
      </QueryState>
    </div>
  );
}
