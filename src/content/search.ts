import type { BlogPostSummary, SearchResultItem } from './types';
import { stripMarkdownForPlainText } from './parsers/frontmatter';

export interface SearchablePostRecord {
  summary: BlogPostSummary;
  bodyText?: string;
}

export interface HighlightSegment {
  text: string;
  highlighted: boolean;
}

export function tokenizeQuery(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

function buildSnippet(
  summary: BlogPostSummary,
  bodyText: string | undefined,
  tokens: string[]
): string {
  const source = bodyText && bodyText.trim().length > 0 ? bodyText : summary.description;
  const lower = source.toLowerCase();

  let matchIndex = -1;
  for (const token of tokens) {
    const idx = lower.indexOf(token);
    if (idx !== -1 && (matchIndex === -1 || idx < matchIndex)) {
      matchIndex = idx;
    }
  }

  if (matchIndex === -1) {
    return summary.description.length > 160
      ? `${summary.description.slice(0, 157).trimEnd()}...`
      : summary.description;
  }

  const start = Math.max(0, matchIndex - 56);
  const end = Math.min(source.length, matchIndex + 124);
  const prefix = start > 0 ? '...' : '';
  const suffix = end < source.length ? '...' : '';
  return `${prefix}${source.slice(start, end).trim()}${suffix}`;
}

export function searchPostRecords(
  records: SearchablePostRecord[],
  query: string
): SearchResultItem[] {
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) {
    return [];
  }

  const results: SearchResultItem[] = [];

  for (const record of records) {
    const { summary, bodyText } = record;
    const titleLower = summary.title.toLowerCase();
    const descLower = summary.description.toLowerCase();
    const categoriesLower = summary.categories.join(' ').toLowerCase();
    const tagsLower = summary.tags.join(' ').toLowerCase();
    const plainBody = bodyText ? stripMarkdownForPlainText(bodyText) : '';
    const bodyLower = plainBody.toLowerCase();

    let score = 0;
    const matchedFields = new Set<'title' | 'description' | 'category' | 'tag' | 'content'>();
    let allTokensMatched = true;

    for (const token of tokens) {
      let tokenMatched = false;

      if (titleLower.includes(token)) {
        score += titleLower.startsWith(token) ? 14 : 10;
        matchedFields.add('title');
        tokenMatched = true;
      }
      if (tagsLower.includes(token)) {
        score += 7;
        matchedFields.add('tag');
        tokenMatched = true;
      }
      if (categoriesLower.includes(token)) {
        score += 6;
        matchedFields.add('category');
        tokenMatched = true;
      }
      if (descLower.includes(token)) {
        score += 4;
        matchedFields.add('description');
        tokenMatched = true;
      }
      if (bodyLower && bodyLower.includes(token)) {
        score += 2;
        matchedFields.add('content');
        tokenMatched = true;
      }

      if (!tokenMatched) {
        allTokensMatched = false;
      }
    }

    if (score > 0 && (allTokensMatched || tokens.length === 1)) {
      results.push({
        post: summary,
        score,
        matchedFields: Array.from(matchedFields),
        snippet: buildSnippet(summary, plainBody || summary.description, tokens),
      });
    }
  }

  return results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (Date.parse(b.post.date) || 0) - (Date.parse(a.post.date) || 0);
  });
}

export function highlightTextSegments(text: string, query: string): HighlightSegment[] {
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0 || !text) {
    return [{ text, highlighted: false }];
  }

  const escaped = tokens
    .map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .sort((a, b) => b.length - a.length);

  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(regex);

  return parts
    .filter((part) => part.length > 0)
    .map((part) => ({
      text: part,
      highlighted: tokens.includes(part.toLowerCase()),
    }));
}
