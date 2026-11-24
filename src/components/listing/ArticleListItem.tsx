import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { formatDisplayDate } from '../../content/helpers';
import type { BlogPostSummary } from '../../content/types';

export function ArticleListItem({ post }: { post: BlogPostSummary }) {
  const [thumbFailed, setThumbFailed] = useState(false);
  const primaryCategory = post.categories[0];

  return (
    <article className="group border-b border-[var(--border-hairline)] py-6 transition-colors duration-150 first:pt-2 last:border-b-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1">
          {/* Quiet unboxed metadata line */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.77rem] text-[var(--text-muted)]">
            {primaryCategory && (
              <>
                <Link
                  to={`/categories/${encodeURIComponent(primaryCategory)}`}
                  className="font-medium text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
                >
                  {primaryCategory}
                </Link>
                <span aria-hidden="true">·</span>
              </>
            )}
            <time dateTime={post.date} className="tabular-nums">
              {formatDisplayDate(post.date)}
            </time>
            {post.updated && (
              <>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">Updated {formatDisplayDate(post.updated)}</span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{post.readingTime} min read</span>
          </div>

          {/* Article title: highest visual weight */}
          <h3 className="font-editorial mt-2 text-[1.28rem] font-medium leading-[1.32] tracking-[-0.012em] text-[var(--text-primary)] [text-wrap:balance] sm:text-[1.4rem]">
            <Link
              to={`/posts/${encodeURIComponent(post.slug)}`}
              className="transition-colors duration-150 group-hover:text-[var(--accent)]"
            >
              {post.title}
            </Link>
          </h3>

          {/* Description */}
          <p className="mt-2 line-clamp-2 text-[0.9rem] leading-[1.68] text-[var(--text-secondary)]">
            {post.description}
          </p>

          {/* Tags & subtle arrow */}
          <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.76rem] text-[var(--text-muted)]">
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
              aria-label={`Read ${post.title}`}
              className="inline-flex items-center gap-1 text-[0.8rem] font-medium text-[var(--text-secondary)] transition-colors duration-150 group-hover:text-[var(--accent)] whitespace-nowrap shrink-0"
            >
              <span>Read</span>
              <ArrowRight
                className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>

        {/* Optional compact editorial thumbnail */}
        {post.cover && !thumbFailed && (
          <Link
            to={`/posts/${encodeURIComponent(post.slug)}`}
            aria-label={`Open ${post.title}`}
            className="block aspect-[16/10] w-full shrink-0 overflow-hidden rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-subtle)] sm:mt-1 sm:w-[168px]"
          >
            <img
              src={post.cover}
              alt={post.title}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setThumbFailed(true)}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          </Link>
        )}
      </div>
    </article>
  );
}
