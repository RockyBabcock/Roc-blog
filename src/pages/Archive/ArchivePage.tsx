import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BlogShell } from '../../components/layout/BlogShell';
import { SecondaryNav } from '../../components/navigation/SecondaryNav';
import { ArticleListSkeleton, EmptyNotice, ErrorNotice } from '../../components/widgets/StateViews';
import { siteConfig } from '../../config/site.config';
import { buildArchiveGroups, formatDisplayDate } from '../../content/helpers';
import { useBlog } from '../../context/BlogContext';

export function ArchivePage() {
  const { posts, loading, error, refresh } = useBlog();

  useEffect(() => {
    document.title = `Archives — ${siteConfig.title}`;
  }, []);

  const archiveYears = useMemo(() => buildArchiveGroups(posts), [posts]);

  return (
    <BlogShell>
      <div className="animate-page-enter space-y-7">
        <header className="space-y-2.5">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h1 className="font-editorial text-[2rem] font-medium leading-[1.2] tracking-[-0.02em] text-[var(--text-primary)] sm:text-[2.3rem]">
              Archives
            </h1>
            <span className="tabular-nums text-[0.82rem] text-[var(--text-muted)]">
              {posts.length} {posts.length === 1 ? 'published article' : 'published articles'}
            </span>
          </div>
          <p className="max-w-2xl text-[0.94rem] leading-[1.7] text-[var(--text-secondary)]">
            Complete chronological ledger grouped automatically by publication year and month.
          </p>
        </header>

        <SecondaryNav />

        {loading && <ArticleListSkeleton />}
        {!loading && error && <ErrorNotice message={error} onRetry={() => void refresh()} />}

        {!loading && !error && archiveYears.length === 0 && (
          <EmptyNotice
            title="Archive is empty"
            description="Published articles will be organized chronologically here by year and month."
          />
        )}

        {!loading && !error && archiveYears.length > 0 && (
          <div className="space-y-10">
            {archiveYears.map((yearGroup) => (
              <section key={yearGroup.year} aria-labelledby={`archive-year-${yearGroup.year}`}>
                <div className="flex items-baseline justify-between border-b border-[var(--border-hairline)] pb-2.5">
                  <h2
                    id={`archive-year-${yearGroup.year}`}
                    className="font-editorial tabular-nums text-[1.6rem] font-medium text-[var(--text-primary)]"
                  >
                    {yearGroup.year}
                  </h2>
                  <span className="tabular-nums text-[0.78rem] text-[var(--text-muted)]">
                    {yearGroup.count} {yearGroup.count === 1 ? 'entry' : 'entries'}
                  </span>
                </div>

                <div className="mt-5 space-y-6">
                  {yearGroup.months.map((monthGroup) => (
                    <div key={`${yearGroup.year}-${monthGroup.monthKey}`}>
                      <h3 className="mb-2.5 text-[0.78rem] font-medium tracking-wide text-[var(--text-muted)]">
                        {monthGroup.monthLabel}
                      </h3>
                      <ul className="divide-y divide-[var(--border-hairline)]/70">
                        {monthGroup.posts.map((post) => (
                          <li key={post.slug} className="py-3">
                            <Link
                              to={`/posts/${encodeURIComponent(post.slug)}`}
                              className="group flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-5"
                            >
                              <div className="flex min-w-0 items-baseline gap-4">
                                <time
                                  dateTime={post.date}
                                  className="tabular-nums w-24 shrink-0 text-[0.78rem] text-[var(--text-muted)]"
                                >
                                  {formatDisplayDate(post.date)}
                                </time>
                                <span className="font-editorial text-[1.08rem] font-medium text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent)]">
                                  {post.title}
                                </span>
                              </div>
                              <div className="flex shrink-0 items-center gap-2 pl-0 text-[0.76rem] text-[var(--text-muted)] sm:pl-2">
                                {post.categories[0] && <span>{post.categories[0]}</span>}
                                <span aria-hidden="true">·</span>
                                <span className="tabular-nums">{post.readingTime} min</span>
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </BlogShell>
  );
}
