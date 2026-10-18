import { useEffect, type CSSProperties } from 'react';
import { AuthorFormContext, Field, newAuthorItem } from './forms';
import { WorkspacePanels, referenceUses, referenceLabel, useMobileEditor } from './workspace';
import type { Asset, Data, Document, Scene, Value } from './types';
import s from './studio.module.scss';
import f from './rule-flow.module.scss';
import d from './editor-details.module.scss';
import { navigateEditor, useEditorState } from './editor-memory';
const sections: Record<string, string> = { phases: '진행 단계', roles: '등장인물', clues: '단서', targets: '조사 장소', rules: '사건 규칙', endings: '엔딩', ballot: '범인 투표' };
const phases: Record<string, string> = { READING: '자료 읽기', INVESTIGATION: '조사', DISCUSSION: '토론', VOTE: '투표', ENDING: '엔딩' };
function rows(document: Document, key: string) {
  return (document[key] ?? []) as Data[];
}
function title(item: Data) {
  return String(item.name ?? item.title ?? phases[String(item.kind)] ?? item.id ?? '항목');
}
const actionNames: Record<string, string> = { CHAT: '전체 대화', INVESTIGATE: '조사', SHARE: '자료 공개', WHISPER: '밀담', VOTE: '투표' };
function reference(document: Document, group: string, id: Value | undefined) {
  return title(rows(document, group).find((item) => item.id === id) ?? { name: '연결 대상 미선택' });
}
/** Describes the stored predicate; the Java engine remains responsible for evaluating it. */
function conditionText(value: Value | undefined, document: Document, depth = 0): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return '조건을 설정하세요';
  if (depth > 5) return '하위 조건';
  switch (value.type) {
    case 'ALWAYS':
      return '항상';
    case 'CULPRIT_IDENTIFIED':
      return '범인을 올바르게 지목';
    case 'CLUE_PUBLIC':
      return `단서 「${reference(document, 'clues', value.clueId)}」 공개`;
    case 'HAS_CLUE':
      return `${value.roleId ? reference(document, 'roles', value.roleId) : '해당 역할'}이 「${reference(document, 'clues', value.clueId)}」 보유`;
    case 'FLAG':
      return `설정값 ${String(value.flag ?? '미선택')} = ${String(value.value ?? '미설정')}`;
    case 'NOT':
      return `아님: (${conditionText(value.condition, document, depth + 1)})`;
    case 'ALL':
    case 'ANY':
      return `${value.type === 'ALL' ? '모두 충족' : '하나 이상 충족'}: ${((value.conditions ?? []) as Value[]).map((entry) => conditionText(entry, document, depth + 1)).join(' · ') || '조건 미선택'}`;
    default:
      return '조건을 확인하세요';
  }
}
function triggerText(rule: Data, document: Document) {
  if (rule.when === 'PHASE_STARTED') return `${reference(document, 'phases', rule.phaseId)} 단계 시작`;
  if (rule.when === 'CLUE_PUBLISHED') return `「${reference(document, 'clues', rule.clueId)}」 공개`;
  return rule.when === 'BALLOT_CLOSED' ? '범인 투표 마감' : '실행 시점 미선택';
}
function duration(seconds: Value | undefined) {
  const count = Number(seconds ?? 0);
  if (!Number.isFinite(count) || count <= 0) return '시간 미설정';
  return [Math.floor(count / 60) ? `${Math.floor(count / 60)}분` : '', count % 60 ? `${count % 60}초` : ''].filter(Boolean).join(' ');
}
function phasePosition(index: number) {
  const row = Math.floor(index / 2);
  return { row, column: row % 2 ? 1 - (index % 2) : index % 2 };
}
export function MysteryEditor({ document, assets, patch, openScene }: { document: Document; assets: Asset[]; patch: (fn: (d: Document) => Document) => void; openScene: (id: string) => void }) {
  const mobile = useMobileEditor();
  const [selectedGroup, setSelectedGroup] = useEditorState('story-group', 'phases');
  const [selectedId, setSelectedId] = useEditorState('story-item', '');
  const [selectionActive, setSelectionActive] = useEditorState('story-selection-active', false);
  const [search, setSearch] = useEditorState('story-search', '');
  const [kindFilter, setKindFilter] = useEditorState('story-kind-filter', 'ALL');
  const selection = { group: Object.hasOwn(sections, selectedGroup) ? selectedGroup : 'phases', id: selectedId };
  const visibleGroups = Object.entries(sections).filter(([group]) => kindFilter === 'ALL' || group === kindFilter);
  const matches = (item: Data) => title(item).toLocaleLowerCase().includes(search.trim().toLocaleLowerCase());
  const visibleItems = visibleGroups.flatMap(([group]) =>
    group === 'ballot'
      ? matches({ name: '투표 설정' })
        ? [{ group, id: '' }]
        : []
      : rows(document, group)
          .filter(matches)
          .map((item) => ({ group, id: String(item.id) }))
  );

  const items = selection.group === 'ballot' ? [] : rows(document, selection.group);
  const index = Math.max(
    0,
    items.findIndex((item) => item.id === selection.id)
  );
  const selected = selection.group === 'ballot' ? (document.ballot as Data) : items[index];
  const path = selection.group === 'ballot' ? 'ballot' : `${selection.group}.${index}`;
  const uses = selected?.id ? referenceUses(document, String(selected.id), path) : [];
  const visibleIndex = visibleItems.findIndex((item) => item.group === selection.group && item.id === (selected?.id ?? ''));
  const materialKind = selection.group === 'roles' ? 'ROLE' : 'CLUE';
  const linkedMaterials =
    ['roles', 'clues'].includes(selection.group) && selected ? document.presentation.scenes.filter((scene) => scene.kind === materialKind && scene.referenceId === selected.id) : [];
  const phaseList = rows(document, 'phases');
  const endingList = rows(document, 'endings');
  const flowHeight = Math.ceil(phaseList.length / 2) * 130 + 16;
  function isSelected(group: string, id: Value | undefined) {
    return selectionActive && selection.group === group && (group === 'ballot' || selected?.id === id);
  }
  function choose(group: string, id: string) {
    setSelectedGroup(group);
    setSelectedId(id);
    setSelectionActive(true);
  }
  useEffect(() => {
    function focusReference(event: Event) {
      const target = (event as CustomEvent<string>).detail;
      if (typeof target !== 'string') return;
      const [group, offset] = target.split('.');
      if (!Object.hasOwn(sections, group)) return;
      const item = group === 'ballot' ? document.ballot : rows(document, group)[Number(offset)];
      if (!item) return;
      setSelectedGroup(group);
      setSelectedId(group === 'ballot' ? '' : String((item as Data).id));
      setSelectionActive(true);
      setSearch('');
      setKindFilter('ALL');
      window.setTimeout(() => {
        const container = Array.from(window.document.querySelectorAll<HTMLElement>('[data-field-path]')).find((element) => element.getAttribute('data-field-path') === target);
        const field =
          container?.querySelector<HTMLElement>('input, textarea, select, button') ??
          Array.from(window.document.querySelectorAll<HTMLElement>('[aria-label]')).find((element) => {
            const label = element.getAttribute('aria-label') ?? '';
            return element.getClientRects().length > 0 && (label.startsWith(`${target} `) || label.startsWith(`${target}.`));
          });
        field?.dispatchEvent(new Event('studio-reveal', { bubbles: true }));
        field?.focus();
        field?.scrollIntoView({ block: 'nearest' });
      }, 30);
    }
    window.addEventListener('studio-focus-field', focusReference);
    return () => window.removeEventListener('studio-focus-field', focusReference);
  }, [document, setSelectedGroup, setSelectedId, setSelectionActive, setSearch, setKindFilter]);
  function add(group: string) {
    const item = newAuthorItem(group) as Data;
    patch((d) => ({ ...d, [group]: [...rows(d, group), item] }));
    choose(group, String(item.id));
  }
  function update(value: Value) {
    patch((d) => ({ ...d, [selection.group]: selection.group === 'ballot' ? value : rows(d, selection.group).map((item, i) => (i === index ? value : item)) }));
  }
  function material(createAnother = false) {
    if (!selected) return;
    const kind = selection.group === 'roles' ? 'ROLE' : 'CLUE';
    const existing = document.presentation.scenes.find((scene) => scene.kind === kind && scene.referenceId === selected.id);
    if (existing && !createAnother) {
      openScene(existing.id);
      return;
    }
    const id = `scene-${crypto.randomUUID().slice(0, 8)}`;
    const scene: Scene = {
      id,
      name: `${title(selected)} 자료${linkedMaterials.length ? ` ${linkedMaterials.length + 1}` : ''}`,
      kind,
      referenceId: String(selected.id),
      phaseIds: [],
      width: 720,
      height: 1080,
      background: '#fffaf0',
      bgmAssetId: null,
      nodes: [
        {
          id: `node-${crypto.randomUUID().slice(0, 8)}`,
          kind: 'MATERIAL',
          x: 48,
          y: 70,
          width: 624,
          height: 860,
          rotation: 0,
          fill: '#223e32',
          text: `${title(selected)}\n${String(selected.secret ?? selected.text ?? '')}`,
          fontSize: 28,
          assetId: null,
          locked: false,
          hidden: false,
          bindingType: kind,
          bindingId: String(selected.id)
        }
      ]
    };
    patch((d) => ({ ...d, presentation: { ...d.presentation, scenes: [...d.presentation.scenes, scene] } }));
    openScene(id);
  }
  return (
    <AuthorFormContext document={document} assets={assets}>
      <WorkspacePanels memoryKey="story"
        selectionKey={selectionActive && selected ? `${selection.group}:${String(selected.id ?? 'ballot')}` : null}
        onClearSelection={() => setSelectionActive(false)}
        left={
          <>
            <span className={s.eyebrow}>이야기 구성</span>
            <h3>등장인물부터 엔딩까지</h3>
            <div className={d.toolbar}>
              <label>
                이야기 항목 검색
                <input type="search" value={search} placeholder="이름으로 검색" onChange={(event) => setSearch(event.target.value)} />
              </label>
              <label>
                이야기 항목 종류
                <select aria-label="이야기 항목 종류" value={kindFilter} onChange={(event) => setKindFilter(event.target.value)}>
                  <option value="ALL">모든 종류</option>
                  {Object.entries(sections).map(([value, name]) => (
                    <option key={value} value={value}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className={d.summary} role="status">
              검색 결과 {visibleItems.length}개
            </p>
            {visibleGroups.map(([group, label]) => (
              <section key={group} className={s.structureSection}>
                <div className={s.sectionRow}>
                  <strong>{label}</strong>
                  {group !== 'ballot' && (
                    <button disabled={mobile} aria-label={`${label} 추가`} onClick={() => add(group)}>
                      ＋
                    </button>
                  )}
                </div>
                {group === 'ballot'
                  ? matches({ name: '투표 설정' }) && (
                      <button className={isSelected(group, '') ? s.selected : ''} onClick={() => choose(group, '')}>
                        투표 설정
                      </button>
                    )
                  : rows(document, group)
                      .filter(matches)
                      .map((item) => (
                        <button key={String(item.id)} className={isSelected(group, item.id) ? s.selected : ''} onClick={() => choose(group, String(item.id))}>
                          {title(item)}
                        </button>
                      ))}
              </section>
            ))}
          </>
        }
        center={
          <div className={f.flowBoard}>
            <header className={f.flowHeading}>
              <div>
                <span className={f.eyebrow}>FLOW &amp; RULES</span>
                <h2>이야기의 흐름을 연결하세요</h2>
                <p>단계를 선택해 허용 행동을 정하고, 마지막에 도달할 엔딩 조건을 살펴보세요.</p>
              </div>
              <div className={f.flowBadges}>
                <span>머더미스터리</span>
                <span>
                  {phaseList.length}개 단계 · {endingList.length}개 엔딩
                </span>
              </div>
            </header>
            <section className={f.flowSurface} aria-label="진행 단계와 엔딩 연결도">
              {phaseList.length ? (
                <div className={f.phaseGraph} style={{ '--flow-height': `${flowHeight}px` } as CSSProperties}>
                  <svg className={f.connectors} viewBox={`0 0 100 ${flowHeight}`} preserveAspectRatio="none" aria-hidden="true">
                    {phaseList.slice(1).map((phase, index) => {
                      const from = phasePosition(index),
                        to = phasePosition(index + 1);
                      const y = from.row * 130 + 58;
                      if (from.row === to.row) {
                        const end = to.column ? 62 : 38,
                          tail = end + (to.column ? -1.2 : 1.2);
                        return (
                          <g key={String(phase.id)}>
                            <path d={`M ${from.column ? 62 : 38} ${y} H ${end}`} />
                            <polygon points={`${end},${y} ${tail},${y - 4} ${tail},${y + 4}`} />
                          </g>
                        );
                      }
                      const x = to.column ? 77 : 23,
                        bottom = to.row * 130 + 8;
                      return (
                        <g key={String(phase.id)}>
                          <path d={`M ${x} ${from.row * 130 + 108} V ${bottom}`} />
                          <polygon points={`${x},${bottom} ${x - 0.8},${bottom - 7} ${x + 0.8},${bottom - 7}`} />
                        </g>
                      );
                    })}
                    {endingList.length > 0 &&
                      (() => {
                        const last = phasePosition(phaseList.length - 1);
                        return <path d={`M ${last.column ? 77 : 23} ${last.row * 130 + 108} V ${flowHeight - 12} H 50 V ${flowHeight}`} />;
                      })()}
                  </svg>
                  <ol className={f.phaseList}>
                    {phaseList.map((phase, n) => {
                      const position = phasePosition(n);
                      return (
                        <li
                          key={String(phase.id)}
                          className={`${f.phaseNode} ${position.column ? f.rightNode : f.leftNode}`}
                          style={{ '--phase-row': position.row } as CSSProperties}
                          data-selected={isSelected('phases', phase.id)}
                          data-kind={String(phase.kind)}
                        >
                          <button className={f.nodeSelect} aria-label={title(phase)} aria-pressed={isSelected('phases', phase.id)} onClick={() => choose('phases', String(phase.id))}>
                            <span className={f.nodeStep}>
                              STEP {String(n + 1).padStart(2, '0')} <span>{duration(phase.durationSeconds)}</span>
                            </span>
                            <strong>{title(phase)}</strong>
                            <span className={f.nodeActions}>{((phase.actions ?? []) as Value[]).map((action) => actionNames[String(action)] ?? String(action)).join(' · ') || '허용 행동 없음'}</span>
                          </button>
                          <div className={f.orderControls} aria-label={`${title(phase)} 순서`}>
                            {[-1, 1].map((direction) => (
                              <button
                                key={direction}
                                aria-label={`${title(phase)} ${direction < 0 ? '앞으로' : '뒤로'}`}
                                disabled={mobile || n + direction < 0 || n + direction >= phaseList.length}
                                onClick={() =>
                                  patch((d) => {
                                    const next = [...rows(d, 'phases')];
                                    [next[n], next[n + direction]] = [next[n + direction], next[n]];
                                    return { ...d, phases: next };
                                  })
                                }
                              >
                                {direction < 0 ? '← 앞 단계로' : '뒤 단계로 →'}
                              </button>
                            ))}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ) : (
                <div className={f.empty}>진행 단계를 추가하면 이야기의 순서가 이곳에 나타납니다.</div>
              )}
              <div className={f.endingSection}>
                <div className={f.endingCaption}>
                  <span>엔딩 조건</span>
                  <small>아래 순서에서 처음 충족하는 엔딩 하나를 선택합니다</small>
                </div>
                {endingList.length ? (
                  <div className={f.endingGrid}>
                    {endingList.map((ending, index) => (
                      <button
                        key={String(ending.id)}
                        className={f.endingNode}
                        data-selected={isSelected('endings', ending.id)}
                        data-fallback={(ending.condition as Data | undefined)?.type === 'ALWAYS'}
                        aria-pressed={isSelected('endings', ending.id)}
                        onClick={() => choose('endings', String(ending.id))}
                      >
                        <span className={f.nodeStep}>
                          RESULT {String(index + 1).padStart(2, '0')}
                          {(ending.condition as Data | undefined)?.type === 'ALWAYS' && <span>기본 엔딩</span>}
                        </span>
                        <strong>{title(ending)}</strong>
                        <span>{conditionText(ending.condition, document)}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className={f.empty}>조건에 맞는 엔딩과 마지막 기본 엔딩을 추가하세요.</p>
                )}
              </div>
            </section>
            <p className={f.flowNote}>단계는 표시된 순서로 진행됩니다. 장면 변경은 단계 이동과 별개이며, 조건 판정과 자료 공개는 서버 시험에서 확인하세요.</p>
            <section className={f.detailSection} aria-label="사건 규칙 연결">
              <div className={f.sectionHeading}>
                <div>
                  <span className={f.eyebrow}>WHEN · IF · THEN</span>
                  <h3>사건 규칙 연결</h3>
                </div>
                <span>{rows(document, 'rules').length}개 규칙</span>
              </div>
              <div className={f.ruleCards}>
                {rows(document, 'rules').map((rule, index) => (
                  <article className={f.ruleCard} key={String(rule.id)} data-selected={isSelected('rules', rule.id)}>
                    <button className={f.ruleTitle} onClick={() => choose('rules', String(rule.id))}>
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <strong>{title(rule)}</strong>
                      <span aria-hidden="true">↗</span>
                    </button>
                    <dl>
                      <div>
                        <dt>언제</dt>
                        <dd>{triggerText(rule, document)}</dd>
                      </div>
                      <div>
                        <dt>조건</dt>
                        <dd>{conditionText(rule.condition, document)}</dd>
                      </div>
                      <div>
                        <dt>실행</dt>
                        <dd>
                          {((rule.effects ?? []) as Data[])
                            .map((effect) =>
                              effect.type === 'GRANT_CLUE'
                                ? `「${reference(document, 'clues', effect.clueId)}」 → ${reference(document, 'roles', effect.roleId)}에게 지급`
                                : effect.type === 'SET_FLAG'
                                  ? `설정값 ${String(effect.flag ?? '미선택')} = ${String(effect.value ?? '미설정')}`
                                  : effect.type === 'PUBLISH_MATERIAL'
                                    ? '안내 문구 공개'
                                    : '실행 내용 미선택'
                            )
                            .join(' · ') || '실행 내용을 추가하세요'}
                        </dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
              {!rows(document, 'rules').length && <p className={f.empty}>자동으로 실행할 일이 있다면 사건 규칙을 추가하세요.</p>}
            </section>
            <section className={f.detailSection} aria-label="조사 장소와 단서 관계">
              <div className={f.sectionHeading}>
                <div>
                  <span className={f.eyebrow}>DISCOVERY</span>
                  <h3>조사 장소와 발견할 단서</h3>
                </div>
                <span>{rows(document, 'targets').length}개 장소</span>
              </div>
              <div className={f.relationships}>
                {rows(document, 'targets').map((target) => (
                  <article key={String(target.id)} data-selected={isSelected('targets', target.id)}>
                    <button className={f.targetName} onClick={() => choose('targets', String(target.id))}>
                      {title(target)}
                    </button>
                    <span className={f.relationArrow} aria-hidden="true">
                      →
                    </span>
                    <div className={f.clueLinks}>
                      {((target.clueIds ?? []) as Value[]).map((id) => (
                        <button key={String(id)} onClick={() => choose('clues', String(id))}>
                          {reference(document, 'clues', id)}
                        </button>
                      ))}
                      {!((target.clueIds ?? []) as Value[]).length && <span>연결된 단서 없음</span>}
                    </div>
                    <small>{((target.phaseIds ?? []) as Value[]).map((id) => reference(document, 'phases', id)).join(' · ') || '연결된 단계 없음'}</small>
                  </article>
                ))}
              </div>
              {!rows(document, 'targets').length && <p className={f.empty}>조사 장소를 만들고 발견할 단서를 연결하세요.</p>}
            </section>
            <section className={f.detailSection} aria-label="역할 자료 연결">
              <div className={f.sectionHeading}>
                <div>
                  <span className={f.eyebrow}>CHARACTERS</span>
                  <h3>역할 자료</h3>
                </div>
                <span>{rows(document, 'roles').length}개 역할</span>
              </div>
              <div className={f.roleTiles}>
                {rows(document, 'roles').map((role) => (
                  <button key={String(role.id)} aria-label={title(role)} data-selected={isSelected('roles', role.id)} onClick={() => choose('roles', String(role.id))}>
                    <span className={f.roleAvatar} aria-hidden="true">
                      {title(role).slice(0, 1)}
                    </span>
                    <span>
                      <strong>{title(role)}</strong>
                      <small>{document.presentation.scenes.filter((scene) => scene.kind === 'ROLE' && scene.referenceId === role.id).length}개 자료지 연결</small>
                    </span>
                    <span aria-hidden="true">↗</span>
                  </button>
                ))}
              </div>
              {!rows(document, 'roles').length && <p className={f.empty}>등장인물을 추가하면 역할별 자료를 연결할 수 있습니다.</p>}
            </section>
          </div>
        }
        right={
          <>
            <span className={s.eyebrow}>{sections[selection.group]}</span>
            <h3>{selected ? title(selected) : '항목을 선택하세요'}</h3>
            <nav className={d.toolbar} aria-label="이야기 항목 이동">
              <button
                disabled={visibleIndex <= 0}
                onClick={() => {
                  const item = visibleItems[visibleIndex - 1];
                  if (item) choose(item.group, item.id);
                }}
              >
                이전 항목
              </button>
              <span>{visibleIndex < 0 ? '목록 밖 선택' : `${visibleIndex + 1} / ${visibleItems.length}`}</span>
              <button
                disabled={visibleIndex < 0 || visibleIndex >= visibleItems.length - 1}
                onClick={() => {
                  const item = visibleItems[visibleIndex + 1];
                  if (item) choose(item.group, item.id);
                }}
              >
                다음 항목
              </button>
            </nav>
            {selected && (
              <>
                <Field name={selection.group.replace(/s$/, '')} path={path} value={selected} onChange={update} />
                {['roles', 'clues'].includes(selection.group) && (
                  <section className={d.inspectorSection} aria-label="연결된 자료지">
                    <h4>연결된 자료지 · {linkedMaterials.length}개</h4>
                    <div className={d.links}>
                      {linkedMaterials.map((scene) => (
                        <button key={scene.id} onClick={() => openScene(scene.id)}>
                          {scene.name} 열기
                        </button>
                      ))}
                    </div>
                    {!linkedMaterials.length && <p>이 역할 또는 단서를 읽을 자료지를 만들어 주세요.</p>}
                    <button className={s.primaryAction} disabled={mobile && !linkedMaterials.length} onClick={() => material()}>
                      연결된 자료지 만들기·열기
                    </button>
                    {linkedMaterials.length > 0 && (
                      <button disabled={mobile} onClick={() => material(true)}>
                        새 자료지 추가
                      </button>
                    )}
                  </section>
                )}
                {uses.length > 0 && (
                  <div className={s.notice}>
                    <strong>다른 항목에서 사용 중</strong>
                    <ul className={d.links}>
                      {uses.map((path) => (
                        <li key={path}>
                          <button onClick={() => navigateEditor(path)}>{referenceLabel(document, path)} →</button>
                        </li>
                      ))}
                    </ul>
                    <small>연결을 해제한 뒤 삭제할 수 있습니다.</small>
                  </div>
                )}
                {selection.group !== 'ballot' && (
                  <button
                    disabled={mobile || uses.length > 0}
                    onClick={() => {
                      patch((d) => ({ ...d, [selection.group]: rows(d, selection.group).filter((item) => item.id !== selected.id) }));
                      setSelectionActive(false);
                    }}
                  >
                    {sections[selection.group]} 삭제
                  </button>
                )}
              </>
            )}
          </>
        }
      />
    </AuthorFormContext>
  );
}
