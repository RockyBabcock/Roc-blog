import { defaultSchema } from 'rehype-sanitize';
import type { Options as RehypeSanitizeOptions } from 'rehype-sanitize';
import type { TocHeading } from '../types';

export function slugifyHeading(text: string): string {
  const cleaned = text
    .trim()
    .toLowerCase()
    .replace(/[`*_~[\]()]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return cleaned || 'section';
}

export function createHeadingSlugger() {
  const counts = new Map<string, number>();
  return (text: string): string => {
    const base = slugifyHeading(text);
    const seen = counts.get(base) ?? 0;
    counts.set(base, seen + 1);
    return seen === 0 ? base : `${base}-${seen}`;
  };
}

export function extractTocHeadings(markdown: string): TocHeading[] {
  const headings: TocHeading[] = [];
  const nextSlug = createHeadingSlugger();
  const lines = markdown.split(/\r?\n/);

  let inFence = false;
  let fenceChar = '';

  for (const line of lines) {
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
    if (fenceMatch) {
      const marker = fenceMatch[1][0];
      if (!inFence) {
        inFence = true;
        fenceChar = marker;
      } else if (marker === fenceChar) {
        inFence = false;
        fenceChar = '';
      }
      continue;
    }

    if (inFence) continue;

    const headingMatch = line.match(/^(#{1,4})\s+(.+?)\s*#*\s*$/);
    if (!headingMatch) continue;

    const level = headingMatch[1].length as 1 | 2 | 3 | 4;
    const rawText = headingMatch[2]
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*_~]/g, '')
      .trim();

    if (!rawText) continue;

    headings.push({
      id: nextSlug(rawText),
      text: rawText,
      level,
    });
  }

  return headings;
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHtmlText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const DEFAULT_DIRECTIVE_TITLES: Record<string, string> = {
  note: 'Note',
  tip: 'Tip',
  warning: 'Warning',
  details: 'Details',
};

/**
 * Converts explicit custom container directives (:::note, :::tip, :::warning, :::details)
 * into semantic HTML blocks while leaving fenced code blocks untouched.
 */
export function transformCustomDirectives(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  const output: string[] = [];

  let inFence = false;
  let fenceChar = '';
  let activeDirective: { kind: string; title: string; bodyLines: string[] } | null = null;

  for (const line of lines) {
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
    if (fenceMatch && !activeDirective) {
      const marker = fenceMatch[1][0];
      if (!inFence) {
        inFence = true;
        fenceChar = marker;
      } else if (marker === fenceChar) {
        inFence = false;
        fenceChar = '';
      }
      output.push(line);
      continue;
    }

    if (inFence) {
      output.push(line);
      continue;
    }

    if (!activeDirective) {
      const openMatch = line.match(
        /^:::(note|tip|warning|details)(?:\{title="([^"]*)"\}|\s+(.+))?\s*$/i
      );
      if (openMatch) {
        const kind = openMatch[1].toLowerCase();
        const title = (openMatch[2] || openMatch[3] || DEFAULT_DIRECTIVE_TITLES[kind] || kind).trim();
        activeDirective = { kind, title, bodyLines: [] };
        continue;
      }
      output.push(line);
      continue;
    }

    if (/^:::\s*$/.test(line)) {
      const innerMarkdown = activeDirective.bodyLines.join('\n').trim();
      if (activeDirective.kind === 'details') {
        output.push(
          `<details class="md-details"><summary>${escapeHtmlText(activeDirective.title)}</summary>\n<div class="md-details-body">\n\n${innerMarkdown}\n\n</div></details>`
        );
      } else {
        output.push(
          `<aside class="md-callout" data-callout="${escapeHtmlAttr(activeDirective.kind)}"><div class="md-callout-title">${escapeHtmlText(activeDirective.title)}</div>\n<div class="md-callout-body">\n\n${innerMarkdown}\n\n</div></aside>`
        );
      }
      activeDirective = null;
      continue;
    }

    activeDirective.bodyLines.push(line);
  }

  // If a directive wasn't closed, emit original lines safely without breaking render
  if (activeDirective) {
    output.push(`:::${activeDirective.kind}{title="${activeDirective.title}"}`);
    output.push(...activeDirective.bodyLines);
  }

  return output.join('\n');
}

export function normalizePosixPath(pathInput: string): string {
  const parts = pathInput.replace(/\\/g, '/').split('/');
  const stack: string[] = [];
  for (const part of parts) {
    if (!part || part === '.') continue;
    if (part === '..') {
      if (stack.length > 0 && stack[stack.length - 1] !== '..') {
        stack.pop();
      }
    } else {
      stack.push(part);
    }
  }
  return stack.join('/');
}

/**
 * Resolves an image or asset URL relative to the Markdown file's directory.
 */
export function resolveRelativeAssetUrl(
  rawUrl: string,
  markdownFilePath: string,
  assetBaseUrl?: string,
  assetMap?: Record<string, string>
): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  // Absolute HTTP(S) or root-relative URLs
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) {
    return trimmed;
  }

  // Block dangerous schemes before path joining
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
    return '';
  }

  const cleanFile = markdownFilePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const dirSegments = cleanFile.split('/');
  dirSegments.pop();
  const baseDir = dirSegments.join('/');

  const combined = baseDir ? `${baseDir}/${trimmed}` : trimmed;
  const resolvedRelative = normalizePosixPath(combined);

  if (assetMap) {
    if (assetMap[resolvedRelative]) return assetMap[resolvedRelative];
    if (assetMap[trimmed]) return assetMap[trimmed];
    const fileName = resolvedRelative.split('/').pop() ?? '';
    if (fileName && assetMap[fileName]) return assetMap[fileName];
  }

  if (assetBaseUrl) {
    const cleanBase = assetBaseUrl.replace(/\/+$/, '');
    return `${cleanBase}/${resolvedRelative}`;
  }

  return `/${resolvedRelative}`;
}

export function sanitizeUrl(
  rawUrl: string | undefined,
  options?: { allowRelative?: boolean }
): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('#')) return trimmed;
  if (options?.allowRelative && (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../'))) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed, 'https://rockyjournal.local');
    const protocol = parsed.protocol.toLowerCase();
    if (protocol === 'http:' || protocol === 'https:' || protocol === 'mailto:') {
      // If original was relative and allowRelative is false, reject
      if (!/^[a-z][a-z0-9+.-]*:/i.test(trimmed) && !options?.allowRelative) {
        return '';
      }
      return trimmed;
    }
    return '';
  } catch {
    return '';
  }
}

/**
 * Strict rehype-sanitize schema extending GitHub defaults safely for:
 * - Custom directives (<aside class="md-callout" data-callout="...">, <details>, <summary>)
 * - KaTeX math markup (MathML tags & katex classes)
 * - Code fence language classes
 * Strips <script>, <iframe>, event handlers, and unsafe protocols.
 */
export const markdownSanitizeSchema: RehypeSanitizeOptions = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    'aside',
    'details',
    'summary',
    'figure',
    'figcaption',
    'math',
    'semantics',
    'mrow',
    'mi',
    'mo',
    'mn',
    'msup',
    'msub',
    'msubsup',
    'mfrac',
    'msqrt',
    'mroot',
    'mtext',
    'mspace',
    'mover',
    'munder',
    'munderover',
    'mtable',
    'mtr',
    'mtd',
    'annotation',
    'mpadded',
    'mphantom',
    'mstyle',
  ],
  attributes: {
    ...defaultSchema.attributes,
    aside: ['className', 'dataCallout', 'data-callout'],
    div: [...(defaultSchema.attributes?.div ?? []), 'className'],
    span: [...(defaultSchema.attributes?.span ?? []), 'className', 'ariaHidden', 'aria-hidden'],
    details: ['className', 'open'],
    summary: ['className'],
    code: [...(defaultSchema.attributes?.code ?? []), ['className', /^language-/, 'math-inline', 'math-display']],
    pre: [...(defaultSchema.attributes?.pre ?? []), 'className'],
    input: [
      ['type', 'checkbox'],
      'checked',
      'disabled',
    ],
    math: ['xmlns', 'display'],
    annotation: ['encoding'],
    mfrac: ['linethickness'],
    mo: ['fence', 'stretchy', 'symmetric', 'lspace', 'rspace', 'movablelimits'],
    mspace: ['width', 'height', 'depth'],
    mtable: ['columnalign', 'rowspacing', 'columnspacing'],
    mtd: ['columnalign'],
  },
  protocols: {
    ...defaultSchema.protocols,
    href: ['http', 'https', 'mailto'],
    src: ['http', 'https'],
  },
};
