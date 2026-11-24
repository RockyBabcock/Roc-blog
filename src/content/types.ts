export interface BlogPostSummary {
  slug: string;
  filePath: string;
  title: string;
  description: string;
  date: string;
  updated?: string;
  categories: string[];
  tags: string[];
  cover?: string;
  readingTime: number;
  excerpt?: string;
  draft: boolean;
  pinned: boolean;
}

export interface BlogPost extends BlogPostSummary {
  content: string;
}

export interface TocHeading {
  id: string;
  text: string;
  level: 1 | 2 | 3 | 4;
}

export interface CategoryStats {
  name: string;
  count: number;
  description: string;
}

export interface TagStats {
  name: string;
  count: number;
}

export interface ArchiveMonthGroup {
  monthKey: string;
  monthLabel: string;
  posts: BlogPostSummary[];
}

export interface ArchiveYearGroup {
  year: string;
  count: number;
  months: ArchiveMonthGroup[];
}

export interface SearchResultItem {
  post: BlogPostSummary;
  score: number;
  matchedFields: Array<'title' | 'description' | 'category' | 'tag' | 'content'>;
  snippet: string;
}

export interface RawMarkdownSource {
  filePath: string;
  raw: string;
}

export interface ContentSourceInfo {
  mode: 'github' | 'mock';
  label: string;
  repoSlug?: string;
  branch?: string;
  postsPath?: string;
}
