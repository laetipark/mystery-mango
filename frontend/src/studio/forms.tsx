import { createContext, useContext, type ReactNode } from 'react';
import { referenceUses, useMobileEditor } from './workspace';
import type { Asset, Data, Document, Value } from './types';
import { classicColors, isClassic } from './types';
import s from './studio.module.scss';
const AssetContext = createContext<Asset[]>([]);
const DocumentContext = createContext<Document | undefined>(undefined);
export function AuthorFormContext({ document, assets, children }: { document: Document; assets: Asset[]; children: ReactNode }) {
  return (
    <DocumentContext.Provider value={document}>
      <AssetContext.Provider value={assets}>{children}</AssetContext.Provider>
    </DocumentContext.Provider>
  );
}
const optionNames: Record<string, string> = {
  EASY: '쉬움',
  MEDIUM: '보통',
  HARD: '어려움',
  TEXT: '텍스트',
  DISCORD: 'Discord',
  ko: '한국어',
  PUBLIC_AND_WHISPER: '공개·밀담 공유',
  PUBLIC: '공개 공유',
  PRIVATE: '개인 전용',
  NO_ACCUSATION: '지목 없음',
  PHASE_STARTED: '단계 시작',
  CLUE_PUBLISHED: '단서 공개',
  BALLOT_CLOSED: '투표 종료',
  READING: '자료 읽기',
  INVESTIGATION: '조사',
  DISCUSSION: '토론',
  VOTE: '투표',
  ENDING: '엔딩',
  CHAT: '전체 대화',
  WHISPER: '밀담',
  INVESTIGATE: '조사',
  SHARE: '단서 공유',
  CARD: '카드',
  TOKEN: '말',
  DICE: '주사위',
  COUNTER: '카운터',
  ALWAYS: '항상',
  CULPRIT_IDENTIFIED: '범인 지목 성공',
  CLUE_PUBLIC: '단서가 공개됨',
  HAS_CLUE: '역할이 단서를 소유',
  FLAG: '설정값 일치',
  NOT: '아래 조건이 아님',
  ALL: '모든 조건 충족',
  ANY: '하나 이상의 조건 충족',
  GRANT_CLUE: '역할에 단서 지급',
  PUBLISH_MATERIAL: '안내 문구 공개',
  SET_FLAG: '설정값 변경'
};
export function newAuthorItem(name: string, values: Value[] = []) {
  return newItem(name, values);
}

