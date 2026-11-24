import { Link } from 'react-router-dom';
import { Menu, Moon, Search, Sun } from 'lucide-react';
import { siteConfig } from '../../config/site.config';
import { useBlog } from '../../context/BlogContext';

export function MobileHeader() {
  const { theme, toggleTheme, openSearch, openMobileDrawer } = useBlog();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--border-hairline)] bg-[var(--bg-page)]/95 px-3 backdrop-blur-sm lg:hidden">
      <button
        type="button"
        onClick={openMobileDrawer}
        aria-label="Open navigation menu"
        className="inline-flex h-11 w-11 items-center justify-center rounded-md text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-subtle)]"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      <Link
        to="/"
        className="font-editorial truncate px-2 text-[1.06rem] font-semibold tracking-[0.04em] text-[var(--text-primary)] whitespace-nowrap"
      >
        {siteConfig.title}
      </Link>

      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={openSearch}
          aria-label="Search articles"
          className="inline-flex h-11 w-11 items-center justify-center rounded-md text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-subtle)]"
        >
          <Search className="h-4.5 w-4.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          className="inline-flex h-11 w-11 items-center justify-center rounded-md text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-subtle)]"
        >
          {theme === 'dark' ? (
            <Sun className="h-4.5 w-4.5" aria-hidden="true" />
          ) : (
            <Moon className="h-4.5 w-4.5" aria-hidden="true" />
          )}
        </button>
      </div>
    </header>
  );
}
