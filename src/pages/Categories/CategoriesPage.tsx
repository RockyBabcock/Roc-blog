import { useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { BlogShell } from '../../components/layout/BlogShell';
import { ArticleListItem } from '../../components/listing/ArticleListItem';
import { SecondaryNav } from '../../components/navigation/SecondaryNav';
import { ArticleListSkeleton, EmptyNotice, ErrorNotice } from '../../components/widgets/StateViews';
import { getCategoryDescription, siteConfig } from '../../config/site.config';
import { useBlog } from '../../context/BlogContext';

export function CategoriesPage() {
  const { category: rawCategory } = useParams<{ category?: string }>();
  const { posts, categories, loading, error, refresh } = useBlog();

  const activeCategory = useMemo(() => {
    if (!rawCategory) return null;
    try {
      return decodeURIComponent(rawCategory);
    } catch {
      return rawCategory;
    }
  }, [rawCategory]);

  useEffect(() => {
    document.title = activeCategory
      ? `${activeCategory} — Categories · ${siteConfig.title}`
      : `Categories — ${siteConfig.title}`;
  }, [activeCategory]);

  const filteredPosts = useMemo(() => {
    if (!activeCategory) return [];
    const target = activeCategory.toLowerCase();
    return posts.filter((post) =>
      post.categories.some((cat) => cat.toLowerCase() === target)
    );
  }, [posts, activeCategory]);

  const canonicalCategoryName = useMemo(() => {
    if (!activeCategory) return null;
    const match = categories.find(
      (cat) => cat.name.toLowerCase() === activeCategory.toLowerCase()
    );
    return match?.name ?? activeCategory;
  }, [categories, activeCategory]);

  return (
    <BlogShell>
      <div className="animate-page-enter space-y-7">
        {canonicalCategoryName ? (
          <>
            <header className="space-y-3">
              <Link
                to="/categories"
                className="inline-flex items-center gap-1.5 text-[0.8rem] text-[var(--text-muted)] transition-colors hover:text-[var(--accent)]"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                <span>All categories</span>
              </Link>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h1 className="font-editorial text-[2rem] font-medium leading-[1.2] tracking-[-0.02em] text-[var(--text-primary)] sm:text-[2.3rem]">
                  {canonicalCategoryName}
                </h1>
                <span className="tabular-nums text-[0.82rem] text-[var(--text-muted)]">
                  {filteredPosts.length} {filteredPosts.length === 1 ? 'article' : 'articles'}
                </span>
              </div>
              <p className="max-w-2xl text-[0.94rem] leading-[1.7] text-[var(--text-secondary)]">
                {getCategoryDescription(canonicalCategoryName)}
              </p>
            </header>

            <SecondaryNav />

            {loading && <ArticleListSkeleton />}
            {!loading && error && <ErrorNotice message={error} onRetry={() => void refresh()} />}
            {!loading && !error && filteredPosts.length === 0 && (
              <EmptyNotice
                title="No articles in this category yet"
                description={`Articles tagged with "${canonicalCategoryName}" in Front Matter will appear here automatically.`}
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
                Categories
              </h1>
              <p className="max-w-2xl text-[0.94rem] leading-[1.7] text-[var(--text-secondary)]">
                Five enduring editorial threads, automatically updated from article Front Matter metadata.
              </p>
            </header>

            <SecondaryNav />

            {loading && <ArticleListSkeleton />}
            {!loading && error && <ErrorNotice message={error} onRetry={() => void refresh()} />}

            {!loading && !error && (
              <div className="divide-y divide-[var(--border-hairline)] border-t border-[var(--border-hairline)]">
                {categories.map((cat) => (
                  <Link
                    key={cat.name}
                    to={`/categories/${encodeURIComponent(cat.name)}`}
                    className="group flex flex-col gap-2 py-6 transition-colors duration-150 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
                  >
                    <div className="min-w-0 flex-1">
                      <h2 className="font-editorial text-[1.32rem] font-medium text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent)]">
                        {cat.name}
                      </h2>
                      <p className="mt-1.5 text-[0.88rem] leading-relaxed text-[var(--text-secondary)]">
                        {cat.description}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 pt-1 text-[0.82rem] text-[var(--text-muted)]">
                      <span className="tabular-nums">
                        {cat.count} {cat.count === 1 ? 'article' : 'articles'}
                      </span>
                      <ArrowRight
                        className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-1 group-hover:text-[var(--accent)]"
                        aria-hidden="true"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </BlogShell>
  );
}
