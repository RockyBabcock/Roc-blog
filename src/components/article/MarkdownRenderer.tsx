import React, { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeKatex from 'rehype-katex';
import { ImageOff, Link2, ZoomIn } from 'lucide-react';
import {
  createHeadingSlugger,
  markdownSanitizeSchema,
  sanitizeUrl,
  transformCustomDirectives,
} from '../../content/parsers/markdown';
import { CodeBlock } from './CodeBlock';
import { MermaidDiagram } from './MermaidDiagram';
import type { LightboxImage } from './ImageLightbox';

interface MarkdownRendererProps {
  content: string;
  filePath: string;
  resolveAssetUrl: (rawUrl: string, filePath: string) => string;
  onImageClick?: (image: LightboxImage) => void;
}

function extractNodeText(children: React.ReactNode): string {
  if (typeof children === 'string' || typeof children === 'number') {
    return String(children);
  }
  if (Array.isArray(children)) {
    return children.map(extractNodeText).join('');
  }
  if (React.isValidElement(children)) {
    const props = children.props as { children?: React.ReactNode };
    return extractNodeText(props.children);
  }
  return '';
}

function ArticleFigure({
  src,
  alt,
  caption,
  onImageClick,
}: {
  src: string;
  alt: string;
  caption?: string;
  onImageClick?: (image: LightboxImage) => void;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <figure className="my-7 overflow-hidden rounded-[10px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 text-center">
        <div className="mx-auto flex flex-col items-center gap-2 text-[var(--text-muted)]">
          <ImageOff className="h-6 w-6" aria-hidden="true" />
          <span className="text-sm font-medium text-[var(--text-secondary)]">
            {alt || 'Image unavailable'}
          </span>
        </div>
        {caption && (
          <figcaption className="mt-2 font-editorial text-xs italic text-[var(--text-muted)]">
            {caption}
          </figcaption>
        )}
      </figure>
    );
  }

  return (
    <figure className="my-7">
      <button
        type="button"
        onClick={() => onImageClick?.({ src, alt, caption })}
        aria-label={`Inspect image: ${alt || caption || 'Article figure'}`}
        className="group relative block w-full overflow-hidden rounded-[10px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      >
        <img
          src={src}
          alt={alt}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
        />
        <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)]/90 px-2 py-1 text-xs text-[var(--text-secondary)] opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Expand</span>
        </span>
      </button>
      {(caption || alt) && (
        <figcaption className="mt-2.5 text-center font-editorial text-[0.86rem] italic leading-relaxed text-[var(--text-secondary)]">
          {caption || alt}
        </figcaption>
      )}
    </figure>
  );
}

export function MarkdownRenderer({
  content,
  filePath,
  resolveAssetUrl,
  onImageClick,
}: MarkdownRendererProps) {
  const preparedMarkdown = useMemo(() => transformCustomDirectives(content), [content]);

  // Deterministic heading slugger per render matching extractTocHeadings()
  const nextSlug = createHeadingSlugger();

  const renderHeading = (
    Tag: 'h1' | 'h2' | 'h3' | 'h4',
    children: React.ReactNode
  ) => {
    const text = extractNodeText(children).trim();
    const id = nextSlug(text);
    return (
      <Tag id={id} className="group relative">
        <span>{children}</span>
        <a
          href={`#${id}`}
          aria-label={`Link to section ${text}`}
          className="ml-2 inline-flex align-middle text-[var(--text-muted)] opacity-0 transition-opacity duration-150 hover:text-[var(--accent)] group-hover:opacity-100 focus-visible:opacity-100 !no-underline"
        >
          <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </Tag>
    );
  };

  return (
    <div className="editorial-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          rehypeRaw,
          [rehypeSanitize, markdownSanitizeSchema],
          rehypeKatex,
        ]}
        components={{
          h1: ({ children }) => renderHeading('h1', children),
          h2: ({ children }) => renderHeading('h2', children),
          h3: ({ children }) => renderHeading('h3', children),
          h4: ({ children }) => renderHeading('h4', children),

          a: ({ href, children }) => {
            const safeHref = sanitizeUrl(href, { allowRelative: true });
            const isExternal = /^https?:\/\//i.test(safeHref);
            if (!safeHref) {
              return <span>{children}</span>;
            }
            return (
              <a
                href={safeHref}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
              >
                {children}
              </a>
            );
          },

          img: ({ src, alt, title }) => {
            const resolved = src ? resolveAssetUrl(src, filePath) : '';
            const safeSrc = sanitizeUrl(resolved, { allowRelative: true });
            return (
              <ArticleFigure
                src={safeSrc}
                alt={alt || ''}
                caption={title || undefined}
                onImageClick={onImageClick}
              />
            );
          },

          p: ({ node, children }) => {
            // Avoid invalid <figure> inside <p> nesting when an image is the sole child
            const hasOnlyImage =
              node?.children?.length === 1 &&
              node.children[0].type === 'element' &&
              node.children[0].tagName === 'img';
            if (hasOnlyImage) {
              return <>{children}</>;
            }
            return <p>{children}</p>;
          },

          table: ({ children }) => (
            <div className="table-scroll-wrapper quiet-scroll">
              <table>{children}</table>
            </div>
          ),

          pre: ({ children }) => {
            const child = React.Children.only(children) as React.ReactElement<{
              className?: string;
              children?: React.ReactNode;
            }>;

            const className = child?.props?.className ?? '';
            const langMatch = /language-([\w-]+)/.exec(className);
            const language = langMatch?.[1]?.toLowerCase() ?? 'text';
            const rawCode = extractNodeText(child?.props?.children).replace(/\n$/, '');

            if (language === 'mermaid') {
              return <MermaidDiagram chart={rawCode} />;
            }

            return <CodeBlock code={rawCode} language={language} />;
          },
        }}
      >
        {preparedMarkdown}
      </ReactMarkdown>
    </div>
  );
}
