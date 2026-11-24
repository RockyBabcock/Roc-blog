import { Link, useLocation } from 'react-router-dom';

const SECONDARY_LINKS = [
  { label: 'Recently Published', to: '/', match: (path: string) => path === '/' },
  {
    label: 'Categories',
    to: '/categories',
    match: (path: string) => path === '/categories' || path.startsWith('/categories/'),
  },
  {
    label: 'Tags',
    to: '/tags',
    match: (path: string) => path === '/tags' || path.startsWith('/tags/'),
  },
  { label: 'Archive', to: '/archives', match: (path: string) => path === '/archives' },
];

export function SecondaryNav() {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Section navigation"
      className="no-scrollbar flex items-center gap-4 overflow-x-auto border-b border-[var(--border-hairline)] sm:gap-6"
    >
      {SECONDARY_LINKS.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.to}
            to={item.to}
            aria-current={active ? 'page' : undefined}
            className={`relative shrink-0 whitespace-nowrap pb-3 text-[0.83rem] transition-colors duration-150 sm:text-[0.87rem] ${
              active
                ? 'font-medium text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {item.label}
            {active && (
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-[2px] bg-[var(--accent)]"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
