import { useEffect, useId, useRef, useState } from 'react';
import { useBlog } from '../../context/BlogContext';

let mermaidModulePromise: Promise<typeof import('mermaid')> | null = null;
function loadMermaid() {
  if (!mermaidModulePromise) {
    mermaidModulePromise = import('mermaid');
  }
  return mermaidModulePromise;
}

function mountSanitizedSvg(container: HTMLDivElement, svgString: string) {
  const parser = new DOMParser();
  let doc = parser.parseFromString(svgString, 'image/svg+xml');
  let svgEl: Element | null = doc.querySelector('parsererror') ? null : doc.querySelector('svg');

  if (!svgEl) {
    // Fallback to HTML parser when Mermaid emits HTML entities or unclosed <br> inside labels
    doc = parser.parseFromString(svgString, 'text/html');
    svgEl = doc.body.querySelector('svg');
  }

  if (!svgEl) {
    throw new Error('Mermaid did not produce a valid SVG element');
  }

  // Strip any script tags or inline event handlers defensively
  svgEl.querySelectorAll('script, iframe, object, embed').forEach((node) => node.remove());
  const allNodes = svgEl.querySelectorAll('*');
  allNodes.forEach((node) => {
    Array.from(node.attributes).forEach((attr) => {
      if (attr.name.toLowerCase().startsWith('on')) {
        node.removeAttribute(attr.name);
      }
      if (
        (attr.name === 'href' || attr.name === 'xlink:href') &&
        /^\s*javascript:/i.test(attr.value)
      ) {
        node.removeAttribute(attr.name);
      }
    });
  });

  const imported = document.importNode(svgEl, true) as SVGSVGElement;
  imported.style.maxWidth = '100%';
  imported.style.height = 'auto';
  imported.style.display = 'block';
  container.replaceChildren(imported);
}

export function MermaidDiagram({ chart }: { chart: string }) {
  const { theme } = useBlog();
  const reactId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    (async () => {
      try {
        const mod = await loadMermaid();
        const mermaid = mod.default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: 'base',
          flowchart: {
            htmlLabels: false,
            curve: 'basis',
          },
          themeVariables:
            theme === 'dark'
              ? {
                  background: '#201E1B',
                  primaryColor: '#292622',
                  primaryTextColor: '#EAE5DA',
                  primaryBorderColor: '#4A453D',
                  lineColor: '#A9A295',
                  secondaryColor: '#24211D',
                  tertiaryColor: '#1B1916',
                  fontFamily: 'Inter, Noto Sans SC, sans-serif',
                  fontSize: '13px',
                }
              : {
                  background: '#FCFAF5',
                  primaryColor: '#F2EDE3',
                  primaryTextColor: '#25241F',
                  primaryBorderColor: '#C9C2B4',
                  lineColor: '#656158',
                  secondaryColor: '#F5F2EA',
                  tertiaryColor: '#FCFAF5',
                  fontFamily: 'Inter, Noto Sans SC, sans-serif',
                  fontSize: '13px',
                },
        });

        const renderId = `mermaid-${reactId}-${Date.now()}`;
        const { svg } = await mermaid.render(renderId, chart);
        if (!cancelled && containerRef.current) {
          mountSanitizedSvg(containerRef.current, svg);
          setStatus('ready');
        }
      } catch {
        if (!cancelled) {
          setStatus('error');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chart, theme, reactId]);

  return (
    <figure className="my-7 overflow-hidden rounded-[10px] border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
      <div className="flex items-center justify-between border-b border-[var(--border-hairline)] bg-[var(--bg-subtle)]/55 px-3.5 py-2">
        <span className="font-code text-xs font-medium text-[var(--text-secondary)]">
          mermaid diagram
        </span>
      </div>
      <div className="quiet-scroll overflow-x-auto p-5">
        {status === 'error' ? (
          <pre className="m-0 font-code text-xs leading-relaxed text-[var(--text-secondary)]">
            <code>{chart}</code>
          </pre>
        ) : (
          <div
            ref={containerRef}
            className={`flex min-h-[120px] items-center justify-center transition-opacity duration-200 ${
              status === 'loading' ? 'opacity-40' : 'opacity-100'
            }`}
            aria-label="Rendered Mermaid diagram"
          />
        )}
      </div>
    </figure>
  );
}
