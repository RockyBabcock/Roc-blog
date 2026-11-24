import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Download, Rss, X } from 'lucide-react';
import { generateRssXml } from '../../content/helpers';
import { useBlog } from '../../context/BlogContext';

export function RssModal() {
  const { isRssOpen, closeRss, posts } = useBlog();
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : undefined;
  const rssXml = useMemo(() => generateRssXml(posts, origin), [posts, origin]);

  useEffect(() => {
    if (!isRssOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRss();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isRssOpen, closeRss]);

  if (!isRssOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rssXml);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([rssXml], { type: 'application/rss+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'rss.xml';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="RSS Feed XML"
      className="animate-backdrop-fade fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
      onClick={closeRss}
    >
      <div
        className="animate-dialog-enter w-full max-w-2xl overflow-hidden rounded-[12px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--shadow-elevated)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border-hairline)] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Rss className="h-4.5 w-4.5 text-[var(--accent)]" aria-hidden="true" />
            <h2 className="font-editorial text-lg font-medium">RSS 2.0 Feed</h2>
          </div>
          <button
            type="button"
            onClick={closeRss}
            aria-label="Close RSS dialog"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
          >
            <X className="h-4.5 w-4.5" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            Generated automatically from the {posts.length} published Markdown articles currently loaded in the feed.
          </p>
          <pre className="quiet-scroll max-h-[300px] overflow-auto rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-code)] p-4 font-code text-xs leading-relaxed text-[var(--text-secondary)]">
            <code>{rssXml}</code>
          </pre>
          <div className="flex flex-wrap items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-[7px] border border-[var(--border-hairline)] bg-[var(--bg-page)] px-3.5 py-2 text-xs font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--border-strong)]"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
                  <span>Copied XML</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Copy XML</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 rounded-[7px] bg-[var(--accent)] px-4 py-2 text-xs font-medium text-[#FCFAF5] transition-colors hover:bg-[var(--accent-hover)]"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Download rss.xml</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
