import type { BlogPost, BlogPostSummary, ContentSourceInfo, SearchResultItem } from '../types';

export interface ContentProvider {
  getPosts(): Promise<BlogPostSummary[]>;

  getPostBySlug(slug: string): Promise<BlogPost | null>;

  getCategories(): Promise<string[]>;

  getTags(): Promise<string[]>;

  searchPosts(query: string): Promise<BlogPostSummary[]>;

  searchPostsDetailed?(query: string): Promise<SearchResultItem[]>;

  resolveAssetUrl(rawUrl: string, markdownFilePath: string): string;

  getSourceInfo(): ContentSourceInfo;

  refresh(): Promise<void>;
}
