import { useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BlogShell } from '../../components/layout/BlogShell';
import { ArticleListItem } from '../../components/listing/ArticleListItem';
import { SecondaryNav } from '../../components/navigation/SecondaryNav';
import { ArticleListSkeleton, EmptyNotice, ErrorNotice } from '../../components/widgets/StateViews';
import { siteConfig } from '../../config/site.config';
import { useBlog } from '../../context/BlogContext';

export function TagsPage() {
  const { tag: rawTag } = useParams<{ tag?: string }>();
  const { posts, tags, loading, error, refresh } = useBlog();

  const activeTag = useMemo(() => {
    if (!rawTag) return null;
    try {
      return decodeURIComponent(rawTag);
    } catch {
      return rawTag;
    }
  }, [rawTag]);

  useEffect(() => {
    document.title = activeTag
      ? `#${activeTag} — Tags · ${siteConfig.title}`
      : `Tags — ${siteConfig.title}`;
  }, [activeTag]);

  const filteredPosts = useMemo(() => {
    if (!activeTag) return [];
    const target = activeTag.toLowerCase();
    return posts.filter((post) => post.tags.some((t) => t.toLowerCase() === target));
  }, [posts, activeTag]);

  return (
    <BlogShell>
      <div className="animate-page-enter space-y-7">
        {activeTag ? (
          <>
            <header className="space-y-3">
              <Link
                to="/tags"
                className="inline-flex items-center gap-1.5 text-[0.8rem] text-[var(--text-muted)] transition-colors hover:text-[var(--accent)]"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                <span>All tags</span>
              </Link>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h1 className="font-editorial text-[2rem] font-medium leading-[1.2] tracking-[-0.02em] text-[var(--text-primary)] sm:text-[2.3rem]">
                  #{activeTag}
                </h1>
                <span className="tabular-nums text-[0.82rem] text-[var(--text-muted)]">
                  {filteredPosts.length} {filteredPosts.length === 1 ? 'article' : 'articles'}
                </span>
              </div>
            </header>

            <SecondaryNav />

            {loading && <ArticleListSkeleton />}
            {!loading && error && <ErrorNotice message={error} onRetry={() => void refresh()} />}
            {!loading && !error && filteredPosts.length === 0 && (
              <EmptyNotice
                title="No articles found for this tag"
                description={`No published articles currently reference #${activeTag}.`}
              />
            )}
            {!loading && !error && filteredPosts.length > 0 && (
              <div>
                {filteredPosts.map((post) => (
                  <ArticleListItem key={post.slug} post={post} />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <header className="space-y-2.5">
              <h1 className="font-editorial text-[2rem] font-medium leading-[1.2] tracking-[-0.02em] text-[var(--text-primary)] sm:text-[2.3rem]">
                Tags
              </h1>
              <p className="max-w-2xl text-[0.94rem] leading-[1.7] text-[var(--text-secondary)]">
                Cross-cutting topics indexed automatically from article metadata ({tags.length} tags).
              </p>
            </header>

            <SecondaryNav />

            {loading && <ArticleListSkeleton />}
            {!loading && error && <ErrorNotice message={error} onRetry={() => void refresh()} />}

            {!loading && !error && tags.length === 0 && (
              <EmptyNotice
                title="No tags indexed yet"
                description="Add a tags array in any article's YAML Front Matter to populate this index."
              />
            )}

            {!loading && !error && tags.length > 0 && (
              <div className="rounded-[10px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6">
                <div className="flex flex-wrap items-baseline gap-x-6 gap-y-4">
                  {tags.map((item) => (
                    <Link
                      key={item.name}
                      to={`/tags/${encodeURIComponent(item.name)}`}
                      className="group inline-flex items-baseline gap-1.5 transition-colors duration-150"
                    >
                      <span className="font-editorial text-[1.12rem] text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent)]">
                        #{item.name}
                      </span>
                      <span className="tabular-nums text-[0.76rem] text-[var(--text-muted)]">
                        {item.count}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </BlogShell>
  );
}
