export function Icon({ name, size = 20 }: { name: 'explore' | 'rooms' | 'match' | 'create' | 'user'; size?: number }) {
  const paths = {
    explore: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m16 16 5 5M8 9h6M8 12h4" />
      </>
    ),
    rooms: (
      <>
        <path d="M3 21V7l9-4 9 4v14M3 11h18M8 21v-6h8v6" />
        <path d="M8 7h.01M16 7h.01" />
      </>
    ),
    match: (
      <>
        <path d="m13 2-9 12h7l-1 8 10-12h-7z" />
      </>
    ),
    create: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="4" />
        <path d="M12 7v10M7 12h10" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
      </>
    )
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}
