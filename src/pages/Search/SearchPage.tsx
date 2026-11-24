import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Loader2, Search } from 'lucide-react';
import { BlogShell } from '../../components/layout/BlogShell';
import { HighlightedText } from '../../components/search/HighlightedText';
import { EmptyNotice } from '../../components/widgets/StateViews';
import { siteConfig } from '../../config/site.config';
import { formatDisplayDate } from '../../content/helpers';
import type { SearchResultItem } from '../../content/types';
import { useBlog } from '../../context/BlogContext';

const SUGGESTED_QUERIES = ['agent', 'deterministic', 'markdown', 'quantization', 'typography'];

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [searching, setSearching] = useState(false);

  const { searchDetailed } = useBlog();

  useEffect(() => {
    document.title = query.trim()
      ? `Search: ${query.trim()} — ${siteConfig.title}`
      : `Search — ${siteConfig.title}`;
  }, [query]);

  useEffect(() => {
    const paramQuery = searchParams.get('q') ?? '';
    if (paramQuery !== query) {
      setQuery(paramQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    const trimmed = query.trim();

    if (!trimmed) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = window.setTimeout(async () => {
      try {
        const hits = await searchDetailed(trimmed);
        if (!cancelled) {
          setResults(hits);
        }
      } finally {
        if (!cancelled) {
          setSearching(false);
        }
      }
    }, 100);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, searchDetailed]);

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (value.trim()) {
      setSearchParams({ q: value }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const trimmed = query.trim();

  return (
    <BlogShell>
      <div className="animate-page-enter space-y-7">
        <header className="space-y-2.5">
          <h1 className="font-editorial text-[2rem] font-medium leading-[1.2] tracking-[-0.02em] text-[var(--text-primary)] sm:text-[2.3rem]">
            Search
          </h1>
          <p className="max-w-2xl text-[0.94rem] leading-[1.7] text-[var(--text-secondary)]">
            Search across article titles, descriptions, categories, tags, and full Markdown prose.
          </p>
        </header>

        {/* Search Input Box */}
        <div className="flex items-center gap-3 rounded-[10px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-3 shadow-[var(--shadow-subtle)] focus-within:border-[var(--accent)]">
          {searching ? (
            <Loader2 className="h-4.5 w-4.5 shrink-0 animate-spin text-[var(--accent)]" aria-hidden="true" />
          ) : (
            <Search className="h-4.5 w-4.5 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
          )}
          <label htmlFor="full-search-page-input" className="sr-only">
            Search articles
          </label>
          <input
            id="full-search-page-input"
            type="search"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Type keywords to search articles..."
            autoFocus
            className="min-w-0 flex-1 bg-transparent text-[0.95rem] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => handleInputChange('')}
              className="text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
            >
              Clear
            </button>
          )}
        </div>

        {/* Suggested keywords when empty */}
        {!trimmed && (
          <div className="space-y-3">
            <p className="text-[0.8rem] text-[var(--text-muted)]">Try searching for:</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-[0.88rem]">
              {SUGGESTED_QUERIES.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => handleInputChange(term)}
                  className="text-[var(--accent)] underline decoration-[var(--border-strong)] underline-offset-4 transition-colors hover:text-[var(--accent-hover)]"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {trimmed && !searching && results.length === 0 && (
          <EmptyNotice
            title={`No results for "${trimmed}"`}
            description="No articles matched your query. Check spelling or try broader terms like architecture, agents, or markdown."
          />
        )}

        {trimmed && results.length > 0 && (
          <div className="space-y-4">
            <p className="tabular-nums text-[0.8rem] text-[var(--text-muted)]">
              Found {results.length} matching {results.length === 1 ? 'article' : 'articles'}
            </p>
            <div className="divide-y divide-[var(--border-hairline)] border-t border-[var(--border-hairline)]">
              {results.map((item) => (
                <article key={item.post.slug} className="group py-6">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.77rem] text-[var(--text-muted)]">
                    {item.post.categories[0] && (
                      <>
                        <span className="font-medium text-[var(--accent)]">
                          {item.post.categories[0]}
                        </span>
                        <span aria-hidden="true">·</span>
                      </>
                    )}
                    <time dateTime={item.post.date} className="tabular-nums">
                      {formatDisplayDate(item.post.date)}
                    </time>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{item.post.readingTime} min read</span>
                    <span aria-hidden="true">·</span>
                    <span>Matched in {item.matchedFields.join(', ')}</span>
                  </div>

                  <h2 className="font-editorial mt-2 text-[1.32rem] font-medium leading-snug text-[var(--text-primary)]">
                    <Link
                      to={`/posts/${encodeURIComponent(item.post.slug)}`}
                      className="transition-colors group-hover:text-[var(--accent)]"
                    >
                      <HighlightedText text={item.post.title} query={trimmed} />
                    </Link>
                  </h2>

                  <p className="mt-2 text-[0.9rem] leading-relaxed text-[var(--text-secondary)]">
                    <HighlightedText text={item.snippet} query={trimmed} />
                  </p>

                  <Link
                    to={`/posts/${encodeURIComponent(item.post.slug)}`}
                    className="mt-3 inline-flex items-center gap-1 text-[0.8rem] font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]"
                  >
                    <span>Open article</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </BlogShell>
  );
}
