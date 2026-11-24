import { useEffect, useRef, useState } from 'react';

export function useScrollReveal<T extends HTMLElement = HTMLElement>(immediate = false) {
  const ref = useRef<T | null>(null);
  const [revealed, setRevealed] = useState(immediate);

  useEffect(() => {
    if (immediate || revealed) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced || typeof IntersectionObserver === 'undefined') {
      setRevealed(true);
      return;
    }

    const node = ref.current;
    if (!node) {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -40px 0px', threshold: 0.05 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [immediate, revealed]);

  return { ref, revealed };
}
