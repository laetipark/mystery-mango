import { useState } from 'react';
import { gameTypeNames, type GameType, type StarterTemplate } from './types';
import s from './editor-chrome.module.scss';

export function TemplateLibrary({
  templates,
  currentType,
  onPick,
  loading,
  error
}: {
  templates: StarterTemplate[];
  currentType: GameType;
  onPick: (template: StarterTemplate) => void;
  loading: boolean;
  error: boolean;
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [blank, setBlank] = useState(false);
  const shown = templates.filter(
    (template) =>
      Boolean(template.blank) === blank && (filter === 'ALL' || template.gameType === filter) && `${template.title} ${gameTypeNames[template.gameType]} ${template.description}`.includes(query)
  );
  return (
    <div className={s.templateLibrary}>
      <div className={s.panelTitle}>
        <h2>게임 템플릿</h2>
        <small>새 작품 시작</small>
      </div>
      <label className={s.searchLabel}>
        <span>템플릿 검색</span>
        <input type="search" placeholder="어떤 게임을 만들고 싶나요?" value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      <div className={s.pills} aria-label="템플릿 분류">
        {(
          [
            ['ALL', '전체'],
            ['MURDER_MYSTERY', '추리'],
            ['TABLETOP', '카드'],
            ['YACHT', '주사위']
          ] as const
        ).map(([value, label]) => (
          <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>
            {label}
          </button>
        ))}
      </div>
      <label className={s.blankChoice}>
        <input type="checkbox" checked={blank} onChange={(e) => setBlank(e.target.checked)} />빈 템플릿 보기
      </label>
      <p className={s.libraryPrompt}>이야기의 시작을 골라보세요</p>
      {loading && <p role="status">템플릿을 불러오는 중…</p>}
      {error && <p role="alert">템플릿을 불러오지 못했습니다. 잠시 후 다시 열어 주세요.</p>}
      <div className={s.templateGrid}>
        {shown.map((template) => (
          <button className={s.templateCard} key={template.id} onClick={() => onPick(template)} aria-label={`${template.title} 새 작품 만들기`}>
            <span className={s.templateCover} data-kind={template.gameType} data-current={template.gameType === currentType}>
              <small>MANGO ORIGINAL</small>
              <strong>
                {blank ? '나만의\n' : ''}
                {gameTypeNames[template.gameType]}
              </strong>
              <i aria-hidden="true">{{ MURDER_MYSTERY: '◒', TABLETOP: '♧', YACHT: '⚄', GOMOKU: '●', REVERSI: '◐', CHECKERS: '◇' }[template.gameType]}</i>
            </span>
            <strong>{template.title}</strong>
            <small>{blank ? '빈 템플릿' : '기본 템플릿'}</small>
          </button>
        ))}
      </div>
      {!loading && !error && shown.length === 0 && <p>검색 조건에 맞는 템플릿이 없습니다.</p>}
      <p className={s.libraryTip}>템플릿을 고르면 새 작품을 만듭니다. 지금 편집하는 작품은 그대로 보관됩니다.</p>
    </div>
  );
}
