import { contentConfig, type ContentSourceConfig } from '../../config/content.config';
import type { ContentProvider } from './ContentProvider';
import { GitHubMarkdownProvider } from './GitHubMarkdownProvider';
import { MockContentProvider } from './MockContentProvider';

export type { ContentProvider } from './ContentProvider';
export { GitHubMarkdownProvider } from './GitHubMarkdownProvider';
export { MockContentProvider } from './MockContentProvider';

export function createContentProvider(config: ContentSourceConfig = contentConfig): ContentProvider {
  if (config.mode === 'github') {
    return new GitHubMarkdownProvider({
      config: config.github,
      cacheTtlMs: config.cacheTtlMs,
    });
  }
  return new MockContentProvider();
}

export const defaultContentProvider: ContentProvider = createContentProvider();
