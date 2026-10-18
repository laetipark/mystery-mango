import { useState } from 'react';
import { classicColors, gameTypeNames, type ClassicGameType, type ClassicState, type SendAction } from './types';
import s from './play.module.scss';

const endings: Record<string, string> = {
  FIVE_IN_ROW: '다섯 돌을 이어 승리했습니다.',
  BOARD_FULL: '게임판이 모두 채워졌습니다.',
  NO_LEGAL_MOVES: '더 움직일 수 있는 말이 없습니다.',
  NO_PIECES: '상대 말이 모두 잡혔습니다.',
  REPETITION: '같은 배치가 반복되어 무승부입니다.',
  NO_PROGRESS: '진행 없는 차례가 이어져 무승부입니다.',
  RESIGNATION: '상대 참가자가 기권했습니다.',
  ABORTED: '게임이 중단되었습니다.'
};

export function ClassicBoard({
  gameType,
  state,
  seat,
  send,
  pending,
  names = {}
}: {
  gameType: ClassicGameType;
  state: ClassicState;
  seat: number;
  send: SendAction;
  pending: boolean;
  names?: Record<number, string>;
}) {
  const [zoomed, setZoomed] = useState(false);
  const [selection, setSelection] = useState<{ row: number; col: number } | null>(null);
  const ownTurn = !pending && !state.finished && seat === state.turnSeat;
  const checker = gameType === 'CHECKERS';
  const selected = state.forcedFrom ?? (state.legalMoves.some((m) => m.fromRow === selection?.row && m.fromCol === selection?.col) ? selection : null);
  const colors = { ...classicColors, ...state.appearance };
  const name = (n: number) => names[n] ?? `${n + 1}번 자리`;
  async function play(row: number, col: number) {
    if (!checker) await send('PLACE', { row, col });
    else if (selected && state.legalMoves.some((m) => m.fromRow === selected.row && m.fromCol === selected.col && m.row === row && m.col === col)) {
      await send('MOVE', { fromRow: selected.row, fromCol: selected.col, toRow: row, toCol: col });
      setSelection(null);
    } else setSelection({ row, col });
  }
  return (
    <section className={s.panel}>
      <span className={s.eyebrow}>{gameTypeNames[gameType]} · 한 수씩 함께</span>
      <h2>{state.finished ? '게임 종료' : `${name(state.turnSeat)}의 차례`}</h2>
      {state.finished && (
        <p role="status">
          {state.draw ? '무승부' : state.winners.length ? `우승: ${state.winners.map(name).join(', ')}` : '승자를 정하지 않고 종료했습니다.'} {state.endReason ? endings[state.endReason] : ''}
        </p>
      )}
      <p>
        {state.forcedFrom
          ? '선택된 말로 이어서 잡아야 합니다. 표시된 목적지를 선택하세요.'
          : checker
            ? '움직일 말을 선택한 뒤 표시된 목적지를 선택하세요. 왕관은 킹입니다.'
            : gameType === 'GOMOKU'
              ? '빈 교차점을 선택해 돌을 놓으세요.'
              : '테두리로 표시된 칸을 선택하면 돌을 놓습니다.'}
      </p>
      <div className={s.row}>
        {[0, 1].map((n) => (
          <span key={n} className={s.classicLegend}>
            <i style={{ background: n === 0 ? colors.firstPieceColor : colors.secondPieceColor }} />
            {name(n)}
            {n === seat ? ' (나)' : ''} · {state.counts[n]}개{!state.activeSeats.includes(n) ? ' · 기권' : ''}
          </span>
        ))}
      </div>
      <div className={s.sectionHeader} style={{ marginTop: '1rem' }}>
        <span className={s.muted}>작은 칸은 확대해서 선택할 수 있어요.</span>
        <div className={s.row} role="group" aria-label="게임판 보기 크기">
          <button aria-pressed={!zoomed} onClick={() => setZoomed(false)}>
            전체 보기
          </button>
          <button aria-pressed={zoomed} onClick={() => setZoomed(true)}>
            크게 보기
          </button>
        </div>
      </div>
      <div className={s.classicViewport} role="region" tabIndex={0} aria-label="게임판 확대 영역">
        <div
          className={s.classicBoard}
          role="group"
          aria-label={`${gameTypeNames[gameType]} 게임판`}
          style={{ gridTemplateColumns: `repeat(${state.board.length}, minmax(0, 1fr))`, background: colors.boardColor, minWidth: zoomed ? state.board.length * 44 + 12 : undefined }}
        >
          {state.board.flatMap((line, row) =>
            line.map((cell, col) => {
              const destination = state.legalMoves.some((m) => m.row === row && m.col === col && (!checker || (selected && m.fromRow === selected.row && m.fromCol === selected.col)));
              const source = checker && state.legalMoves.some((m) => m.fromRow === row && m.fromCol === col);
              const chosen = selected?.row === row && selected.col === col;
              const pieceName = cell ? `${name(cell === 1 || cell === 3 ? 0 : 1)} ${cell >= 3 ? '킹' : '말'}` : '빈칸';
              return (
                <button
                  key={`${row}-${col}`}
                  type="button"
                  aria-label={`${row + 1}행 ${col + 1}열, ${pieceName}`}
                  aria-pressed={checker ? chosen : undefined}
                  disabled={!ownTurn || (!destination && !source)}
                  className={`${s.classicCell} ${gameType === 'GOMOKU' ? s.gomokuCell : ''}`}
                  style={{
                    backgroundColor: gameType === 'GOMOKU' ? colors.boardColor : (row + col) % 2 ? colors.darkSquareColor : colors.lightSquareColor,
                    outline: chosen ? '3px solid #e5a127' : ownTurn && destination && gameType !== 'GOMOKU' ? '2px solid #b77e13' : undefined,
                    outlineOffset: '-3px'
                  }}
                  onClick={() => void play(row, col)}
                >
                  {cell ? (
                    <span className={s.classicPiece} style={{ background: cell === 1 || cell === 3 ? colors.firstPieceColor : colors.secondPieceColor }}>
                      {cell >= 3 ? <span className={s.crown}>♛</span> : null}
                    </span>
                  ) : ownTurn && destination && gameType !== 'GOMOKU' ? (
                    <span className={s.classicDot} />
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
