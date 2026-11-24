export function ReadingProgressBar({ progress }: { progress: number }) {
  return (
    <div
      role="progressbar"
      aria-label="Article reading progress"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[2.5px] bg-transparent"
    >
      <div
        className="h-full bg-[var(--accent)] transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
