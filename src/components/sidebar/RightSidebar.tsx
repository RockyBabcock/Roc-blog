import { Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { siteConfig } from '../../config/site.config';
import { formatDisplayDate } from '../../content/helpers';
import { useBlog } from '../../context/BlogContext';

export function RightSidebar() {
  const { posts, tags, sourceInfo, refresh, loading } = useBlog();
  const popularTags = tags.slice(0, siteConfig.popularTagsCount);
  const recentlyUpdated = [...posts]
    .filter((post) => Boolean(post.updated))
    .slice(0, 3);

  return (
    <div className="space-y-7 px-3 py-7 text-[var(--text-secondary)]">
      {/* Popular Tags */}
      {popularTags.length > 0 && (
        <section aria-labelledby="rightbar-tags-heading">
          <div className="mb-3 flex items-center justify-between">
            <h2
              id="rightbar-tags-heading"
              className="text-[0.75rem] font-medium tracking-wide text-[var(--text-muted)]"
            >
              Popular Tags
            </h2>
            <Link
              to="/tags"
              className="text-[0.72rem] text-[var(--text-muted)] transition-colors hover:text-[var(--accent)]"
            >
              Index
            </Link>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-2 text-[0.8rem]">
            {popularTags.map((tag) => (
              <Link
                key={tag.name}
                to={`/tags/${encodeURIComponent(tag.name)}`}
                className="inline-flex items-baseline gap-1 text-[var(--text-secondary)] transition-colors duration-150 hover:text-[var(--accent)]"
              >
                <span>#{tag.name}</span>
                <span className="tabular-nums text-[0.7rem] text-[var(--text-muted)]">
                  {tag.count}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recently Revised */}
      {recentlyUpdated.length > 0 && (
        <section
          aria-labelledby="rightbar-updated-heading"
          className="border-t border-[var(--border-hairline)] pt-6"
        >
          <h2
            id="rightbar-updated-heading"
            className="mb-3 text-[0.75rem] font-medium tracking-wide text-[var(--text-muted)]"
          >
            Recently Updated
          </h2>
          <ul className="space-y-3">
            {recentlyUpdated.map((post) => (
              <li key={post.slug}>
                <Link
                  to={`/posts/${encodeURIComponent(post.slug)}`}
                  className="group block space-y-0.5"
                >
                  <p className="line-clamp-2 text-[0.8rem] leading-snug text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent)]">
                    {post.title}
                  </p>
                  <span className="tabular-nums text-[0.72rem] text-[var(--text-muted)]">
                    Updated {formatDisplayDate(post.updated!)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Quiet Archive Summary & Content Refresh */}
      <section
        className={
          popularTags.length > 0 || recentlyUpdated.length > 0
            ? 'border-t border-[var(--border-hairline)] pt-6'
            : ''
        }
      >
        <div className="flex items-center justify-between text-[0.76rem] text-[var(--text-muted)]">
          <span className="tabular-nums">
            {posts.length} {posts.length === 1 ? 'article' : 'articles'}
          </span>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            aria-label="Refresh content index"
            className="inline-flex items-center gap-1 text-[0.74rem] text-[var(--text-muted)] transition-colors hover:text-[var(--accent)] disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>Sync</span>
          </button>
        </div>
        <p className="mt-2 text-[0.73rem] leading-relaxed text-[var(--text-muted)]">
          Source: {sourceInfo.label}
        </p>
      </section>
    </div>
  );
}
