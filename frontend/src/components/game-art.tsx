import type { GameType } from '~/studio/types';

/** 서비스에서 직접 그린 게임 유형별 표지. 작품의 비공개 자료는 사용하지 않는다. */
export function GameArt({ type = 'MURDER_MYSTERY' }: { type?: GameType }) {
  const board = ['GOMOKU', 'REVERSI', 'CHECKERS'].includes(type);
  return (
    <svg viewBox="0 0 400 180" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="400" height="180" fill={type === 'MURDER_MYSTERY' ? '#e5e5d7' : '#e6edde'} />
      <circle cx="350" cy="-40" r="145" fill="#d8e1ca" />
      <circle cx="30" cy="220" r="115" fill="#eedbb6" />
      {type === 'MURDER_MYSTERY' && (
        <g transform="translate(152 16) rotate(8 70 80)">
          <rect width="115" height="160" rx="6" fill="#fff9e8" stroke="#c7cbb6" />
          <path d="M18 27h80M18 113h80M18 126h63M18 139h42" stroke="#bdc3a9" strokeWidth="3" />
          <text x="40" y="96" fontFamily="Georgia, serif" fontSize="67" fill="#547051">
            ?
          </text>
          <circle cx="104" cy="127" r="28" fill="#e9b449" />
          <path d="m91 126 9 9 17-22" stroke="#fff9e8" strokeWidth="5" fill="none" />
        </g>
      )}
      {board && (
        <g transform="translate(125 14)">
          <rect x="-7" y="-7" width="166" height="166" rx="8" fill="#49684e" />
          {Array.from({ length: 64 }, (_, i) => (
            <rect
              key={i}
              x={(i % 8) * 19}
              y={Math.floor(i / 8) * 19}
              width="19"
              height="19"
              fill={type === 'GOMOKU' ? '#e6c28a' : (i + Math.floor(i / 8)) % 2 ? '#547657' : '#e7e8cf'}
              stroke={type === 'GOMOKU' ? '#b59362' : 'none'}
              strokeWidth=".5"
            />
          ))}
          {[
            [3, 3],
            [4, 3],
            [3, 4],
            [4, 4],
            [5, 4],
            [2, 3]
          ].map(([x, y], i) => (
            <circle key={i} cx={x * 19 + 9.5} cy={y * 19 + 9.5} r="8" fill={i % 2 ? '#fff9e9' : '#253e33'} stroke="#a8b095" />
          ))}
        </g>
      )}
      {type === 'YACHT' && (
        <g>
          {[
            [118, 36],
            [171, 65],
            [224, 31]
          ].map(([x, y], i) => (
            <g key={i} transform={`translate(${x} ${y}) rotate(${i * 10 - 12} 29 29)`}>
              <rect width="62" height="62" rx="12" fill={i === 1 ? '#355842' : '#fff9e8'} stroke="#bdc8ac" />
              {[
                [16, 16],
                [46, 46],
                ...(i
                  ? [
                      [16, 46],
                      [46, 16]
                    ]
                  : [])
              ].map(([cx, cy], j) => (
                <circle key={j} cx={cx} cy={cy} r="4" fill={i === 1 ? '#fff9e8' : '#355842'} />
              ))}
            </g>
          ))}
          <path d="M118 147h166" stroke="#c4cbaa" strokeWidth="4" strokeLinecap="round" />
        </g>
      )}
      {type === 'TABLETOP' && (
        <g>
          <rect x="85" y="30" width="242" height="127" rx="52" fill="#355943" />
          <rect x="96" y="41" width="220" height="105" rx="44" fill="none" stroke="#789773" />
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(${127 + i * 23} ${48 + i * 5}) rotate(${i * 10 - 15} 24 35)`}>
              <rect width="48" height="70" rx="5" fill="#fff8e5" stroke="#c0c7ad" />
              <path d="m24 20 11 15-11 15-11-15z" fill={i === 1 ? '#e9b449' : '#355943'} />
            </g>
          ))}
          <circle cx="260" cy="77" r="14" fill="#efbd58" />
          <circle cx="277" cy="110" r="14" fill="#afc69b" />
        </g>
      )}
    </svg>
  );
}
