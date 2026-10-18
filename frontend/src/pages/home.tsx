import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { GameArt } from '~/components/game-art';
import { Icon } from '~/components/icon';
import { Empty, QueryState, ScenarioCard } from '~/components/ui';
import type { Page, Scenario } from '~/common/types';
import { get } from '~/services/api';
import { gameTypeNames, type GameType } from '~/studio/types';
import s from './home.module.scss';

const categories: { type: GameType; description: string }[] = [
  { type: 'MURDER_MYSTERY', description: '함께 풀어가는 사건' },
  { type: 'TABLETOP', description: '카드와 말로 자유롭게' },
  { type: 'YACHT', description: '다섯 주사위의 한 판' },
  { type: 'GOMOKU', description: '한 수씩 이어가는 승부' },
  { type: 'REVERSI', description: '마지막까지 뒤집는 재미' },
  { type: 'CHECKERS', description: '뛰어넘고, 왕이 되고' }
];

const previewTabs = [
  { id: 'card', label: '카드 디자인', caption: '작은 아이디어가 한 장의 카드로', property: '카드 꾸미기', title: '마지막 편지' },
  { id: 'board', label: '게임판', caption: '카드와 주사위에 자리를 만들어 주세요', property: '게임판 구성', title: '나만의 테이블' },
  { id: 'story', label: '이야기 흐름', caption: '자료에서 결말까지, 이야기를 연결해요', property: '단계 연결', title: '저택의 마지막 밤' }
] as const;

