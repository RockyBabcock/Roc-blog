import { highlightTextSegments } from '../../content/search';

export function HighlightedText({ text, query }: { text: string; query: string }) {
  const segments = highlightTextSegments(text, query);
  return (
    <>
      {segments.map((segment, index) =>
        segment.highlighted ? (
          <mark
            key={index}
            className="rounded-[3px] bg-[var(--accent-soft)] px-0.5 font-medium text-[var(--accent)]"
          >
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        )
      )}
    </>
  );
}
