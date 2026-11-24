import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { buildCategoryStats, buildTagStats } from '../content/helpers';
import { defaultContentProvider, type ContentProvider } from '../content/providers';
import type {
  BlogPost,
  BlogPostSummary,
  CategoryStats,
  ContentSourceInfo,
  SearchResultItem,
  TagStats,
} from '../content/types';

export type ThemeMode = 'light' | 'dark';

interface BlogContextValue {
  posts: BlogPostSummary[];
  categories: CategoryStats[];
  tags: TagStats[];
  loading: boolean;
  error: string | null;
  sourceInfo: ContentSourceInfo;
  refresh: () => Promise<void>;
  getPostBySlug: (slug: string) => Promise<BlogPost | null>;
  searchDetailed: (query: string) => Promise<SearchResultItem[]>;
  resolveAssetUrl: (rawUrl: string, filePath: string) => string;

  theme: ThemeMode;
  toggleTheme: () => void;

  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;

  isRssOpen: boolean;
  openRss: () => void;
  closeRss: () => void;

  isMobileDrawerOpen: boolean;
  openMobileDrawer: () => void;
  closeMobileDrawer: () => void;
}

const BlogContext = createContext<BlogContextValue | null>(null);

const THEME_STORAGE_KEY = 'rocky-journal-theme';

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
    if (document.documentElement.classList.contains('dark')) {
      return 'dark';
    }
  } catch {
    // Ignore storage access errors in restricted frames
  }
  return 'light';
}

export function BlogProvider({
  children,
  provider = defaultContentProvider,
}: {
  children: React.ReactNode;
  provider?: ContentProvider;
}) {
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isRssOpen, setIsRssOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const postCacheRef = useRef<Map<string, BlogPost>>(new Map());

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const summaries = await provider.getPosts();
      setPosts(summaries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load articles.');
    } finally {
      setLoading(false);
    }
  }, [provider]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  // Sync theme class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage access issues
    }
  }, [theme]);

  // Global Ctrl+K / Cmd+K shortcut for search dialog
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const refresh = useCallback(async () => {
    postCacheRef.current.clear();
    await provider.refresh();
    await loadPosts();
  }, [provider, loadPosts]);

  const getPostBySlug = useCallback(
    async (slug: string): Promise<BlogPost | null> => {
      const key = slug.trim().toLowerCase();
      if (postCacheRef.current.has(key)) {
        return postCacheRef.current.get(key)!;
      }
      const post = await provider.getPostBySlug(slug);
      if (post) {
        postCacheRef.current.set(key, post);
      }
      return post;
    },
    [provider]
  );

  const searchDetailed = useCallback(
    async (query: string): Promise<SearchResultItem[]> => {
      if (provider.searchPostsDetailed) {
        return provider.searchPostsDetailed(query);
      }
      const summaries = await provider.searchPosts(query);
      return summaries.map((post) => ({
        post,
        score: 1,
        matchedFields: ['title'],
        snippet: post.description,
      }));
    },
    [provider]
  );

  const resolveAssetUrl = useCallback(
    (rawUrl: string, filePath: string) => provider.resolveAssetUrl(rawUrl, filePath),
    [provider]
  );

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const categories = useMemo(() => buildCategoryStats(posts), [posts]);
  const tags = useMemo(() => buildTagStats(posts), [posts]);
  const sourceInfo = useMemo(() => provider.getSourceInfo(), [provider]);

  const value = useMemo<BlogContextValue>(
    () => ({
      posts,
      categories,
      tags,
      loading,
      error,
      sourceInfo,
      refresh,
      getPostBySlug,
      searchDetailed,
      resolveAssetUrl,
      theme,
      toggleTheme,
      isSearchOpen,
      openSearch: () => setIsSearchOpen(true),
      closeSearch: () => setIsSearchOpen(false),
      isRssOpen,
      openRss: () => setIsRssOpen(true),
      closeRss: () => setIsRssOpen(false),
      isMobileDrawerOpen,
      openMobileDrawer: () => setIsMobileDrawerOpen(true),
      closeMobileDrawer: () => setIsMobileDrawerOpen(false),
    }),
    [
      posts,
      categories,
      tags,
      loading,
      error,
      sourceInfo,
      refresh,
      getPostBySlug,
      searchDetailed,
      resolveAssetUrl,
      theme,
      toggleTheme,
      isSearchOpen,
      isRssOpen,
      isMobileDrawerOpen,
    ]
  );

  return <BlogContext.Provider value={value}>{children}</BlogContext.Provider>;
}

export function useBlog(): BlogContextValue {
  const ctx = useContext(BlogContext);
  if (!ctx) {
    throw new Error('useBlog must be used within a BlogProvider');
  }
  return ctx;
}