function CreationPreview() {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  return (
    <div className={s.preview} aria-label="제작 화면 예시">
      <div className={s.previewBar}>
        <span className={s.previewMark}>m</span>
        <strong>나의 첫 번째 이야기</strong>
        <span>제작 화면 예시</span>
      </div>
      <div className={s.previewTabs} role="tablist" aria-label="제작 화면 예시 종류">
        {previewTabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={(element) => {
              tabs.current[index] = element;
            }}
            id={`home-preview-tab-${tab.id}`}
            role="tab"
            type="button"
            aria-selected={active === index}
            aria-controls={`home-preview-panel-${tab.id}`}
            tabIndex={active === index ? 0 : -1}
            onClick={() => setActive(index)}
            onKeyDown={(event) => {
              const next =
                event.key === 'ArrowRight'
                  ? (index + 1) % previewTabs.length
                  : event.key === 'ArrowLeft'
                    ? (index + previewTabs.length - 1) % previewTabs.length
                    : event.key === 'Home'
                      ? 0
                      : event.key === 'End'
                        ? previewTabs.length - 1
                        : null;
              if (next === null) return;
              event.preventDefault();
              setActive(next);
              tabs.current[next]?.focus();
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {previewTabs.map((tab, index) => (
        <div key={tab.id} className={s.previewBody} id={`home-preview-panel-${tab.id}`} role="tabpanel" aria-labelledby={`home-preview-tab-${tab.id}`} hidden={active !== index} tabIndex={0}>
          <div className={s.previewRail} aria-hidden="true">
            <Icon name="create" />
            {(tab.id === 'card' ? ['글자', '카드', '이미지'] : tab.id === 'board' ? ['카드', '주사위', '배치'] : ['역할', '단서', '단계']).map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <div className={s.previewCanvas}>
            <span className={s.canvasCaption}>{tab.caption}</span>
            {tab.id === 'card' && (
              <div className={s.exampleCard}>
                <small>나만의 사건 카드</small>
                <span className={s.clueIllustration} aria-hidden="true">
                  ?
                </span>
                <strong>
                  누가 마지막 편지를
                  <br />
                  남겼을까?
                </strong>
                <span>당신의 이야기를 채워 보세요.</span>
              </div>
            )}
            {tab.id === 'board' && (
              <svg className={s.exampleBoard} viewBox="0 0 280 225" role="img" aria-label="카드와 주사위를 배치한 게임판 예시">
                <rect x="6" y="15" width="268" height="196" rx="48" fill="#b9c8ac" />
                <rect x="16" y="25" width="248" height="176" rx="40" fill="#365945" />
                <rect x="27" y="36" width="226" height="154" rx="30" fill="none" stroke="#6d8870" strokeWidth="2" />
                <g transform="translate(50 63) rotate(-12 27 43)">
                  <rect width="54" height="86" rx="5" fill="#e7bf58" />
                  <rect x="6" y="6" width="42" height="74" rx="3" fill="none" stroke="#fff0b6" />
                  <path d="m27 24 12 19-12 19-12-19z" fill="#fff0b6" />
                </g>
                <g transform="translate(91 69) rotate(8 27 43)">
                  <rect width="54" height="86" rx="5" fill="#fffaf0" />
                  <path d="M17 26h20M17 34h15" stroke="#9aab8c" strokeWidth="3" />
                  <circle cx="27" cy="57" r="11" fill="#e8c465" />
                </g>
                <g transform="translate(179 65) rotate(12 24 24)">
                  <rect width="48" height="48" rx="9" fill="#fffaf0" />
                  {[
                    [12, 12],
                    [36, 12],
                    [24, 24],
                    [12, 36],
                    [36, 36]
                  ].map(([x, y]) => (
                    <circle key={`${x}-${y}`} cx={x} cy={y} r="3.7" fill="#365945" />
                  ))}
                </g>
                <circle cx="188" cy="153" r="16" fill="#e8c465" />
                <circle cx="218" cy="148" r="15" fill="#edeee2" />
                <path d="M168 129h72" stroke="#93a78c" strokeDasharray="3 5" />
              </svg>
            )}
            {tab.id === 'story' && (
              <div className={s.exampleFlow} aria-label="자료 읽기에서 조사와 결말로 이어지는 이야기 예시">
                <div>
                  <small>01 · 자료 읽기</small>
                  <strong>각자의 비밀을 만나고</strong>
                  <span>등장인물 · 역할 자료</span>
                </div>
                <span className={s.flowArrow} aria-hidden="true">
                  ↓
                </span>
                <div>
                  <small>02 · 조사와 대화</small>
                  <strong>서로의 단서를 연결해요</strong>
                  <span>조사 장소 · 발견할 단서</span>
                </div>
                <span className={s.flowArrow} aria-hidden="true">
                  ↓
                </span>
                <div className={s.flowEndings}>
                  <span>사건의 진실</span>
                  <span>남은 이야기</span>
                </div>
              </div>
            )}
          </div>
          <div className={s.previewProperties}>
            <span>{tab.property}</span>
            <strong>{tab.title}</strong>
            <div className={s.sampleLines} aria-hidden="true">
              <i />
              <i />
              <i />
            </div>
            <span>{tab.id === 'story' ? '연결된 자료' : '배경색'}</span>
            {tab.id === 'story' ? (
              <span className={s.linkedExample}>
                역할 자료
                <br />첫 번째 단서
              </span>
            ) : (
              <div className={s.swatches} aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function HomeLanding() {
  const scenarios = useQuery({ queryKey: ['scenarios', 'home', 6], queryFn: () => get<Page<Scenario>>('/scenarios?size=6') });
  return (
    <div className={s.home}>
      <section className={s.hero} aria-labelledby="home-title">
        <span className={s.eyebrow}>
          <i aria-hidden="true" /> 상상이 한 판의 게임이 되는 곳
        </span>
        <h1 id="home-title">
          나만의 게임을 만들고,
          <br />
          <span>함께 플레이하세요</span>
        </h1>
        <p>
          머더미스터리와 보드게임을 직접 만들고,
          <br className={s.mobileBreak} /> 마음에 드는 작품으로 함께 놀아요.
        </p>
        <div className={s.actions}>
          <Link className={s.createAction} to="/studio">
            <Icon name="create" />
            게임 만들기<span aria-hidden="true">↗</span>
          </Link>
          <Link className={s.playAction} to="/scenarios">
            <Icon name="explore" />
            플레이할 게임 찾기<span aria-hidden="true">→</span>
          </Link>
        </div>
        <span className={s.heroNote}>기본 틀로 가볍게 시작하거나, 빈 템플릿에 처음부터 담아 보세요.</span>
      </section>

      <section className={`${s.section} ${s.categorySection}`} aria-labelledby="category-title">
        <div className={s.sectionHeading}>
          <div>
            <span className={s.sectionEyebrow}>어떤 재미를 찾고 있나요?</span>
            <h2 id="category-title">오늘의 한 판, 여기서 골라요</h2>
          </div>
          <Link to="/scenarios">
            모든 게임 보기 <span aria-hidden="true">→</span>
          </Link>
        </div>
        <nav className={s.categories} aria-label="게임 종류별 탐색">
          {categories.map(({ type, description }) => (
            <Link key={type} to={`/scenarios?gameType=${type}`} className={s.category}>
              <div className={s.categoryArt}>
                <GameArt type={type} />
              </div>
              <strong>{gameTypeNames[type]}</strong>
              <span>{description}</span>
            </Link>
          ))}
        </nav>
      </section>

      <section className={s.section} aria-labelledby="public-games-title">
        <div className={s.sectionHeading}>
          <div>
            <span className={s.sectionEyebrow}>플레이로 만나는 새로운 이야기</span>
            <h2 id="public-games-title">지금 플레이할 수 있는 게임</h2>
          </div>
          <Link to="/scenarios">
            작품 더 보기 <span aria-hidden="true">→</span>
          </Link>
        </div>
        <QueryState query={scenarios}>
          {(data) =>
            data.items.length ? (
              <div className={s.games}>
                {data.items.map((scenario) => (
                  <ScenarioCard key={scenario.id} scenario={scenario} />
                ))}
              </div>
            ) : (
              <Empty>아직 공개된 작품이 없어요. 첫 이야기를 만들어 보세요.</Empty>
            )
          }
        </QueryState>
      </section>

      <section className={`${s.section} ${s.creation}`} aria-labelledby="creation-title">
        <div className={s.creationCopy}>
          <span className={s.sectionEyebrow}>내 아이디어로 만드는 게임</span>
          <h2 id="creation-title">
            처음 만드는 게임도,
            <br />
            차근차근 나답게.
          </h2>
          <p>카드의 앞뒷면을 꾸미고, 등장인물의 비밀과 이야기를 연결해 보세요. 요트와 고전 보드게임은 준비된 규칙 위에 디자인을 더할 수 있어요.</p>
          <ul>
            <li>여섯 게임 유형 · 기본 템플릿과 빈 템플릿</li>
            <li>카드·장면·이야기를 하나의 제작 공간에서</li>
            <li>혼자 또는 초대로 시험하고 공개 검수 요청</li>
          </ul>
          <Link className={s.inlineAction} to="/studio">
            나만의 게임 만들러 가기 <span aria-hidden="true">→</span>
          </Link>
          <small>정교한 제작은 PC에서, 확인과 간단한 수정은 모바일에서.</small>
        </div>
        <CreationPreview />
      </section>

      <section className={`${s.section} ${s.journeys}`} aria-label="만들기와 플레이 이용 안내">
        <article>
          <span className={s.journeyIcon}>
            <Icon name="create" />
          </span>
          <h2>아이디어가 있다면, 만들기</h2>
          <p>
            템플릿 선택 <span>→</span> 나만의 내용과 디자인 <span>→</span> 시험과 공개 검수
          </p>
          <Link to="/studio">
            제작 시작하기 <span aria-hidden="true">→</span>
          </Link>
        </article>
        <article>
          <span className={s.journeyIcon}>
            <Icon name="rooms" />
          </span>
          <h2>함께할 준비가 됐다면, 플레이</h2>
          <p>
            작품 선택 <span>→</span> 방 만들기 또는 참가 <span>→</span> 모두 준비하면 시작
          </p>
          <div>
            <Link to="/rooms">
              모집방 둘러보기 <span aria-hidden="true">→</span>
            </Link>
            <Link to="/match">
              자동 매칭 <span aria-hidden="true">→</span>
            </Link>
          </div>
        </article>
      </section>

      <section className={`${s.section} ${s.lastCall}`}>
        <span className={s.sectionEyebrow}>이제, 당신의 차례예요</span>
        <h2>
          오늘의 아이디어를
          <br className={s.mobileBreak} /> 한 판의 즐거움으로.
        </h2>
        <div className={s.actions}>
          <Link className={s.createAction} to="/studio">
            게임 만들기 <span aria-hidden="true">↗</span>
          </Link>
          <Link className={s.outlineAction} to="/scenarios">
            플레이할 게임 찾기 <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
