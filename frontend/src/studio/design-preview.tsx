import type { CSSProperties } from 'react';
import { classicColors, gameTypeNames, type Data, type Document } from './types';
import s from './design-preview.module.scss';

/** 색상 편집용 견본이며 플레이 상태·허용 행동·점수는 계산하지 않는다. */
export function DesignPreview({ document }: { document: Document }) {
  const classic = { ...classicColors, ...(document.classic as Data | undefined) };
  const yacht = { diceColor: '#fffaf0', pipColor: '#242a27', scoreboardColor: '#ffffff', ...(document.yacht as Data | undefined) };
  const size = document.gameType === 'GOMOKU' ? 15 : 8;
  const samplePieces: Record<number, number> = size === 15 ? { 112: 0, 113: 1, 128: 0, 129: 1, 144: 0 } : { 27: 0, 28: 1, 35: 1, 36: 0 };
  return (
    <section className={s.preview} aria-label="게임 디자인 미리보기">
      <header>
        <span>{gameTypeNames[document.gameType]}</span>
        <h2>{document.title || '나의 게임'}</h2>
        <p>디자인 미리보기 · 실제 판정은 시험에서 확인</p>
      </header>
      {document.gameType === 'YACHT' ? (
        <div className={s.yacht}>
          <div className={s.dice} aria-label="주사위 색상 견본">
            {[1, 2, 3, 4, 5].map((value) => (
              <div key={value} className={s.die} style={{ background: String(yacht.diceColor), color: String(yacht.pipColor) }}>
                <svg viewBox="0 0 60 60" aria-hidden="true">
                  {(value === 1
                    ? [[30, 30]]
                    : value === 2
                      ? [
                          [16, 16],
                          [44, 44]
                        ]
                      : value === 3
                        ? [
                            [16, 16],
                            [30, 30],
                            [44, 44]
                          ]
                        : value === 4
                          ? [
                              [16, 16],
                              [44, 16],
                              [16, 44],
                              [44, 44]
                            ]
                          : [
                              [16, 16],
                              [44, 16],
                              [30, 30],
                              [16, 44],
                              [44, 44]
                            ]
                  ).map(([x, y], i) => (
                    <circle key={i} cx={x} cy={y} r="5" fill="currentColor" />
                  ))}
                </svg>
                <span className={s.screenReader}>{value}의 눈</span>
              </div>
            ))}
          </div>
          <div className={s.scorePreview} style={{ '--score-color': String(yacht.scoreboardColor) } as CSSProperties}>
            <div className={s.scoreSwatch} />
            <h3>점수판</h3>
            {['숫자별 합계', '초이스', '풀하우스', '요트', '총점'].map((label) => (
              <div key={label}>
                <span>{label}</span>
                <span>—</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          className={s.board}
          style={{ gridTemplateColumns: `repeat(${size}, 1fr)`, background: String(classic.boardColor) }}
          role="img"
          aria-label={`${gameTypeNames[document.gameType]} 게임판과 말 색상 견본`}
        >
          {Array.from({ length: size * size }, (_, index) => (
            <div
              key={index}
              className={`${s.cell} ${size === 15 ? s.intersection : ''}`}
              style={{ backgroundColor: size === 15 ? undefined : String((index + Math.floor(index / size)) % 2 ? classic.darkSquareColor : classic.lightSquareColor) }}
            >
              {Object.hasOwn(samplePieces, index) && (
                <span className={s.piece} style={{ background: String(samplePieces[index] === 0 ? classic.firstPieceColor : classic.secondPieceColor) }}>
                  {document.gameType === 'CHECKERS' && index === 36 && <i />}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      <p className={s.note}>색상을 바꾸면 이 견본에 바로 반영됩니다.</p>
    </section>
  );
}
