import { useEffect, useState } from 'react';
import type { TocHeading } from '../content/types';

export function useReadingTrack(headings: TocHeading[]) {
  const [activeId, setActiveId] = useState<string>(headings[0]?.id ?? '');
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    setActiveId(headings[0]?.id ?? '');
  }, [headings]);

  useEffect(() => {
    let rafId = 0;

    const updateReadingState = () => {
      rafId = 0;
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? Math.min(100, Math.max(0, Math.round((scrollTop / docHeight) * 100))) : 0;
      setProgress(pct);

      if (headings.length === 0) return;

      const offset = 128;
      let current = headings[0].id;
      for (const heading of headings) {
        const el = document.getElementById(heading.id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= offset) {
          current = heading.id;
        } else {
          break;
        }
      }
      setActiveId(current);
    };

    const onScroll = () => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(updateReadingState);
      }
    };

    updateReadingState();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [headings]);

  return { activeId, progress };
}
