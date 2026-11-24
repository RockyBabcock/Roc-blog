import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Pin } from 'lucide-react';
import { formatDisplayDate } from '../../content/helpers';
import type { BlogPostSummary } from '../../content/types';

export function FeaturedArticleCard({ post }: { post: BlogPostSummary }) {
  const [imageError, setImageError] = useState(false);
  const primaryCategory = post.categories[0] ?? 'Journal';

  return (
    <article className="group overflow-hidden rounded-[12px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] shadow-[var(--shadow-subtle)] transition-colors duration-200 hover:border-[var(--border-strong)]">
      {post.cover && !imageError && (
        <Link
          to={`/posts/${encodeURIComponent(post.slug)}`}
          className="block aspect-[16/9] max-h-[340px] w-full overflow-hidden border-b border-[var(--border-hairline)] bg-[var(--bg-subtle)]"
        >
          <img
            src={post.cover}
            alt={post.title}
            loading="eager"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.015]"
          />
        </Link>
      )}

      <div className="p-5 sm:p-7">
        {/* Clean unboxed metadata row */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.78rem] text-[var(--text-secondary)]">
          <span className="inline-flex items-center gap-1 font-medium text-[var(--accent)]">
            <Pin className="h-3 w-3" aria-hidden="true" />
            <span>Pinned</span>
          </span>
          <span aria-hidden="true" className="text-[var(--text-muted)]">·</span>
          <Link
            to={`/categories/${encodeURIComponent(primaryCategory)}`}
            className="transition-colors hover:text-[var(--accent)]"
          >
            {primaryCategory}
          </Link>
          <span aria-hidden="true" className="text-[var(--text-muted)]">·</span>
          <time dateTime={post.date} className="tabular-nums text-[var(--text-muted)]">
            {formatDisplayDate(post.date)}
          </time>
          {post.updated && (
            <>
              <span aria-hidden="true" className="text-[var(--text-muted)]">·</span>
              <span className="tabular-nums text-[var(--text-muted)]">
                Updated {formatDisplayDate(post.updated)}
              </span>
            </>
          )}
          <span aria-hidden="true" className="text-[var(--text-muted)]">·</span>
          <span className="tabular-nums text-[var(--text-muted)]">{post.readingTime} min read</span>
        </div>

        {/* Title (highest emphasis) */}
        <h2 className="font-editorial mt-3 text-[1.5rem] font-medium leading-[1.28] tracking-[-0.015em] text-[var(--text-primary)] [text-wrap:balance] sm:text-[1.82rem]">
          <Link
            to={`/posts/${encodeURIComponent(post.slug)}`}
            className="transition-colors duration-150 group-hover:text-[var(--accent)]"
          >
            {post.title}
          </Link>
        </h2>

        <p className="mt-3 text-[0.94rem] leading-[1.7] text-[var(--text-secondary)]">
          {post.description}
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border-hairline)] pt-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.78rem] text-[var(--text-muted)]">
            {post.tags.slice(0, 4).map((tag) => (
              <Link
                key={tag}
                to={`/tags/${encodeURIComponent(tag)}`}
                className="transition-colors hover:text-[var(--accent)]"
              >
                #{tag}
              </Link>
            ))}
          </div>

          <Link
            to={`/posts/${encodeURIComponent(post.slug)}`}
            className="inline-flex items-center gap-1.5 text-[0.83rem] font-medium text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)] whitespace-nowrap shrink-0"
          >
            <span>Read article</span>
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </article>
  );
}
