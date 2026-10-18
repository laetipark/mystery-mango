import { useId } from 'react';
import { assetUrl, type CardDesign } from './types';
import p from './play.module.scss';

/** Render only the face supplied by the server. An explicitly empty design stays blank. */
export function CardFace({ design, context = {}, label = '카드 디자인' }: { design: CardDesign; context?: { gameId?: string; sandboxId?: string }; label?: string }) {
  const clip = useId().replaceAll(':', '');
  const description = design.nodes
    .filter((node) => node.kind === 'TEXT' && node.text)
    .map((node) => node.text)
    .join('\n');
  return (
    <svg
      className={p.cardFace}
      viewBox={`0 0 ${design.width} ${design.height}`}
      role="img"
      aria-label={label}
      aria-describedby={description ? `${clip}-description` : undefined}
      preserveAspectRatio="xMidYMid meet"
    >
      {description && <desc id={`${clip}-description`}>{description}</desc>}
      <defs>
        <clipPath id={clip}>
          <rect width={design.width} height={design.height} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect width={design.width} height={design.height} fill={design.background} />
        {design.nodes.map((node, index) => (
          <g key={index} transform={`translate(${node.x} ${node.y}) rotate(${node.rotation})`}>
            {node.kind === 'RECT' && <rect width={node.width} height={node.height} fill={node.fill ?? '#264d3e'} />}
            {node.kind === 'ELLIPSE' && <ellipse cx={node.width / 2} cy={node.height / 2} rx={node.width / 2} ry={node.height / 2} fill={node.fill ?? '#264d3e'} />}
            {node.kind === 'IMAGE' && node.assetId && <image href={assetUrl(node.assetId, context)} width={node.width} height={node.height} preserveAspectRatio="none" />}
            {node.kind === 'TEXT' && (
              <foreignObject width={node.width} height={node.height}>
                <div className={p.cardText} style={{ fontSize: node.fontSize ?? 24, color: node.fill ?? '#264d3e' }}>
                  {node.text}
                </div>
              </foreignObject>
            )}
          </g>
        ))}
      </g>
    </svg>
  );
}

export function CardVisual({
  design,
  name,
  text,
  assetId,
  context = {},
  label = '카드'
}: {
  design?: CardDesign;
  name?: string;
  text?: string;
  assetId?: string | null;
  context?: { gameId?: string; sandboxId?: string };
  label?: string;
}) {
  if (design !== undefined) return <CardFace design={design} context={context} label={label} />;
  return (
    <>
      {assetId && <img src={assetUrl(assetId, context)} alt="" draggable={false} />}
      <strong>{name ?? label}</strong>
      {text && <p>{text}</p>}
    </>
  );
}
