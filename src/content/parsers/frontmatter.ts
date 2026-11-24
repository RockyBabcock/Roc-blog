import { JSON_SCHEMA, load as loadYaml } from 'js-yaml';
import type { BlogPost, BlogPostSummary } from '../types';
import { resolveRelativeAssetUrl, sanitizeUrl } from './markdown';

export interface ParsedFrontMatter {
  title?: string;
  date?: string;
  updated?: string | null;
  description?: string;
  categories?: string[] | string;
  tags?: string[] | string;
  cover?: string | null;
  draft?: boolean;
  pinned?: boolean;
  slug?: string;
}

export interface ParseMarkdownOptions {
  filePath: string;
  raw: string;
  assetBaseUrl?: string;
  assetMap?: Record<string, string>;
}

const FRONT_MATTER_REGEX = /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;
const MORE_SEPARATOR_REGEX = /<!--\s*more\s*-->/i;

export function deriveSlugFromFilePath(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/');
  const fileName = normalized.split('/').pop() ?? 'untitled';
  const withoutExt = fileName.replace(/\.md$/i, '');
  const slug = withoutExt
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return slug || 'untitled';
}

export function sanitizeSlug(rawSlug: string, fallbackFilePath: string): string {
  const cleaned = rawSlug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return cleaned || deriveSlugFromFilePath(fallbackFilePath);
}

export function normalizeStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' || typeof item === 'number' ? String(item).trim() : ''))
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }
  return [];
}

export function normalizeDateString(value: unknown): string | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed;
      }
      return parsed.toISOString().slice(0, 10);
    }
    return trimmed;
  }
  return undefined;
}

export function stripMarkdownForPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/:::[\w-]+(?:\{[^}]*\})?|:::/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_~>-]+/g, ' ')
    .replace(/\$\$[\s\S]*?\$\$|\$[^$]+\$/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function calculateReadingTime(markdown: string): number {
  const plain = stripMarkdownForPlainText(markdown);
  if (!plain) return 1;

  const cjkMatches = plain.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g) ?? [];
  const cjkCount = cjkMatches.length;

  const nonCjkText = plain.replace(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g, ' ');
  const latinWords = nonCjkText
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 0).length;

  // Standard reading cadence: ~220 English words/min, ~320 CJK chars/min
  const minutes = latinWords / 220 + cjkCount / 320;
  return Math.max(1, Math.ceil(minutes));
}

export function extractExcerpt(body: string, description?: string): string {
  if (description && description.trim()) {
    return description.trim();
  }

  const moreMatch = MORE_SEPARATOR_REGEX.exec(body);
  if (moreMatch && moreMatch.index > 0) {
    const beforeMore = stripMarkdownForPlainText(body.slice(0, moreMatch.index));
    if (beforeMore) {
      return beforeMore;
    }
  }

  const plain = stripMarkdownForPlainText(body);
  if (plain.length <= 180) {
    return plain;
  }
  return `${plain.slice(0, 177).trimEnd()}...`;
}

function extractFallbackTitle(body: string, filePath: string): string {
  const headingMatch = body.match(/^#\s+(.+)$/m);
  if (headingMatch?.[1]) {
    return headingMatch[1].trim();
  }
  const stem = deriveSlugFromFilePath(filePath);
  return stem
    .split(/[-_]+/)
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : ''))
    .join(' ');
}

export function parseMarkdownDocument(options: ParseMarkdownOptions): BlogPost {
  const { filePath, raw, assetBaseUrl, assetMap } = options;

  if (typeof raw !== 'string') {
    throw new Error(`Invalid markdown source for ${filePath}`);
  }

  let data: ParsedFrontMatter = {};
  let body = raw;

  const match = raw.match(FRONT_MATTER_REGEX);
  if (match) {
    const yamlBlock = match[1];
    body = raw.slice(match[0].length);
    const parsed = loadYaml(yamlBlock, { schema: JSON_SCHEMA });
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      data = parsed as ParsedFrontMatter;
    } else if (parsed !== null && parsed !== undefined) {
      throw new Error(`Front matter in ${filePath} must be a YAML mapping`);
    }
  }

  const cleanedBody = body.trim();
  const title =
    typeof data.title === 'string' && data.title.trim()
      ? data.title.trim()
      : extractFallbackTitle(cleanedBody, filePath);

  const slug =
    typeof data.slug === 'string' && data.slug.trim()
      ? sanitizeSlug(data.slug, filePath)
      : deriveSlugFromFilePath(filePath);

  const date = normalizeDateString(data.date) ?? '1970-01-01';
  const updated = normalizeDateString(data.updated);
  const categories = normalizeStringList(data.categories);
  const tags = normalizeStringList(data.tags);

  const rawDescription = typeof data.description === 'string' ? data.description.trim() : '';
  const excerpt = extractExcerpt(cleanedBody, rawDescription);
  const description = rawDescription || excerpt;

  let resolvedCover: string | undefined;
  if (typeof data.cover === 'string' && data.cover.trim()) {
    const resolved = resolveRelativeAssetUrl(data.cover.trim(), filePath, assetBaseUrl, assetMap);
    resolvedCover = sanitizeUrl(resolved, { allowRelative: true }) || undefined;
  }

  const readingTime = calculateReadingTime(cleanedBody);
  const draft = Boolean(data.draft);
  const pinned = Boolean(data.pinned);

  return {
    slug,
    filePath,
    title,
    description,
    date,
    updated,
    categories,
    tags,
    cover: resolvedCover,
    readingTime,
    excerpt,
    draft,
    pinned,
    content: cleanedBody,
  };
}

export function toPostSummary(post: BlogPost): BlogPostSummary {
  const { content: _omitted, ...summary } = post;
  return summary;
}

export function sortPostsByDateDesc<T extends Pick<BlogPostSummary, 'date' | 'title'>>(
  posts: T[]
): T[] {
  return [...posts].sort((a, b) => {
    const timeA = Date.parse(a.date) || 0;
    const timeB = Date.parse(b.date) || 0;
    if (timeB !== timeA) {
      return timeB - timeA;
    }
    return a.title.localeCompare(b.title);
  });
}
