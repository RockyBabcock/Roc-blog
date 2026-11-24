import { Link, useLocation } from 'react-router-dom';
import {
  Archive,
  BookOpen,
  FolderOpen,
  Home,
  Info,
  Moon,
  Rss,
  Search,
  Sun,
  Tag,
  X,
} from 'lucide-react';
import { siteConfig } from '../../config/site.config';
import { useBlog } from '../../context/BlogContext';

interface LeftSidebarProps {
  onNavigate?: () => void;
  showCloseButton?: boolean;
}

export function LeftSidebar({ onNavigate, showCloseButton = false }: LeftSidebarProps) {
  const location = useLocation();
  const {
    posts,
    categories,
    theme,
    toggleTheme,
    openSearch,
    openRss,
  } = useBlog();

  const recentPosts = posts.slice(0, siteConfig.recentSidebarCount);

  const primaryNav = [
    { label: 'Home', to: '/', icon: Home, match: (p: string) => p === '/' },
    {
      label: 'Categories',
      to: '/categories',
      icon: FolderOpen,
      match: (p: string) => p === '/categories' || p.startsWith('/categories/'),
    },
    {
      label: 'Tags',
      to: '/tags',
      icon: Tag,
      match: (p: string) => p === '/tags' || p.startsWith('/tags/'),
    },
    { label: 'Archives', to: '/archives', icon: Archive, match: (p: string) => p === '/archives' },
    { label: 'About', to: '/about', icon: Info, match: (p: string) => p === '/about' },
  ];

  const decodedPath = (() => {
    try {
      return decodeURIComponent(location.pathname);
    } catch {
      return location.pathname;
    }
  })();

  return (
    <div className="flex h-full flex-col bg-[var(--bg-page)] px-5 py-5 text-[var(--text-primary)] lg:bg-transparent lg:px-4 lg:py-6">
      <div className="quiet-scroll flex-1 space-y-5 overflow-y-auto pr-0.5">
        {/* Brand Block */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              to="/"
              onClick={onNavigate}
              className="font-editorial block text-[1.22rem] font-semibold tracking-[0.04em] text-[var(--text-primary)] transition-colors duration-150 hover:text-[var(--accent)]"
            >
              {siteConfig.title}
            </Link>
            <p className="mt-1.5 text-[0.79rem] leading-relaxed text-[var(--text-secondary)]">
              {siteConfig.description}
            </p>
          </div>
          {showCloseButton && (
            <button
              type="button"
              onClick={onNavigate}
              aria-label="Close navigation drawer"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Search Trigger */}
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            openSearch();
          }}
          aria-label="Open article search"
          className="group flex w-full items-center justify-between rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-2 text-left text-[0.82rem] text-[var(--text-muted)] shadow-[var(--shadow-subtle)] transition-colors duration-150 hover:border-[var(--border-strong)] hover:text-[var(--text-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          <span className="flex items-center gap-2 truncate">
            <Search className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)] group-hover:text-[var(--accent)]" aria-hidden="true" />
            <span className="truncate">Search articles...</span>
          </span>
          <kbd className="font-code hidden shrink-0 rounded border border-[var(--border-hairline)] bg-[var(--bg-subtle)] px-1.5 py-0.5 text-[0.68rem] text-[var(--text-muted)] sm:inline-block">
            ⌘K
          </kbd>
        </button>

        {/* Primary Navigation */}
        <nav aria-label="Primary navigation" className="space-y-0.5">
          {primaryNav.map((item) => {
            const Icon = item.icon;
            const active = item.match(location.pathname);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-2.5 rounded-[7px] px-2.5 py-1.5 text-[0.85rem] transition-colors duration-150 ${
                  active
                    ? 'bg-[var(--bg-surface)] font-medium text-[var(--accent)] shadow-[var(--shadow-subtle)] ring-1 ring-[var(--border-hairline)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]/70 hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Five Canonical Categories */}
        <div className="border-t border-[var(--border-hairline)] pt-4">
          <div className="mb-2 flex items-center justify-between px-2.5">
            <h2 className="text-[0.74rem] font-medium tracking-wide text-[var(--text-muted)]">
              Categories
            </h2>
            <Link
              to="/categories"
              onClick={onNavigate}
              className="text-[0.72rem] text-[var(--text-muted)] transition-colors hover:text-[var(--accent)]"
            >
              All
            </Link>
          </div>
          <nav aria-label="Content categories" className="space-y-0.5">
            {categories.map((cat) => {
              const target = `/categories/${encodeURIComponent(cat.name)}`;
              const isActive = decodedPath === `/categories/${cat.name}`;
              return (
                <Link
                  key={cat.name}
                  to={target}
                  onClick={onNavigate}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center justify-between gap-2 rounded-[7px] px-2.5 py-1.5 text-[0.81rem] transition-colors duration-150 ${
                    isActive
                      ? 'bg-[var(--bg-surface)] font-medium text-[var(--accent)] ring-1 ring-[var(--border-hairline)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]/65 hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                  <span className="tabular-nums text-[0.72rem] text-[var(--text-muted)]">
                    {cat.count}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Recent Articles */}
        {recentPosts.length > 0 && (
          <div className="border-t border-[var(--border-hairline)] pt-4">
            <h2 className="mb-2 px-2.5 text-[0.74rem] font-medium tracking-wide text-[var(--text-muted)]">
              Recent Articles
            </h2>
            <ul className="space-y-0.5">
              {recentPosts.map((post) => {
                const isCurrent = location.pathname === `/posts/${post.slug}`;
                return (
                  <li key={post.slug}>
                    <Link
                      to={`/posts/${encodeURIComponent(post.slug)}`}
                      onClick={onNavigate}
                      className={`group flex items-start gap-2 rounded-[7px] px-2.5 py-1.5 text-[0.79rem] leading-snug transition-colors duration-150 ${
                        isCurrent
                          ? 'font-medium text-[var(--accent)]'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]/55 hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <BookOpen
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-60 transition-opacity group-hover:opacity-100"
                        aria-hidden="true"
                      />
                      <span className="line-clamp-2">{post.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Footer Controls & Shortcuts — always pinned at bottom */}
      <div className="mt-4 shrink-0 border-t border-[var(--border-hairline)] pt-3.5">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1">
            <Link
              to="/archives"
              onClick={onNavigate}
              aria-label="Archives"
              title="Archives"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
            >
              <Archive className="h-4 w-4" aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={() => {
                onNavigate?.();
                openRss();
              }}
              aria-label="RSS feed"
              title="RSS Feed"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
            >
              <Rss className="h-4 w-4" aria-hidden="true" />
            </button>
            <Link
              to="/about"
              onClick={onNavigate}
              aria-label="About this blog"
              title="About"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
            >
              <Info className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Dark</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
