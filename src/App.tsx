import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { BlogProvider } from './context/BlogContext';
import { HomePage } from './pages/Home/HomePage';
import { CategoriesPage } from './pages/Categories/CategoriesPage';
import { TagsPage } from './pages/Tags/TagsPage';
import { ArchivePage } from './pages/Archive/ArchivePage';
import { SearchPage } from './pages/Search/SearchPage';
import { AboutPage } from './pages/About/AboutPage';
import { NotFoundPage } from './pages/NotFound/NotFoundPage';
import { BlogShell } from './components/layout/BlogShell';
import { ArticleListSkeleton } from './components/widgets/StateViews';

// Code-split heavy Markdown/KaTeX/Shiki/Mermaid article detail bundle
const ArticleDetailPage = lazy(() =>
  import('./pages/ArticleDetail/ArticleDetailPage').then((mod) => ({
    default: mod.ArticleDetailPage,
  }))
);

function ScrollToTopOnNavigate() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <BlogProvider>
        <ScrollToTopOnNavigate />
        <Suspense
          fallback={
            <BlogShell>
              <ArticleListSkeleton />
            </BlogShell>
          }
        >
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/posts/:slug" element={<ArticleDetailPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/categories/:category" element={<CategoriesPage />} />
            <Route path="/tags" element={<TagsPage />} />
            <Route path="/tags/:tag" element={<TagsPage />} />
            <Route path="/archives" element={<ArchivePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BlogProvider>
    </BrowserRouter>
  );
}
