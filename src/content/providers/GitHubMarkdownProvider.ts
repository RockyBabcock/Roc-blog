import type { GitHubContentConfig } from '../../config/content.config';
import { parseMarkdownDocument, sortPostsByDateDesc, toPostSummary } from '../parsers/frontmatter';
import { resolveRelativeAssetUrl } from '../parsers/markdown';
import { searchPostRecords } from '../search';
import type {
  BlogPost,
  BlogPostSummary,
  ContentSourceInfo,
  SearchResultItem,
} from '../types';
import type { ContentProvider } from './ContentProvider';

interface GitHubContentItem {
  type: 'file' | 'dir' | 'symlink' | 'submodule';
  name: string;
  path: string;
  sha?: string;
  download_url: string | null;
}

export interface GitHubMarkdownProviderOptions {
  config: GitHubContentConfig;
  cacheTtlMs?: number;
  fetchImpl?: typeof fetch;
  maxRetries?: number;
}

const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;
const FETCH_CONCURRENCY = 5;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class GitHubMarkdownProvider implements ContentProvider {
  private readonly config: GitHubContentConfig;
  private readonly cacheTtlMs: number;
  private readonly fetchImpl: typeof fetch;
  private readonly maxRetries: number;

  private cachedPosts: BlogPost[] | null = null;
  private cacheTimestamp = 0;
  private inflightPromise: Promise<BlogPost[]> | null = null;
  private parseWarnings: string[] = [];

  constructor(options: GitHubMarkdownProviderOptions) {
    this.config = options.config;
    this.cacheTtlMs = options.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
    this.maxRetries = options.maxRetries ?? 2;
  }

  private getRawAssetBaseUrl(): string {
    if (this.config.proxyBaseUrl) {
      return `${this.config.proxyBaseUrl.replace(/\/+$/, '')}/raw`;
    }
    const owner = encodeURIComponent(this.config.owner);
    const repo = encodeURIComponent(this.config.repo);
    const branch = encodeURIComponent(this.config.branch);
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}`;
  }

  private getContentsApiUrl(): string {
    const encodedPath = this.config.postsPath
      .split('/')
      .filter(Boolean)
      .map((segment) => encodeURIComponent(segment))
      .join('/');

    if (this.config.proxyBaseUrl) {
      return `${this.config.proxyBaseUrl.replace(/\/+$/, '')}/contents/${encodedPath}?ref=${encodeURIComponent(this.config.branch)}`;
    }

    const owner = encodeURIComponent(this.config.owner);
    const repo = encodeURIComponent(this.config.repo);
    const ref = encodeURIComponent(this.config.branch);
    return `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}?ref=${ref}`;
  }

  private async fetchWithRetry(url: string, acceptHeader?: string): Promise<Response> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const headers: Record<string, string> = {};
        if (acceptHeader) {
          headers.Accept = acceptHeader;
        }
        const response = await this.fetchImpl(url, { headers });
        if (response.ok) {
          return response;
        }
        // Retry transient 5xx or rate-limit 429 responses; do not retry 404/403
        if ((response.status >= 500 || response.status === 429) && attempt < this.maxRetries) {
          await sleep(250 * (attempt + 1));
          continue;
        }
        throw new Error(`GitHub request failed (${response.status} ${response.statusText}) for ${url}`);
      } catch (error) {
        lastError = error;
        if (attempt < this.maxRetries) {
          await sleep(250 * (attempt + 1));
          continue;
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Failed to fetch from GitHub');
  }

  private isCacheFresh(): boolean {
    return this.cachedPosts !== null && Date.now() - this.cacheTimestamp < this.cacheTtlMs;
  }

  private async fetchAllPosts(force = false): Promise<BlogPost[]> {
    if (!force && this.isCacheFresh() && this.cachedPosts) {
      return this.cachedPosts;
    }

    if (!force && this.inflightPromise) {
      return this.inflightPromise;
    }

    const loader = (async () => {
      const listingResponse = await this.fetchWithRetry(
        this.getContentsApiUrl(),
        'application/vnd.github.v3+json'
      );
      const listingData = (await listingResponse.json()) as unknown;

      if (!Array.isArray(listingData)) {
        throw new Error(
          `Expected directory listing at "${this.config.postsPath}", received non-array payload.`
        );
      }

      const markdownFiles = (listingData as GitHubContentItem[]).filter(
        (item) =>
          item &&
          item.type === 'file' &&
          typeof item.name === 'string' &&
          item.name.toLowerCase().endsWith('.md') &&
          typeof item.path === 'string'
      );

      const assetBaseUrl = this.getRawAssetBaseUrl();
      const parsedPosts: BlogPost[] = [];
      this.parseWarnings = [];

      // Process in bounded batches to stay polite with public GitHub limits
      for (let i = 0; i < markdownFiles.length; i += FETCH_CONCURRENCY) {
        const batch = markdownFiles.slice(i, i + FETCH_CONCURRENCY);
        const batchResults = await Promise.all(
          batch.map(async (file) => {
            const downloadUrl =
              file.download_url ||
              `${assetBaseUrl}/${file.path
                .split('/')
                .map((seg) => encodeURIComponent(seg))
                .join('/')}`;

            try {
              const fileResponse = await this.fetchWithRetry(downloadUrl);
              const rawMarkdown = await fileResponse.text();
              const parsed = parseMarkdownDocument({
                filePath: file.path,
                raw: rawMarkdown,
                assetBaseUrl,
              });
              return parsed.draft ? null : parsed;
            } catch (error) {
              const reason = error instanceof Error ? error.message : String(error);
              this.parseWarnings.push(`Skipped "${file.path}": ${reason}`);
              return null;
            }
          })
        );

        for (const item of batchResults) {
          if (item) {
            parsedPosts.push(item);
          }
        }
      }

      const sorted = sortPostsByDateDesc(parsedPosts);
      this.cachedPosts = sorted;
      this.cacheTimestamp = Date.now();
      return sorted;
    })();

    this.inflightPromise = loader;
    try {
      return await loader;
    } finally {
      this.inflightPromise = null;
    }
  }

  getParseWarnings(): string[] {
    return [...this.parseWarnings];
  }

  async getPosts(): Promise<BlogPostSummary[]> {
    const posts = await this.fetchAllPosts();
    return posts.map(toPostSummary);
  }

  async getPostBySlug(slug: string): Promise<BlogPost | null> {
    const normalized = slug.trim().toLowerCase();
    const posts = await this.fetchAllPosts();
    const found = posts.find((post) => post.slug.toLowerCase() === normalized);
    return found ? { ...found } : null;
  }

  async getCategories(): Promise<string[]> {
    const posts = await this.fetchAllPosts();
    const categories = new Set<string>();
    for (const post of posts) {
      for (const category of post.categories) {
        categories.add(category);
      }
    }
    return Array.from(categories);
  }

  async getTags(): Promise<string[]> {
    const posts = await this.fetchAllPosts();
    const tags = new Set<string>();
    for (const post of posts) {
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
    const posts = await this.fetchAllPosts();
    const records = posts.map((post) => ({
      summary: toPostSummary(post),
      bodyText: post.content,
    }));
    return searchPostRecords(records, query);
  }

  resolveAssetUrl(rawUrl: string, markdownFilePath: string): string {
    return resolveRelativeAssetUrl(rawUrl, markdownFilePath, this.getRawAssetBaseUrl());
  }

  getSourceInfo(): ContentSourceInfo {
    return {
      mode: 'github',
      label: `${this.config.owner}/${this.config.repo}`,
      repoSlug: `${this.config.owner}/${this.config.repo}`,
      branch: this.config.branch,
      postsPath: this.config.postsPath,
    };
  }

  async refresh(): Promise<void> {
    this.cachedPosts = null;
    this.cacheTimestamp = 0;
    await this.fetchAllPosts(true);
  }
}
