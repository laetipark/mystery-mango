import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CardVisual } from './card-face';
import type { CardDesign } from './types';

describe('현재 카드 면 표시', () => {
  const empty: CardDesign = { width: 120, height: 170, background: '#fffaf0', nodes: [] };

  it('지정한 빈 디자인에는 이전 문구와 이미지를 겹쳐 표시하지 않는다', () => {
    const result = renderToStaticMarkup(createElement(CardVisual, { design: empty, name: '이전 제목', text: '이전 내용', assetId: 'legacy-file' }));
    expect(result).toContain('<svg');
    expect(result).not.toContain('이전 제목');
    expect(result).not.toContain('이전 내용');
    expect(result).not.toContain('legacy-file');
  });

  it('서버가 준 면의 문구와 현재 플레이의 파일 주소를 표시한다', () => {
    const design: CardDesign = {
      ...empty,
      nodes: [
        { kind: 'TEXT', x: 10, y: 10, width: 100, height: 40, rotation: 0, text: '현재 보이는 면', fontSize: 18, fill: '#123456' },
        { kind: 'IMAGE', x: 10, y: 60, width: 100, height: 100, rotation: 15, assetId: 'visible-file' }
      ]
    };
    const result = renderToStaticMarkup(createElement(CardVisual, { design, text: '이전 내용', context: { gameId: 'current-game' } }));
    expect(result).toContain('현재 보이는 면');
    expect(result).toContain('/api/v1/assets/visible-file?gameId=current-game');
    expect(result).not.toContain('이전 내용');
  });

  it('디자인이 없는 기존 카드의 문구와 이미지 표시는 유지한다', () => {
    const result = renderToStaticMarkup(createElement(CardVisual, { name: '원래 카드', text: '원래 내용', assetId: 'old-file', context: { sandboxId: 'test-session' } }));
    expect(result).toContain('원래 카드');
    expect(result).toContain('원래 내용');
    expect(result).toContain('/api/v1/assets/old-file?sandboxId=test-session');
  });
});