const labels: Record<string, string> = {
  id: '식별자',
  slug: '주소 이름',
  title: '제목',
  synopsis: '소개',
  playerCount: '기본 인원',
  estimatedMinutes: '예상 시간(분)',
  genre: '장르',
  difficulty: '난이도',
  language: '언어',
  modes: '지원 대화 방식',
  roles: '등장인물',
  name: '이름',
  publicIntro: '공개 소개',
  secret: '개인 비밀',
  objective: '개인 목표',
  text: '내용',
  condition: '조건',
  phases: '진행 단계',
  kind: '종류',
  durationSeconds: '시간(초)',
  publicText: '공개 안내',
  actions: '허용 행동',
  investigationLimit: '조사 횟수',
  clues: '단서',
  sharePolicy: '공유 범위',
  targets: '조사 장소',
  phaseIds: '진행 단계 식별자',
  clueIds: '단서 식별자',
  ballot: '범인 투표',
  culpritRoleId: '범인 역할 식별자',
  allowChange: '투표 변경 허용',
  allowAbstain: '기권 허용',
  tiePolicy: '동률 처리',
  endings: '엔딩',
  rules: '사건 규칙',
  when: '발동 시점',
  effects: '효과',
  phaseId: '단계 식별자',
  clueId: '단서 식별자',
  roleId: '역할 식별자',
  flag: '플래그 이름',
  value: '값',
  type: '유형',
  conditions: '하위 조건',
  objects: '테이블 물체',
  decks: '카드 덱',
  cards: '덱 카드',
  assetId: '앞면 이미지',
  backAssetId: '뒷면 이미지',
  layoutId: '카드 디자인',
  backLayoutId: '덱 공통 뒷면 디자인',
  x: '가로 위치',
  y: '세로 위치',
  width: '너비',
  height: '높이',
  locked: '위치 잠금',
  faceUp: '앞면 공개',
  sides: '주사위 면수',
  tabletop: '자유 테이블',
  supportedPlayerCounts: '지원 인원'
};
const options: Record<string, string[]> = {
  difficulty: ['EASY', 'MEDIUM', 'HARD'],
  language: ['ko'],
  sharePolicy: ['PUBLIC_AND_WHISPER', 'PUBLIC', 'PRIVATE'],
  tiePolicy: ['NO_ACCUSATION'],
  when: ['PHASE_STARTED', 'CLUE_PUBLISHED', 'BALLOT_CLOSED']
};
const templates: Record<string, Value> = {
  roles: { id: 'role', name: '새 인물', publicIntro: '', secret: '', objective: { text: '', condition: { type: 'ALWAYS' } } },
  phases: { id: 'phase', kind: 'DISCUSSION', durationSeconds: 300, publicText: '', actions: ['CHAT'], investigationLimit: 0 },
  clues: { id: 'clue', title: '새 단서', text: '', sharePolicy: 'PUBLIC_AND_WHISPER' },
  targets: { id: 'target', name: '새 조사 장소', phaseIds: [], clueIds: [] },
  endings: { id: 'ending', title: '새 엔딩', text: '', condition: { type: 'ALWAYS' } },
  rules: { id: 'rule', when: 'PHASE_STARTED', phaseId: '', condition: { type: 'ALWAYS' }, effects: [{ type: 'PUBLISH_MATERIAL', text: '' }] },
  effects: { type: 'PUBLISH_MATERIAL', text: '' },
  conditions: { type: 'ALWAYS' },
  objects: {
    id: 'object',
    kind: 'CARD',
    name: '새 카드',
    text: '',
    assetId: null,
    backAssetId: null,
    layoutId: null,
    x: 40,
    y: 40,
    width: 120,
    height: 160,
    locked: false,
    faceUp: false,
    sides: 6,
    value: 0
  },
  decks: { id: 'deck', name: '새 덱', backAssetId: null, backLayoutId: null, x: 40, y: 40, cards: [] },
  cards: { id: 'card', name: '새 카드', text: '', assetId: null, layoutId: null }
};
function newItem(name: string, values: Value[]): Value {
  const item = structuredClone(templates[name] ?? values[values.length - 1] ?? '');
  if (item && typeof item === 'object' && !Array.isArray(item) && 'id' in item) item.id = `${name.slice(0, 8)}-${crypto.randomUUID().slice(0, 8)}`;
  return item;
}
const conditionTemplates: Record<string, Data> = {
  ALWAYS: { type: 'ALWAYS' },
  CULPRIT_IDENTIFIED: { type: 'CULPRIT_IDENTIFIED' },
  CLUE_PUBLIC: { type: 'CLUE_PUBLIC', clueId: '' },
  HAS_CLUE: { type: 'HAS_CLUE', clueId: '', roleId: '' },
  FLAG: { type: 'FLAG', flag: '', value: true },
  NOT: { type: 'NOT', condition: { type: 'ALWAYS' } },
  ALL: { type: 'ALL', conditions: [{ type: 'ALWAYS' }] },
  ANY: { type: 'ANY', conditions: [{ type: 'ALWAYS' }] }
};
const effectTemplates: Record<string, Data> = {
  GRANT_CLUE: { type: 'GRANT_CLUE', roleId: '', clueId: '' },
  PUBLISH_MATERIAL: { type: 'PUBLISH_MATERIAL', text: '' },
  SET_FLAG: { type: 'SET_FLAG', flag: '', value: true }
};
export function Field({ name, value, onChange, path = name }: { name: string; value: Value; onChange: (value: Value) => void; path?: string }) {
  const mobile = useMobileEditor();
  const assets = useContext(AssetContext);
  const document = useContext(DocumentContext);
  const title = labels[name] ?? name;
  const reference = ({ phaseId: 'phases', phaseIds: 'phases', roleId: 'roles', culpritRoleId: 'roles', clueId: 'clues', clueIds: 'clues' } as Record<string, string>)[name];
  if (reference && document) {
    const items = (document[reference] ?? []) as Data[];
    if (Array.isArray(value))
      return (
        <fieldset data-field-path={path}>
          <legend>{title.replace(' 식별자', '')}</legend>
          {items.map((item) => (
            <label key={String(item.id)} className={s.checkLabel}>
              <input disabled={mobile} type="checkbox" checked={value.includes(item.id)} onChange={(e) => onChange(e.target.checked ? [...value, item.id] : value.filter((v) => v !== item.id))} />
              {String(item.name ?? item.title ?? optionNames[String(item.kind)] ?? item.id)}
            </label>
          ))}
          {!items.length && <p>먼저 연결할 항목을 추가하세요.</p>}
        </fieldset>
      );
    return (
      <label data-field-path={path}>
        {title.replace(' 식별자', '')}
        <select disabled={mobile} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>
          <option value="">선택하세요</option>
          {items.map((item) => (
            <option key={String(item.id)} value={String(item.id)}>
              {String(item.name ?? item.title ?? optionNames[String(item.kind)] ?? item.id)}
            </option>
          ))}
          {value && !items.some((item) => item.id === value) && <option value={String(value)}>연결 대상 없음 · {String(value)}</option>}
        </select>
      </label>
    );
  }
  if (name === 'layoutId' || name === 'backLayoutId')
    return (
      <label data-field-path={path}>
        {title}
        <select value={String(value ?? '')} onChange={(e) => onChange(e.target.value || null)}>
          <option value="">기존 이미지·문구 사용</option>
          {document?.presentation.cardLayouts?.map((layout) => (
            <option value={layout.id} key={layout.id}>
              {layout.name}
            </option>
          ))}
        </select>
      </label>
    );
  if (name === 'id') return <small className={s.identifier}>자동 식별자 · {String(value)}</small>;
  if (name === 'assetId' || name === 'backAssetId')
    return (
      <label data-field-path={path}>
        {title}
        <select value={String(value ?? '')} onChange={(e) => onChange(e.target.value || null)}>
          <option value="">없음</option>
          {assets
            .filter((a) => a.mimeType.startsWith('image/'))
            .map((a) => (
              <option value={a.id} key={a.id}>
                {a.name}
              </option>
            ))}
        </select>
      </label>
    );
  if (Array.isArray(value)) {
    const choices = name === 'modes' ? ['TEXT', 'DISCORD'] : name === 'actions' ? ['CHAT', 'WHISPER', 'INVESTIGATE', 'SHARE', 'VOTE'] : name === 'supportedPlayerCounts' ? ['1', '2', '3', '4'] : null;
    if (choices)
      return (
        <fieldset data-field-path={path}>
          <legend>{title}</legend>
          {choices.map((option) => (
            <label key={option}>
              <input
                type="checkbox"
                disabled={mobile}
                checked={value.some((v) => String(v) === option)}
                onChange={(e) => onChange(e.target.checked ? [...value, name === 'supportedPlayerCounts' ? Number(option) : option] : value.filter((v) => String(v) !== option))}
              />
              {optionNames[option] ?? option}
            </label>
          ))}
        </fieldset>
      );
    return (
      <fieldset data-field-path={path}>
        <legend>{title}</legend>
        {value.map((item, index) => (
          <details key={item && typeof item === 'object' && !Array.isArray(item) && item.id ? String(item.id) : index} open={typeof item !== 'object'}>
            <summary>
              {title} {index + 1}
              {item && typeof item === 'object' && !Array.isArray(item) ? ` · ${String(item.name ?? item.title ?? item.id ?? '')}` : ''}
            </summary>
            <Field name={name.replace(/s$/, '')} path={`${path}.${index}`} value={item} onChange={(next) => onChange(value.map((v, i) => (i === index ? next : v)))} />
            <div className={s.row}>
              <button
                type="button"
                disabled={mobile || !index}
                onClick={() => {
                  const a = [...value];
                  [a[index - 1], a[index]] = [a[index], a[index - 1]];
                  onChange(a);
                }}
              >
                위로
              </button>
              <button
                type="button"
                disabled={mobile || (!!document && !!item && typeof item === 'object' && !Array.isArray(item) && !!item.id && referenceUses(document, String(item.id), `${path}.${index}`).length > 0)}
                title="다른 항목에서 참조 중이면 연결을 먼저 해제하세요"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
              >
                삭제
              </button>
            </div>
          </details>
        ))}
        <button disabled={mobile} type="button" onClick={() => onChange([...value, newItem(name, value)])}>
          {title} 추가
        </button>
      </fieldset>
    );
  }
  if (value !== null && typeof value === 'object') {
    const isCondition = name === 'condition';
    const typed = isCondition ? conditionTemplates : name === 'effect' ? effectTemplates : null;
    return (
      <div className={s.fields}>
        {typed && (
          <label>
            {title} 유형
            <select disabled={mobile} value={String(value.type ?? 'ALWAYS')} onChange={(e) => onChange(structuredClone(typed[e.target.value]))}>
              {Object.keys(typed).map((t) => (
                <option key={t} value={t}>
                  {optionNames[t] ?? t}
                </option>
              ))}
            </select>
          </label>
        )}
        {(value.type === 'FLAG' || value.type === 'SET_FLAG') && (
          <label>
            값 형식
            <select disabled={mobile} value={typeof value.value} onChange={(e) => onChange({ ...value, value: e.target.value === 'boolean' ? true : e.target.value === 'number' ? 0 : '' })}>
              <option value="boolean">참 / 거짓</option>
              <option value="number">숫자</option>
              <option value="string">문자열</option>
            </select>
          </label>
        )}
        {Object.entries(value)
          .filter(([key]) => !(typed && key === 'type'))
          .map(([key, v]) => (
            <Field
              key={key}
              name={key}
              path={`${path}.${key}`}
              value={v}
              onChange={(next) => {
                if (key === 'when') {
                  const clean: Data = { ...value, when: next };
                  delete clean.phaseId;
                  delete clean.clueId;
                  if (next === 'PHASE_STARTED') clean.phaseId = '';
                  if (next === 'CLUE_PUBLISHED') clean.clueId = '';
                  onChange(clean);
                } else onChange({ ...value, [key]: next });
              }}
            />
          ))}
      </div>
    );
  }
  if (typeof value === 'boolean')
    return (
      <label data-field-path={path} className={s.checkLabel}>
        <input disabled={mobile} type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
        {title}
      </label>
    );
  if (typeof value === 'number')
    return (
      <label data-field-path={path}>
        {title}
        <input disabled={mobile} type="number" step="any" value={value} onChange={(e) => onChange(Number(e.target.value))} />
      </label>
    );
  const selections = name === 'kind' ? (path.includes('phases') ? ['READING', 'INVESTIGATION', 'DISCUSSION', 'VOTE', 'ENDING'] : ['CARD', 'TOKEN', 'DICE', 'COUNTER']) : options[name];
  return (
    <label data-field-path={path}>
      {title}
      {selections ? (
        <select disabled={mobile} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>
          {selections.map((o) => (
            <option key={o} value={o}>
              {optionNames[o] ?? o}
            </option>
          ))}
        </select>
      ) : ['synopsis', 'text', 'secret', 'publicIntro', 'publicText'].includes(name) ? (
        <textarea aria-label={`${path} ${title}`} rows={4} value={String(value ?? '')} onChange={(e) => onChange(value === null && !e.target.value ? null : e.target.value)} />
      ) : (
        <input type="text" aria-label={`${path} ${title}`} value={String(value ?? '')} onChange={(e) => onChange(value === null && !e.target.value ? null : e.target.value)} />
      )}
    </label>
  );
}
export function RulesForm({ document, onChange, assets = [] }: { document: Document; onChange: (d: Document) => void; assets?: Asset[] }) {
  const keys = document.gameType === 'MURDER_MYSTERY' ? ['roles', 'phases', 'clues', 'targets', 'ballot', 'endings', 'rules'] : document.gameType === 'TABLETOP' ? ['tabletop'] : [];
  return (
    <AuthorFormContext document={document} assets={assets}>
      <div className={s.fields}>
        {isClassic(document.gameType) && (
          <fieldset>
            <legend>게임판과 말 디자인</legend>
            <p>정해진 2인 규칙으로 진행합니다. 놓을 수 있는 칸과 승패는 서버가 판정합니다. 규칙은 고정되며 이름·소개·장면·색상을 꾸밀 수 있습니다.</p>
            {Object.entries({ boardColor: '게임판 색상', lightSquareColor: '밝은 칸 색상', darkSquareColor: '어두운 칸 색상', firstPieceColor: '1번 말 색상', secondPieceColor: '2번 말 색상' }).map(
              ([key, label]) => (
                <label key={key} data-field-path={`classic.${key}`}>
                  {label}
                  <input
                    type="color"
                    value={String((document.classic as Data | undefined)?.[key] ?? classicColors[key as keyof typeof classicColors]).slice(0, 7)}
                    onChange={(e) => onChange({ ...document, classic: { ...classicColors, ...(document.classic as Data | undefined), [key]: e.target.value } })}
                  />
                </label>
              )
            )}
          </fieldset>
        )}
        {document.gameType === 'YACHT' && <p>주사위 5개, 최대 3회 굴림, 12개 점수칸과 상단 합계 63점 보너스 35점을 서버에서 판정합니다. 제작자는 이름·소개·장면을 꾸밀 수 있습니다.</p>}
        {document.gameType === 'YACHT' && (
          <fieldset>
            <legend>요트 디자인</legend>
            {[
              ['diceColor', '주사위 색상', '#fffaf0'],
              ['pipColor', '눈 색상', '#242a27'],
              ['scoreboardColor', '점수판 색상', '#ffffff']
            ].map(([key, label, fallback]) => (
              <label key={key} data-field-path={`yacht.${key}`}>
                {label}
                <input
                  type="color"
                  value={String((document.yacht as Data | undefined)?.[key] ?? fallback)}
                  onChange={(e) =>
                    onChange({ ...document, yacht: { diceColor: '#fffaf0', pipColor: '#242a27', scoreboardColor: '#ffffff', ...(document.yacht as Data | undefined), [key]: e.target.value } })
                  }
                />
              </label>
            ))}
          </fieldset>
        )}
        {keys.map((key) => (
          <fieldset key={key}>
            <legend>{labels[key]}</legend>
            <Field name={key} value={(document[key] ?? (key === 'tabletop' ? { objects: [], decks: [] } : [])) as Value} onChange={(v) => onChange({ ...document, [key]: v })} />
          </fieldset>
        ))}
      </div>
    </AuthorFormContext>
  );
}
