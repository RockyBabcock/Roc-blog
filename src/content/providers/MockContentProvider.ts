import { parseMarkdownDocument, sortPostsByDateDesc, toPostSummary } from '../parsers/frontmatter';
import { resolveRelativeAssetUrl } from '../parsers/markdown';
import { searchPostRecords } from '../search';
import type {
  BlogPost,
  BlogPostSummary,
  ContentSourceInfo,
  RawMarkdownSource,
  SearchResultItem,
} from '../types';
import type { ContentProvider } from './ContentProvider';

export const DEFAULT_MOCK_ASSET_MAP: Record<string, string> = {
  'content/assets/agent_architecture_cover.jpg':
    '/src/assets/images/agent_architecture_cover_1795501030217.jpg',
  'content/assets/agent_memory_studio.jpg':
    '/src/assets/images/agent_memory_studio_1795501030661.jpg',
  'content/assets/systems_architecture_cover.jpg':
    '/src/assets/images/systems_architecture_cover_1795501030700.jpg',
};

function discoverBundledMarkdownFixtures(): RawMarkdownSource[] {
  try {
    // Vite replaces this call at compile time with an eager map of raw Markdown files.
    // Under Node (unit tests), calling undefined throws and falls back cleanly to [].
    const modules = import.meta.glob('/content/posts/*.md', {
      query: '?raw',
      import: 'default',
      eager: true,
    }) as Record<string, string>;

    return Object.entries(modules).map(([pathKey, raw]) => ({
      filePath: pathKey.replace(/^\/+/, ''),
      raw,
    }));
  } catch {
    return [];
  }
}

export interface MockContentProviderOptions {
  sources?: RawMarkdownSource[];
  assetMap?: Record<string, string>;
}

export class MockContentProvider implements ContentProvider {
  private readonly sources: RawMarkdownSource[];
  private readonly assetMap: Record<string, string>;
  private cachedPosts: BlogPost[] | null = null;
  private parseWarnings: string[] = [];

  constructor(options?: MockContentProviderOptions) {
    this.sources = options?.sources ? [...options.sources] : discoverBundledMarkdownFixtures();
    this.assetMap = { ...DEFAULT_MOCK_ASSET_MAP, ...(options?.assetMap ?? {}) };
  }

  private loadAllPosts(): BlogPost[] {
    if (this.cachedPosts) {
      return this.cachedPosts;
    }

    const parsedPosts: BlogPost[] = [];
    this.parseWarnings = [];

    for (const source of this.sources) {
      if (!source.filePath.toLowerCase().endsWith('.md')) {
        continue;
      }

      try {
        const post = parseMarkdownDocument({
          filePath: source.filePath,
          raw: source.raw,
          assetMap: this.assetMap,
        });
        if (!post.draft) {
          parsedPosts.push(post);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.parseWarnings.push(`Skipped malformed markdown file "${source.filePath}": ${message}`);
      }
    }

    this.cachedPosts = sortPostsByDateDesc(parsedPosts);
    return this.cachedPosts;
  }

  getParseWarnings(): string[] {
    return [...this.parseWarnings];
  }

  async getPosts(): Promise<BlogPostSummary[]> {
    return this.loadAllPosts().map(toPostSummary);
  }

  async getPostBySlug(slug: string): Promise<BlogPost | null> {
    const normalized = slug.trim().toLowerCase();
    const matched = this.loadAllPosts().find((post) => post.slug.toLowerCase() === normalized);
    return matched ? { ...matched } : null;
  }

  async getCategories(): Promise<string[]> {
    const categories = new Set<string>();
    for (const post of this.loadAllPosts()) {
      for (const cat of post.categories) {
        categories.add(cat);
      }
    }
    return Array.from(categories);
  }

  async getTags(): Promise<string[]> {
    const tags = new Set<string>();
    for (const post of this.loadAllPosts()) {
      for (const tag of post.tags) {
        tags.add(tag);
      }
    }
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }

  async searchPosts(query: string): Promise<BlogPostSummary[]> {
    const detailed = await this.searchPostsDetailed(query);
    return detailed.map((item) => item.post);
  }

  async searchPostsDetailed(query: string): Promise<SearchResultItem[]> {
    const records = this.loadAllPosts().map((post) => ({
      summary: toPostSummary(post),
      bodyText: post.content,
    }));
    return searchPostRecords(records, query);
  }

  resolveAssetUrl(rawUrl: string, markdownFilePath: string): string {
    return resolveRelativeAssetUrl(rawUrl, markdownFilePath, undefined, this.assetMap);
  }

  getSourceInfo(): ContentSourceInfo {
    return {
      mode: 'mock',
      label: 'Local Markdown Fixtures',
      postsPath: 'content/posts',
    };
  }

  async refresh(): Promise<void> {
    this.cachedPosts = null;
    this.loadAllPosts();
  }
}
