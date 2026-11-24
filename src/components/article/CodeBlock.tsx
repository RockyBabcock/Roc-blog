import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useBlog } from '../../context/BlogContext';

interface HighlightToken {
  content: string;
  color?: string;
  fontStyle?: number;
}

const LANGUAGE_ALIASES: Record<string, string> = {
  ts: 'typescript',
  tsx: 'tsx',
  js: 'javascript',
  jsx: 'jsx',
  py: 'python',
  rs: 'rust',
  sh: 'bash',
  shell: 'bash',
  yml: 'yaml',
  md: 'markdown',
  text: 'text',
  plaintext: 'text',
};

const SUPPORTED_SHIKI_LANGS = new Set([
  'typescript',
  'tsx',
  'javascript',
  'jsx',
  'python',
  'rust',
  'bash',
  'json',
  'yaml',
  'markdown',
  'html',
  'css',
  'sql',
  'go',
]);

let shikiPromise: Promise<typeof import('shiki')> | null = null;
function loadShiki() {
  if (!shikiPromise) {
    shikiPromise = import('shiki');
  }
  return shikiPromise;
}

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const { theme } = useBlog();
  const [copied, setCopied] = useState(false);
  const [tokenLines, setTokenLines] = useState<HighlightToken[][] | null>(null);

  const rawLang = (language || 'text').toLowerCase().trim();
  const normalizedLang = LANGUAGE_ALIASES[rawLang] ?? rawLang;
  const displayLang = rawLang || 'text';

  useEffect(() => {
    let cancelled = false;

    if (!SUPPORTED_SHIKI_LANGS.has(normalizedLang)) {
      setTokenLines(null);
      return;
    }

    (async () => {
      try {
        const shiki = await loadShiki();
        const result = await shiki.codeToTokens(code, {
          lang: normalizedLang as Parameters<typeof shiki.codeToTokens>[1]['lang'],
          theme: theme === 'dark' ? 'vitesse-dark' : 'vitesse-light',
        });
        if (!cancelled) {
          setTokenLines(result.tokens);
        }
      } catch {
        if (!cancelled) {
          setTokenLines(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code, normalizedLang, theme]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback copy for restricted iframes
      const textarea = document.createElement('textarea');
      textarea.value = code;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <div className="my-6 overflow-hidden rounded-[10px] border border-[var(--border-hairline)] bg-[var(--bg-code)]">
      <div className="flex items-center justify-between border-b border-[var(--border-hairline)] bg-[var(--bg-subtle)]/70 px-3.5 py-2">
        <span className="font-code text-xs font-medium tracking-wide text-[var(--text-secondary)]">
          {displayLang}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={`Copy ${displayLang} code`}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
              <span className="text-[var(--accent)]">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="quiet-scroll overflow-x-auto p-4">
        <pre className="m-0 font-code text-[0.84rem] leading-[1.68] text-[var(--text-primary)]">
          <code>
            {tokenLines
              ? tokenLines.map((line, lineIdx) => (
                  <span key={lineIdx} className="block min-h-[1.68em]">
                    {line.map((token, tokIdx) => (
                      <span
                        key={tokIdx}
                        style={{
                          color: token.color,
                          fontStyle: token.fontStyle === 1 ? 'italic' : undefined,
                          fontWeight: token.fontStyle === 2 ? 600 : undefined,
                        }}
                      >
                        {token.content}
                      </span>
                    ))}
                  </span>
                ))
              : code}
          </code>
        </pre>
      </div>
    </div>
  );
}
