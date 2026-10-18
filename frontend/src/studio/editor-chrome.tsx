export type EditorIconName = 'back' | 'undo' | 'redo' | 'save' | 'check' | 'preview' | 'play' | 'publish' | 'board' | 'scene' | 'cards' | 'info' | 'rules' | 'assets';

export function EditorIcon({ name }: { name: EditorIconName }) {
  const paths = {
    back: <path d="m14 6-6 6 6 6M8 12h12" />,
    undo: <path d="M8 5 3 10l5 5M3 10h10a6 6 0 0 1 0 12" transform="translate(2 -2)" />,
    redo: <path d="m16 5 5 5-5 5m5-5H11a6 6 0 0 0 0 12" transform="translate(-2 -2)" />,
    save: (
      <>
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12l4 4v12a2 2 0 0 1-2 2Z" />
        <path d="M7 3v6h10V3M7 21v-8h10v8" />
      </>
    ),
    check: (
      <>
        <path d="m8 12 3 3 5-6" />
        <circle cx="12" cy="12" r="9" />
      </>
    ),
    preview: (
      <>
        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    play: <path d="m8 4 12 8-12 8Z" />,
    publish: (
      <>
        <path d="M4 15v5h16v-5M12 16V3m-5 5 5-5 5 5" />
      </>
    ),
    board: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M3 9h18M9 9v12" />
      </>
    ),
    scene: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <circle cx="8" cy="8" r="1.5" />
        <path d="m3 17 6-6 4 4 3-3 5 5" />
      </>
    ),
    cards: (
      <>
        <rect x="7" y="3" width="13" height="17" rx="2" />
        <path d="M4 6H3v15h13v-1M11 9h5M11 13h4" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v6M12 7h.01" />
      </>
    ),
    rules: (
      <>
        <path d="M4 4h16v17l-4-2-4 2-4-2-4 2ZM8 8h8M8 12h8M8 16h4" />
      </>
    ),
    assets: (
      <>
        <path d="M3 7V4h6l2 3h10v13H3ZM7 11h10M7 15h6" />
      </>
    )
  };
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}
