import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, List } from 'lucide-react';
import type { BlogPostSummary, TocHeading } from '../../content/types';

interface DesktopTocSidebarProps {
  headings: TocHeading[];
  activeId: string;
  progress: number;
  readingTime: number;
  relatedPosts: BlogPostSummary[];
}

export function DesktopTocSidebar({
  headings,
  activeId,
  progress,
  readingTime,
  relatedPosts,
}: DesktopTocSidebarProps) {
  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(null, '', `#${id}`);
  };

  return (
    <div className="space-y-6 px-4 py-7 text-[var(--text-secondary)]">
      {/* Reading Progress Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[0.74rem] text-[var(--text-muted)]">
          <span>Reading progress</span>
          <span className="tabular-nums font-medium text-[var(--text-primary)]">{progress}%</span>
        </div>
        <div className="h-[3px] w-full overflow-hidden rounded-full bg-[var(--border-hairline)]">
          <div
            className="h-full bg-[var(--accent)] transition-[width] duration-150 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="tabular-nums text-[0.72rem] text-[var(--text-muted)]">
          Est. {readingTime} min read
        </p>
      </div>

      {/* Sticky Table of Contents */}
      {headings.length > 0 && (
        <nav aria-label="Table of contents" className="border-t border-[var(--border-hairline)] pt-5">
          <h2 className="mb-3 text-[0.75rem] font-medium tracking-wide text-[var(--text-muted)]">
            On This Page
          </h2>
          <ul className="space-y-1.5 text-[0.8rem] leading-snug">
            {headings.map((heading) => {
              const isActive = heading.id === activeId;
              const indentClass =
                heading.level === 3
                  ? 'pl-3'
                  : heading.level === 4
                    ? 'pl-6'
                    : 'pl-0';

              return (
                <li key={heading.id} className={indentClass}>
                  <a
                    href={`#${heading.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToHeading(heading.id);
                    }}
                    aria-current={isActive ? 'location' : undefined}
                    className={`block rounded-[5px] px-2 py-1 transition-colors duration-150 ${
                      isActive
                        ? 'bg-[var(--accent-soft)] font-medium text-[var(--accent)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <span className="line-clamp-2">{heading.text}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      )}

      {/* Contextual Related Articles */}
      {relatedPosts.length > 0 && (
        <section
          aria-labelledby="toc-related-heading"
          className="border-t border-[var(--border-hairline)] pt-5"
        >
          <h2
            id="toc-related-heading"
            className="mb-3 text-[0.75rem] font-medium tracking-wide text-[var(--text-muted)]"
          >
            Related Reading
          </h2>
          <ul className="space-y-2.5">
            {relatedPosts.map((post) => (
              <li key={post.slug}>
                <Link
                  to={`/posts/${encodeURIComponent(post.slug)}`}
                  className="block text-[0.8rem] leading-snug text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]"
                >
                  <span className="line-clamp-2">{post.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export function MobileCollapsibleToc({
  headings,
  activeId,
}: {
  headings: TocHeading[];
  activeId: string;
}) {
  const [open, setOpen] = useState(false);

  if (headings.length === 0) return null;

  return (
    <div className="my-6 overflow-hidden rounded-[10px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] xl:hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-[0.84rem] font-medium text-[var(--text-primary)]"
      >
        <span className="flex items-center gap-2">
          <List className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
          <span>Table of Contents</span>
          <span className="tabular-nums text-xs font-normal text-[var(--text-muted)]">
            ({headings.length})
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 text-[var(--text-muted)] transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <nav
          aria-label="Mobile table of contents"
          className="border-t border-[var(--border-hairline)] px-4 py-3"
        >
          <ul className="space-y-1.5 text-[0.84rem]">
            {headings.map((heading) => {
              const isActive = heading.id === activeId;
              const indent =
                heading.level === 3 ? 'pl-3' : heading.level === 4 ? 'pl-6' : 'pl-0';
              return (
                <li key={heading.id} className={indent}>
                  <a
                    href={`#${heading.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setOpen(false);
                      const el = document.getElementById(heading.id);
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    className={`block py-1 transition-colors ${
                      isActive
                        ? 'font-medium text-[var(--accent)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {heading.text}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
}
