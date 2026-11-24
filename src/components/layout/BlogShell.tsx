import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { siteConfig } from '../../config/site.config';
import { useBlog } from '../../context/BlogContext';
import { MobileHeader } from '../navigation/MobileHeader';
import { LeftSidebar } from '../sidebar/LeftSidebar';
import { RightSidebar } from '../sidebar/RightSidebar';
import { SearchDialog } from '../search/SearchDialog';
import { RssModal } from '../widgets/RssModal';
import { BackToTop } from '../widgets/BackToTop';

interface BlogShellProps {
  children: React.ReactNode;
  rightSidebar?: React.ReactNode;
  hideRightSidebar?: boolean;
}

export function BlogShell({
  children,
  rightSidebar,
  hideRightSidebar = false,
}: BlogShellProps) {
  const { isMobileDrawerOpen, closeMobileDrawer, openRss } = useBlog();

  // Close mobile drawer on Escape
  useEffect(() => {
    if (!isMobileDrawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMobileDrawer();
      }
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isMobileDrawerOpen, closeMobileDrawer]);

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)]">
      {/* Mobile Header */}
      <MobileHeader />

      {/* Mobile Slide-in Navigation Drawer */}
      {isMobileDrawerOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
        >
          <div
            className="animate-backdrop-fade fixed inset-0 bg-black/45 backdrop-blur-[1px]"
            onClick={closeMobileDrawer}
          />
          <aside className="quiet-scroll relative z-10 h-full w-[290px] max-w-[85vw] overflow-y-auto border-r border-[var(--border-hairline)] bg-[var(--bg-page)] shadow-2xl">
            <LeftSidebar onNavigate={closeMobileDrawer} showCloseButton />
          </aside>
        </div>
      )}

      {/* Stellar Three-Column Shell */}
      <div className="stellar-shell flex min-h-screen items-start">
        {/* Persistent Desktop Left Sidebar */}
        <aside
          aria-label="Blog sidebar"
          className="quiet-scroll sticky top-0 hidden h-screen w-[262px] shrink-0 overflow-y-auto border-r border-[var(--border-hairline)] lg:block"
        >
          <LeftSidebar />
        </aside>

        {/* Main Reading Column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="mx-auto w-full max-w-[820px] flex-1 px-5 py-7 sm:px-8 sm:py-10 lg:px-10">
            {children}
          </main>

          <footer className="mx-auto mt-12 w-full max-w-[820px] border-t border-[var(--border-hairline)] px-5 py-7 text-[0.78rem] text-[var(--text-muted)] sm:px-8 lg:px-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p>{siteConfig.footerNote}</p>
              <div className="flex flex-wrap items-center gap-4">
                <Link to="/archives" className="transition-colors hover:text-[var(--accent)]">
                  Archives
                </Link>
                <button
                  type="button"
                  onClick={openRss}
                  className="transition-colors hover:text-[var(--accent)]"
                >
                  RSS
                </button>
                <Link to="/about" className="transition-colors hover:text-[var(--accent)]">
                  About
                </Link>
              </div>
            </div>
          </footer>
        </div>

        {/* Contextual Desktop Right Sidebar */}
        {!hideRightSidebar && (
          <aside
            aria-label="Contextual sidebar"
            className="quiet-scroll sticky top-0 hidden h-screen w-[244px] shrink-0 overflow-y-auto border-l border-[var(--border-hairline)] xl:block"
          >
            {rightSidebar ?? <RightSidebar />}
          </aside>
        )}
      </div>

      <SearchDialog />
      <RssModal />
      <BackToTop />
    </div>
  );
}
