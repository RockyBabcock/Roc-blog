import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BlogShell } from '../../components/layout/BlogShell';
import { ArticleListItem } from '../../components/listing/ArticleListItem';
import { FeaturedArticleCard } from '../../components/listing/FeaturedArticleCard';
import { SecondaryNav } from '../../components/navigation/SecondaryNav';
import { ArticleListSkeleton, EmptyNotice, ErrorNotice } from '../../components/widgets/StateViews';
import { siteConfig } from '../../config/site.config';
import { useBlog } from '../../context/BlogContext';
import { useScrollReveal } from '../../hooks/useScrollReveal';

export function HomePage() {
  const { posts, categories, loading, error, refresh } = useBlog();
  const [visibleCount, setVisibleCount] = useState<number>(siteConfig.postsPerPage);
  const { ref: listRef, revealed: listRevealed } = useScrollReveal<HTMLElement>(true);

  useEffect(() => {
    document.title = `${siteConfig.title} — ${siteConfig.tagline}`;
  }, []);

  const { featuredPost, regularPosts } = useMemo(() => {
    const pinned = posts.find((post) => post.pinned) ?? null;
    const rest = pinned ? posts.filter((post) => post.slug !== pinned.slug) : posts;
    return { featuredPost: pinned, regularPosts: rest };
  }, [posts]);

  const visiblePosts = regularPosts.slice(0, visibleCount);
  const hasMore = visibleCount < regularPosts.length;

  return (
    <BlogShell>
      <div className="animate-page-enter space-y-7">
        {/* Editorial Header */}
        <header className="space-y-2.5">
          <h1 className="font-editorial text-[2rem] font-medium leading-[1.18] tracking-[-0.02em] text-[var(--text-primary)] [text-wrap:balance] sm:text-[2.35rem]">
            {siteConfig.tagline}
          </h1>
          <p className="max-w-2xl text-[0.94rem] leading-[1.7] text-[var(--text-secondary)]">
            {siteConfig.description}
          </p>
        </header>

        {/* Mobile Horizontal Category Rail */}
        <nav
          aria-label="Categories quick filter"
          className="no-scrollbar -mx-5 flex items-center gap-2 overflow-x-auto px-5 lg:hidden"
        >
          {categories.map((cat) => (
            <Link
              key={cat.name}
              to={`/categories/${encodeURIComponent(cat.name)}`}
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[7px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1.5 text-[0.78rem] text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--accent)]"
            >
              <span>{cat.name}</span>
              <span className="tabular-nums text-[0.7rem] text-[var(--text-muted)]">
                {cat.count}
              </span>
            </Link>
          ))}
        </nav>

        {/* Secondary Navigation */}
        <SecondaryNav />

        {loading && <ArticleListSkeleton />}

        {!loading && error && <ErrorNotice message={error} onRetry={() => void refresh()} />}

        {!loading && !error && posts.length === 0 && (
          <EmptyNotice
            title="No articles published yet"
            description="Add a Markdown file with draft: false to the configured content directory and sync to publish your first article."
          />
        )}

        {!loading && !error && posts.length > 0 && (
          <div className="space-y-9">
            {/* Featured / Pinned Article */}
            {featuredPost && (
              <section aria-label="Pinned article">
                <FeaturedArticleCard post={featuredPost} />
              </section>
            )}

            {/* Recent Articles List */}
            {regularPosts.length > 0 && (
              <section
                ref={listRef}
                data-revealed={listRevealed}
                aria-labelledby="recent-articles-heading"
                className="reveal-section"
              >
                <div className="mb-2 flex items-baseline justify-between border-b border-[var(--border-hairline)] pb-2.5">
                  <h2
                    id="recent-articles-heading"
                    className="text-[0.8rem] font-medium tracking-wide text-[var(--text-muted)]"
                  >
                    Latest Writing
                  </h2>
                  <span className="tabular-nums text-[0.76rem] text-[var(--text-muted)]">
                    Showing {visiblePosts.length} of {regularPosts.length}
                  </span>
                </div>

                <div>
                  {visiblePosts.map((post) => (
                    <ArticleListItem key={post.slug} post={post} />
                  ))}
                </div>

                {hasMore && (
                  <div className="mt-8 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((prev) => prev + siteConfig.postsPerPage)}
                      className="rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-5 py-2.5 text-[0.84rem] font-medium text-[var(--text-primary)] shadow-[var(--shadow-subtle)] transition-colors duration-150 hover:border-[var(--border-strong)] hover:text-[var(--accent)]"
                    >
                      Load more articles
                    </button>
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </BlogShell>
  );
}
