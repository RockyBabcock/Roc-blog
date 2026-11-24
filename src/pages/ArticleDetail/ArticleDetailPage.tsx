import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChevronRight, ZoomIn } from 'lucide-react';
import { BlogShell } from '../../components/layout/BlogShell';
import { ImageLightbox, type LightboxImage } from '../../components/article/ImageLightbox';
import { MarkdownRenderer } from '../../components/article/MarkdownRenderer';
import { ReadingProgressBar } from '../../components/article/ReadingProgressBar';
import { DesktopTocSidebar, MobileCollapsibleToc } from '../../components/article/TableOfContents';
import { ArticleListSkeleton, ErrorNotice } from '../../components/widgets/StateViews';
import { siteConfig } from '../../config/site.config';
import { formatDisplayDate, getAdjacentPosts, getRelatedPosts } from '../../content/helpers';
import { extractTocHeadings } from '../../content/parsers/markdown';
import type { BlogPost } from '../../content/types';
import { useBlog } from '../../context/BlogContext';
import { useReadingTrack } from '../../hooks/useReadingTrack';
import { NotFoundPage } from '../NotFound/NotFoundPage';

export function ArticleDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { posts, getPostBySlug, resolveAssetUrl } = useBlog();

  const [post, setPost] = useState<BlogPost | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'not-found' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [coverError, setCoverError] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<LightboxImage | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setErrorMessage(null);
    setCoverError(false);

    (async () => {
      try {
        const fetched = await getPostBySlug(slug);
        if (cancelled) return;
        if (!fetched) {
          setPost(null);
          setStatus('not-found');
        } else {
          setPost(fetched);
          setStatus('ready');
          document.title = `${fetched.title} — ${siteConfig.title}`;
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(err instanceof Error ? err.message : 'Unable to load this article.');
          setStatus('error');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug, getPostBySlug]);

  const headings = useMemo(() => (post ? extractTocHeadings(post.content) : []), [post]);
  const { activeId, progress } = useReadingTrack(headings);

  const relatedPosts = useMemo(
    () => (post ? getRelatedPosts(post, posts, 3) : []),
    [post, posts]
  );

  const adjacent = useMemo(
    () => (post ? getAdjacentPosts(post.slug, posts) : { newer: null, older: null }),
    [post, posts]
  );

  if (status === 'not-found') {
    return (
      <NotFoundPage
        title="Article not found"
        description={`We could not find a published article matching "${slug}". It may have been moved, renamed, or marked as a draft.`}
      />
    );
  }

  const rightSidebar =
    status === 'ready' && post ? (
      <DesktopTocSidebar
        headings={headings}
        activeId={activeId}
        progress={progress}
        readingTime={post.readingTime}
        relatedPosts={relatedPosts}
      />
    ) : undefined;

  const primaryCategory = post?.categories[0];

  return (
    <BlogShell rightSidebar={rightSidebar}>
      {status === 'ready' && <ReadingProgressBar progress={progress} />}

      {status === 'loading' && <ArticleListSkeleton />}

      {status === 'error' && (
        <ErrorNotice
          message={errorMessage ?? 'Unable to render this article.'}
          onRetry={() => window.location.reload()}
        />
      )}

      {status === 'ready' && post && (
        <article className="animate-page-enter mx-auto max-w-[70ch]">
          {/* Breadcrumb Navigation */}
          <nav
            aria-label="Breadcrumb"
            className="mb-6 flex flex-wrap items-center gap-1.5 text-[0.78rem] text-[var(--text-muted)]"
          >
            <Link to="/" className="transition-colors hover:text-[var(--accent)]">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
            {primaryCategory ? (
              <>
                <Link
                  to={`/categories/${encodeURIComponent(primaryCategory)}`}
                  className="transition-colors hover:text-[var(--accent)]"
                >
                  {primaryCategory}
                </Link>
                <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
              </>
            ) : null}
            <span className="truncate text-[var(--text-secondary)]" aria-current="page">
              {post.title}
            </span>
          </nav>

          {/* Article Header */}
          <header className="border-b border-[var(--border-hairline)] pb-7">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8rem] text-[var(--text-muted)]">
              {post.categories.map((cat, idx) => (
                <span key={cat} className="inline-flex items-center gap-2">
                  {idx > 0 && <span aria-hidden="true">/</span>}
                  <Link
                    to={`/categories/${encodeURIComponent(cat)}`}
                    className="font-medium text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
                  >
                    {cat}
                  </Link>
                </span>
              ))}
              {post.categories.length > 0 && <span aria-hidden="true">·</span>}
              <time dateTime={post.date} className="tabular-nums">
                Published {formatDisplayDate(post.date)}
              </time>
              {post.updated && (
                <>
                  <span aria-hidden="true">·</span>
                  <time dateTime={post.updated} className="tabular-nums">
                    Updated {formatDisplayDate(post.updated)}
                  </time>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{post.readingTime} min read</span>
            </div>

            <h1 className="font-editorial mt-4 text-[1.95rem] font-medium leading-[1.2] tracking-[-0.02em] text-[var(--text-primary)] [text-wrap:balance] sm:text-[2.5rem]">
              {post.title}
            </h1>

            {post.description && (
              <p className="mt-4 text-[1.03rem] leading-[1.7] text-[var(--text-secondary)]">
                {post.description}
              </p>
            )}

            {post.tags.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[0.8rem] text-[var(--text-muted)]">
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/tags/${encodeURIComponent(tag)}`}
                    className="transition-colors hover:text-[var(--accent)]"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </header>

          {/* Optional Cover Image */}
          {post.cover && !coverError && (
            <figure className="my-8">
              <button
                type="button"
                onClick={() =>
                  setLightboxImage({
                    src: post.cover!,
                    alt: post.title,
                    caption: post.title,
                  })
                }
                aria-label={`Inspect cover image for ${post.title}`}
                className="group relative block aspect-[16/9] w-full overflow-hidden rounded-[10px] border border-[var(--border-hairline)] bg-[var(--bg-surface)]"
              >
                <img
                  src={post.cover}
                  alt={post.title}
                  referrerPolicy="no-referrer"
                  onError={() => setCoverError(true)}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
                />
                <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)]/90 px-2.5 py-1 text-xs text-[var(--text-secondary)] opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                  <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Expand</span>
                </span>
              </button>
            </figure>
          )}

          {/* Mobile & Tablet Collapsible TOC */}
          <MobileCollapsibleToc headings={headings} activeId={activeId} />

          {/* Article Body */}
          <div className="mt-8">
            <MarkdownRenderer
              content={post.content}
              filePath={post.filePath}
              resolveAssetUrl={resolveAssetUrl}
              onImageClick={setLightboxImage}
            />
          </div>

          {/* Related Articles */}
          {relatedPosts.length > 0 && (
            <section
              aria-labelledby="related-articles-heading"
              className="mt-14 border-t border-[var(--border-hairline)] pt-8"
            >
              <h2
                id="related-articles-heading"
                className="text-[0.8rem] font-medium tracking-wide text-[var(--text-muted)]"
              >
                Related Articles
              </h2>
              <div className="mt-4 divide-y divide-[var(--border-hairline)] rounded-[10px] border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
                {relatedPosts.map((item) => (
                  <Link
                    key={item.slug}
                    to={`/posts/${encodeURIComponent(item.slug)}`}
                    className="group flex flex-col gap-1 px-4 py-3.5 transition-colors hover:bg-[var(--bg-subtle)]/50 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
                  >
                    <span className="font-editorial text-[1.02rem] font-medium text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent)]">
                      {item.title}
                    </span>
                    <span className="tabular-nums shrink-0 text-[0.76rem] text-[var(--text-muted)]">
                      {formatDisplayDate(item.date)} · {item.readingTime} min
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Previous / Next Article Navigation */}
          {(adjacent.newer || adjacent.older) && (
            <nav
              aria-label="Adjacent articles"
              className="mt-10 grid grid-cols-1 gap-4 border-t border-[var(--border-hairline)] pt-8 sm:grid-cols-2"
            >
              <div>
                {adjacent.newer && (
                  <Link
                    to={`/posts/${encodeURIComponent(adjacent.newer.slug)}`}
                    className="group flex h-full flex-col justify-between rounded-[10px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 transition-colors duration-150 hover:border-[var(--border-strong)]"
                  >
                    <span className="inline-flex items-center gap-1.5 text-[0.74rem] text-[var(--text-muted)]">
                      <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Newer article</span>
                    </span>
                    <span className="font-editorial mt-2 text-[1.02rem] font-medium leading-snug text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent)]">
                      {adjacent.newer.title}
                    </span>
                  </Link>
                )}
              </div>

              <div>
                {adjacent.older && (
                  <Link
                    to={`/posts/${encodeURIComponent(adjacent.older.slug)}`}
                    className="group flex h-full flex-col justify-between rounded-[10px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 text-left transition-colors duration-150 hover:border-[var(--border-strong)] sm:text-right"
                  >
                    <span className="inline-flex items-center gap-1.5 text-[0.74rem] text-[var(--text-muted)] sm:justify-end">
                      <span>Older article</span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <span className="font-editorial mt-2 text-[1.02rem] font-medium leading-snug text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent)]">
                      {adjacent.older.title}
                    </span>
                  </Link>
                )}
              </div>
            </nav>
          )}
        </article>
      )}

      <ImageLightbox image={lightboxImage} onClose={() => setLightboxImage(null)} />
    </BlogShell>
  );
}
