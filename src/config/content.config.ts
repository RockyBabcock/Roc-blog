export interface GitHubContentConfig {
  owner: string;
  repo: string;
  branch: string;
  postsPath: string;
  assetsPath: string;
  proxyBaseUrl?: string;
}

export interface ContentSourceConfig {
  mode: 'github' | 'mock';
  github: GitHubContentConfig;
  cacheTtlMs: number;
}

function readEnvValue(key: string): string {
  // Support both Vite (import.meta.env) and Node test runner (process.env)
  const metaEnv =
    typeof import.meta !== 'undefined' && (import.meta as { env?: Record<string, string | undefined> }).env
      ? (import.meta as { env: Record<string, string | undefined> }).env
      : undefined;

  const value = metaEnv?.[key] ?? (typeof process !== 'undefined' ? process.env?.[key] : undefined);
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeRepoPath(pathValue: string, fallback: string): string {
  const cleaned = (pathValue || fallback).replace(/^\/+|\/+$/g, '');
  return cleaned || fallback;
}

export function resolveContentConfig(
  overrides?: Partial<GitHubContentConfig>
): ContentSourceConfig {
  const owner = (overrides?.owner ?? readEnvValue('VITE_GITHUB_OWNER')).trim();
  const repo = (overrides?.repo ?? readEnvValue('VITE_GITHUB_REPO')).trim();
  const branch = (overrides?.branch ?? readEnvValue('VITE_GITHUB_BRANCH')).trim() || 'main';
  const postsPath = normalizeRepoPath(
    overrides?.postsPath ?? readEnvValue('VITE_GITHUB_POSTS_PATH'),
    'content/posts'
  );
  const assetsPath = normalizeRepoPath(
    overrides?.assetsPath ?? readEnvValue('VITE_GITHUB_ASSETS_PATH'),
    'content/assets'
  );
  const proxyBaseUrl = (overrides?.proxyBaseUrl ?? readEnvValue('VITE_CONTENT_PROXY_URL')).trim() || undefined;

  const hasValidGitHubConfig = Boolean(owner && repo);

  return {
    mode: hasValidGitHubConfig ? 'github' : 'mock',
    github: {
      owner,
      repo,
      branch,
      postsPath,
      assetsPath,
      proxyBaseUrl,
    },
    cacheTtlMs: 5 * 60 * 1000,
  };
}

export const contentConfig: ContentSourceConfig = resolveContentConfig();
