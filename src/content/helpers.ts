import { CANONICAL_CATEGORIES, getCategoryDescription, siteConfig } from '../config/site.config';
import type { ArchiveYearGroup, BlogPostSummary, CategoryStats, TagStats } from './types';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function formatDisplayDate(dateStr: string): string {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    return dateStr;
  }
  const year = Number(match[1]);
  const monthIdx = Number(match[2]) - 1;
  const day = Number(match[3]);
  const monthName = MONTH_NAMES[monthIdx];
  if (!monthName) return dateStr;
  return `${monthName.slice(0, 3)} ${day}, ${year}`;
}

export function buildCategoryStats(posts: BlogPostSummary[]): CategoryStats[] {
  const counts = new Map<string, number>();

  for (const canonical of CANONICAL_CATEGORIES) {
    counts.set(canonical.name, 0);
  }

  for (const post of posts) {
    for (const category of post.categories) {
      counts.set(category, (counts.get(category) ?? 0) + 1);
    }
  }

  const ordered: CategoryStats[] = [];
  const visited = new Set<string>();

  for (const canonical of CANONICAL_CATEGORIES) {
    visited.add(canonical.name);
    ordered.push({
      name: canonical.name,
      count: counts.get(canonical.name) ?? 0,
      description: canonical.description,
    });
  }

  for (const [name, count] of counts.entries()) {
    if (!visited.has(name)) {
      ordered.push({
        name,
        count,
        description: getCategoryDescription(name),
      });
    }
  }

  return ordered;
}

export function buildTagStats(posts: BlogPostSummary[]): TagStats[] {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.name.localeCompare(b.name);
    });
}

export function buildArchiveGroups(posts: BlogPostSummary[]): ArchiveYearGroup[] {
  const yearMap = new Map<string, Map<string, { label: string; posts: BlogPostSummary[] }>>();

  for (const post of posts) {
    const match = post.date.match(/^(\d{4})-(\d{2})/);
    const year = match ? match[1] : 'Undated';
    const monthNum = match ? match[2] : '00';
    const monthIdx = Number(monthNum) - 1;
    const monthLabel = MONTH_NAMES[monthIdx] ?? 'Other';

    if (!yearMap.has(year)) {
      yearMap.set(year, new Map());
    }
    const months = yearMap.get(year)!;
    if (!months.has(monthNum)) {
      months.set(monthNum, { label: monthLabel, posts: [] });
    }
    months.get(monthNum)!.posts.push(post);
  }

  return Array.from(yearMap.entries())
    .sort(([yearA], [yearB]) => yearB.localeCompare(yearA))
    .map(([year, monthsMap]) => {
      const months = Array.from(monthsMap.entries())
        .sort(([mA], [mB]) => mB.localeCompare(mA))
        .map(([monthKey, value]) => ({
          monthKey,
          monthLabel: value.label,
          posts: value.posts,
        }));

      const count = months.reduce((acc, item) => acc + item.posts.length, 0);
      return { year, count, months };
    });
}

export function getRelatedPosts(
  current: BlogPostSummary,
  allPosts: BlogPostSummary[],
  limit = 3
): BlogPostSummary[] {
  const currentCategories = new Set(current.categories.map((c) => c.toLowerCase()));
  const currentTags = new Set(current.tags.map((t) => t.toLowerCase()));

  return allPosts
    .filter((candidate) => candidate.slug !== current.slug)
    .map((candidate) => {
      let overlap = 0;
      for (const cat of candidate.categories) {
        if (currentCategories.has(cat.toLowerCase())) overlap += 3;
      }
      for (const tag of candidate.tags) {
        if (currentTags.has(tag.toLowerCase())) overlap += 2;
      }
      return { candidate, overlap };
    })
    .filter((entry) => entry.overlap > 0)
    .sort((a, b) => {
      if (b.overlap !== a.overlap) return b.overlap - a.overlap;
      return (Date.parse(b.candidate.date) || 0) - (Date.parse(a.candidate.date) || 0);
    })
    .slice(0, limit)
    .map((entry) => entry.candidate);
}

export function getAdjacentPosts(
  currentSlug: string,
  orderedPosts: BlogPostSummary[]
): { newer: BlogPostSummary | null; older: BlogPostSummary | null } {
  const index = orderedPosts.findIndex((post) => post.slug === currentSlug);
  if (index === -1) {
    return { newer: null, older: null };
  }
  return {
    newer: index > 0 ? orderedPosts[index - 1] : null,
    older: index < orderedPosts.length - 1 ? orderedPosts[index + 1] : null,
  };
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateRssXml(posts: BlogPostSummary[], origin?: string): string {
  const baseUrl = (origin || siteConfig.siteUrl).replace(/\/+$/, '');
  const items = posts
    .map((post) => {
      const link = `${baseUrl}/posts/${encodeURIComponent(post.slug)}`;
      const pubDate = new Date(post.date).toUTCString();
      const categoriesXml = post.categories
        .map((cat) => `      <category>${escapeXml(cat)}</category>`)
        .join('\n');

      return [
        '    <item>',
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${escapeXml(link)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
        `      <pubDate>${escapeXml(pubDate)}</pubDate>`,
        `      <description>${escapeXml(post.description)}</description>`,
        categoriesXml,
        '    </item>',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    '  <channel>',
    `    <title>${escapeXml(siteConfig.title)}</title>`,
    `    <link>${escapeXml(baseUrl)}</link>`,
    `    <description>${escapeXml(siteConfig.description)}</description>`,
    `    <language>${escapeXml(siteConfig.language)}</language>`,
    items,
    '  </channel>',
    '</rss>',
  ].join('\n');
}
