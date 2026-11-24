import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CornerDownLeft, Loader2, Search, X } from 'lucide-react';
import { formatDisplayDate } from '../../content/helpers';
import type { SearchResultItem } from '../../content/types';
import { useBlog } from '../../context/BlogContext';
import { HighlightedText } from './HighlightedText';

export function SearchDialog() {
  const navigate = useNavigate();
  const { isSearchOpen, closeSearch, searchDetailed, posts } = useBlog();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isSearchOpen) return;
    setActiveIndex(0);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 20);

    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = prevOverflow;
    };
  }, [isSearchOpen]);

  useEffect(() => {
    if (!isSearchOpen) return;
    let cancelled = false;
    const trimmed = query.trim();

    if (!trimmed) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const debounce = window.setTimeout(async () => {
      try {
        const hits = await searchDetailed(trimmed);
        if (!cancelled) {
          setResults(hits);
          setActiveIndex(0);
        }
      } finally {
        if (!cancelled) {
          setSearching(false);
        }
      }
    }, 110);

    return () => {
      cancelled = true;
      window.clearTimeout(debounce);
    };
  }, [query, isSearchOpen, searchDetailed]);

  if (!isSearchOpen) return null;

  const trimmedQuery = query.trim();
  const displayedItems = trimmedQuery
    ? results.map((item) => ({
        slug: item.post.slug,
        title: item.post.title,
        category: item.post.categories[0] ?? 'Journal',
        date: item.post.date,
        readingTime: item.post.readingTime,
        snippet: item.snippet,
      }))
    : posts.slice(0, 5).map((post) => ({
        slug: post.slug,
        title: post.title,
        category: post.categories[0] ?? 'Journal',
        date: post.date,
        readingTime: post.readingTime,
        snippet: post.description,
      }));

  const goToPost = (slug: string) => {
    closeSearch();
    navigate(`/posts/${encodeURIComponent(slug)}`);
  };

  const goToFullSearch = () => {
    closeSearch();
    navigate(trimmedQuery ? `/search?q=${encodeURIComponent(trimmedQuery)}` : '/search');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeSearch();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (displayedItems.length > 0) {
        setActiveIndex((prev) => (prev + 1) % displayedItems.length);
      }
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (displayedItems.length > 0) {
        setActiveIndex((prev) => (prev - 1 + displayedItems.length) % displayedItems.length);
      }
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const selected = displayedItems[activeIndex];
      if (selected) {
        goToPost(selected.slug);
      } else if (trimmedQuery) {
        goToFullSearch();
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search articles"
      className="animate-backdrop-fade fixed inset-0 z-50 flex items-start justify-center bg-black/45 p-0 backdrop-blur-[2px] sm:p-6 sm:pt-[10vh]"
      onClick={closeSearch}
    >
      <div
        className="animate-dialog-enter flex h-full w-full flex-col overflow-hidden bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-elevated)] sm:h-auto sm:max-h-[76vh] sm:max-w-2xl sm:rounded-[12px] sm:border sm:border-[var(--border-hairline)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Header */}
        <div className="flex items-center gap-3 border-b border-[var(--border-hairline)] px-4 py-3.5 sm:px-5">
          {searching ? (
            <Loader2 className="h-4.5 w-4.5 shrink-0 animate-spin text-[var(--accent)]" aria-hidden="true" />
          ) : (
            <Search className="h-4.5 w-4.5 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
          )}
          <label htmlFor="blog-search-dialog-input" className="sr-only">
            Search articles by title, category, tag, or body text
          </label>
          <input
            ref={inputRef}
            id="blog-search-dialog-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search titles, tags, categories, or article content..."
            className="min-w-0 flex-1 bg-transparent text-[0.95rem] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              aria-label="Clear search query"
              className="rounded px-2 py-1 text-xs text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={closeSearch}
            aria-label="Close search dialog"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
          >
            <X className="h-4.5 w-4.5" aria-hidden="true" />
          </button>
        </div>

        {/* Results Body */}
        <div className="quiet-scroll flex-1 overflow-y-auto px-3 py-3 sm:px-4">
          <div className="mb-2 flex items-center justify-between px-2 text-[0.74rem] text-[var(--text-muted)]">
            <span>
              {trimmedQuery
                ? `${results.length} ${results.length === 1 ? 'result' : 'results'} for "${trimmedQuery}"`
                : 'Recent articles'}
            </span>
            {trimmedQuery && (
              <button
                type="button"
                onClick={goToFullSearch}
                className="inline-flex items-center gap-1 text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
              >
                <span>Open full search page</span>
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </button>
            )}
          </div>

          {trimmedQuery && !searching && displayedItems.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="font-editorial text-lg text-[var(--text-primary)]">
                No matching articles found
              </p>
              <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
                Try another keyword, category name, or tag such as &ldquo;agent&rdquo;, &ldquo;rust&rdquo;, or &ldquo;markdown&rdquo;.
              </p>
            </div>
          ) : (
            <ul role="listbox" aria-label="Search results" className="space-y-1">
              {displayedItems.map((item, idx) => {
                const isSelected = idx === activeIndex;
                return (
                  <li key={item.slug} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => goToPost(item.slug)}
                      className={`w-full rounded-[8px] px-3 py-3 text-left transition-colors duration-150 ${
                        isSelected
                          ? 'bg-[var(--bg-subtle)] text-[var(--text-primary)]'
                          : 'hover:bg-[var(--bg-subtle)]/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-editorial text-[1.03rem] font-medium leading-snug text-[var(--text-primary)]">
                          <HighlightedText text={item.title} query={trimmedQuery} />
                        </span>
                        {isSelected && (
                          <CornerDownLeft
                            className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-[0.82rem] leading-relaxed text-[var(--text-secondary)]">
                        <HighlightedText text={item.snippet} query={trimmedQuery} />
                      </p>
                      <div className="mt-1.5 flex items-center gap-2 text-[0.72rem] text-[var(--text-muted)]">
                        <span>{item.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{formatDisplayDate(item.date)}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{item.readingTime} min read</span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Keyboard Navigation Hints Footer */}
        <div className="hidden items-center justify-between border-t border-[var(--border-hairline)] bg-[var(--bg-page)]/60 px-5 py-2.5 text-[0.72rem] text-[var(--text-muted)] sm:flex">
          <div className="flex items-center gap-4">
            <span>↑↓ Navigate</span>
            <span>↵ Open article</span>
            <span>Esc Close</span>
          </div>
          <button
            type="button"
            onClick={goToFullSearch}
            className="transition-colors hover:text-[var(--accent)]"
          >
            Advanced search
          </button>
        </div>
      </div>
    </div>
  );
}
