import { useQuery } from '@tanstack/react-query';
import { get } from '~/services/api';
import { QueryState } from '~/components/ui';
import { RulesForm } from './forms';
import { SceneCanvas } from './canvas';
import { CardFace } from './card-face';
import { gameTypeNames, type Document, type Work } from './types';
import { useEditorState } from './editor-memory';
import d from './editor-details.module.scss';

export interface FrozenVersion {
  workId: string; versionId: string; version: number; authorRevision: number | null;
  status: string; reviewStatus: string | null; reviewNote: string | null; document: Document;
}
interface Observation {
  endingId: string; title: string; authorReachedAt: string | null; reviewerReachedAt: string | null; invitedTestReachedAt: string | null;
}
export function EndingObservations({ versionId }: { versionId: string }) {
  const query = useQuery({
    queryKey: ['ending-observations', versionId],
    queryFn: () => get<{versionId: string; authorRevision: number | null; totalEndings: number; reachedEndings: number; endings: Observation[]}>(`/author/versions/${versionId}/ending-observations`),
    refetchOnMount: 'always'
  });
  const date = (value: string | null) => value ? new Date(value).toLocaleString('ko-KR') : '기록 없음';
  return <section className={d.observations} aria-label="엔딩 시험 기록">
    <QueryState query={query}>{data => <>
      <h3>시험에서 도달한 엔딩 {data.reachedEndings}/{data.totalEndings}</h3>
      <p>구조 검사와 관리자 승인은 별도입니다. 기록이 없는 엔딩도 도달할 수 있으며, 모든 엔딩을 시험해야 공개할 수 있는 것은 아닙니다.</p>
      <table><thead><tr><th>엔딩</th><th>작가 혼자 시험</th><th>검수자 혼자 시험</th><th>초대 시험</th></tr></thead>
        <tbody>{data.endings.map(ending => <tr key={ending.endingId}><th scope="row">{ending.title}</th><td>{date(ending.authorReachedAt)}</td><td>{date(ending.reviewerReachedAt)}</td><td>{date(ending.invitedTestReachedAt)}</td></tr>)}</tbody>
      </table>
      <button onClick={() => void query.refetch()}>시험 기록 새로고침</button>
    </>}</QueryState>
  </section>;
}

export function VersionHistory({ work, pending, onTest }: {
  work: Work; pending: boolean;
  onTest: (version: FrozenVersion, capacity: number, mode: string, invited: boolean) => Promise<void>;
}) {
  const [selectedId, setSelectedId] = useEditorState('history-version', '');
  const [capacity, setCapacity] = useEditorState('history-capacity', 2);
  const [mode, setMode] = useEditorState('history-mode', 'TEXT');
  const query = useQuery({queryKey: ['author-version', work.id, selectedId], queryFn: () => get<FrozenVersion>(`/author/works/${work.id}/versions/${selectedId}`), enabled: !!selectedId});
  return <section aria-label="버전과 검수">
    <h3>버전과 검수</h3>
    {!work.versions.length && <p>아직 고정하거나 제출한 버전이 없습니다.</p>}
    {work.versions.map(version => <article className={d.version} key={version.id}>
      <header><strong>버전 {version.version} · {({PENDING:'검수 중', APPROVED:'승인', REQUEST_CHANGES:'수정 요청', REJECTED:'수정 요청', SUPERSEDED:'새 요청으로 대체', PUBLISHED:'공개', DRAFT:'고정됨'} as Record<string,string>)[version.reviewStatus ?? version.status] ?? version.reviewStatus ?? version.status}</strong>
        <button aria-expanded={selectedId === version.id} onClick={() => setSelectedId(selectedId === version.id ? '' : version.id)}>내용 보기 · 이 버전 시험</button></header>
      {version.reviewNote && <p>{version.reviewNote}</p>}
      {selectedId === version.id && <QueryState query={query}>{frozen => {
        const doc = frozen.document;
        const counts = doc.gameType === 'MURDER_MYSTERY' ? [Number(doc.playerCount)] : doc.supportedPlayerCounts;
        const selectedCapacity = counts.includes(capacity) ? capacity : counts[0];
        const modes = (doc.modes ?? ['TEXT']) as string[];
        const selectedMode = modes.includes(mode) ? mode : modes[0];
        return <>
          <p>버전 {frozen.version} · 고정 당시 개정 {frozen.authorRevision ?? '기록 없음'} · {gameTypeNames[doc.gameType]}</p>
          <h4>{doc.title}</h4><p>{String(doc.synopsis ?? '')}</p>
          <p>현재 초안을 유지하며 이 버전의 내용으로 시험합니다.</p>
          <div className={d.versionActions}>
            <label>이 버전 시험 인원<select value={selectedCapacity} onChange={event => setCapacity(Number(event.target.value))}>{counts.map(count => <option value={count} key={count}>{count}명</option>)}</select></label>
            <label>이 버전 대화 방식<select value={selectedMode} onChange={event => setMode(event.target.value)}>{modes.map(item => <option key={item} value={item}>{item === 'TEXT' ? '텍스트' : 'Discord'}</option>)}</select></label>
            <button disabled={pending} onClick={() => void onTest(frozen, selectedCapacity, selectedMode, false)}>이 버전 혼자 시험</button>
            <button disabled={pending} onClick={() => void onTest(frozen, selectedCapacity, selectedMode, true)}>이 버전 초대 시험</button>
          </div>
          <div className={d.readOnly}>
            <details><summary>고정된 규칙과 내용 보기</summary><fieldset disabled><RulesForm document={doc} onChange={() => undefined}/></fieldset></details>
            {doc.presentation.scenes.map(scene => <details key={scene.id}><summary>{scene.name}</summary><SceneCanvas scene={scene} readonly/></details>)}
            {doc.presentation.cardLayouts?.map(layout => <details key={layout.id}><summary>{layout.name} · 카드 앞뒷면</summary><div style={{display:'flex',gap:16,maxWidth:400}}>{(['front','back'] as const).map(side => <CardFace key={side} design={{width:layout.width,height:layout.height,...layout[side]}} label={`${layout.name} ${side === 'front' ? '앞면' : '뒷면'}`}/>)}</div></details>)}
          </div>
          {doc.gameType === 'MURDER_MYSTERY' && <EndingObservations versionId={frozen.versionId}/>}
        </>;
      }}</QueryState>}
    </article>)}
  </section>;
}
