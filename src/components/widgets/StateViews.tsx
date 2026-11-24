import { AlertCircle, RefreshCw } from 'lucide-react';

export function ArticleListSkeleton() {
  return (
    <div className="space-y-6 py-4" aria-busy="true" aria-label="Loading articles">
      {[0, 1, 2].map((idx) => (
        <div
          key={idx}
          className="animate-pulse border-b border-[var(--border-hairline)] pb-6 last:border-b-0"
        >
          <div className="h-3 w-44 rounded bg-[var(--bg-subtle)]" />
          <div className="mt-3 h-6 w-4/5 rounded bg-[var(--bg-subtle)]" />
          <div className="mt-2.5 h-4 w-full rounded bg-[var(--bg-subtle)]/80" />
          <div className="mt-1.5 h-4 w-2/3 rounded bg-[var(--bg-subtle)]/70" />
        </div>
      ))}
    </div>
  );
}

export function ErrorNotice({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="my-8 rounded-[10px] border border-[var(--callout-warning-border)] bg-[var(--callout-warning-bg)] p-6"
    >
      <div className="flex items-start gap-3">
        <AlertCircle
          className="mt-0.5 h-5 w-5 shrink-0 text-[var(--callout-warning-ink)]"
          aria-hidden="true"
        />
        <div className="space-y-2">
          <h2 className="font-editorial text-lg font-medium text-[var(--text-primary)]">
            Unable to load content
          </h2>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{message}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 inline-flex items-center gap-1.5 rounded-[7px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3.5 py-2 text-xs font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--border-strong)]"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Try again</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function EmptyNotice({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="my-8 rounded-[10px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-6 py-10 text-center">
      <h2 className="font-editorial text-xl font-medium text-[var(--text-primary)]">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">
        {description}
      </p>
    </div>
  );
}
