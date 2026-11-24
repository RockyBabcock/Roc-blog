import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { BlogShell } from '../../components/layout/BlogShell';
import { siteConfig } from '../../config/site.config';
import { useBlog } from '../../context/BlogContext';

interface NotFoundPageProps {
  title?: string;
  description?: string;
}

export function NotFoundPage({
  title = 'Page not found',
  description = 'The page or article slug you requested could not be found in this journal.',
}: NotFoundPageProps) {
  const { openSearch } = useBlog();

  useEffect(() => {
    document.title = `404 — ${siteConfig.title}`;
  }, []);

  return (
    <BlogShell>
      <div className="animate-page-enter mx-auto max-w-xl py-16 text-center">
        <p className="font-code tabular-nums text-xs tracking-widest text-[var(--accent)]">404</p>
        <h1 className="font-editorial mt-3 text-[2.1rem] font-medium leading-tight text-[var(--text-primary)] sm:text-[2.5rem]">
          {title}
        </h1>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-[var(--text-secondary)]">
          {description}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-[8px] bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[#FCFAF5] transition-colors hover:bg-[var(--accent-hover)]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Back to home</span>
          </Link>
          <button
            type="button"
            onClick={openSearch}
            className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--border-strong)]"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            <span>Search articles</span>
          </button>
        </div>
      </div>
    </BlogShell>
  );
}
