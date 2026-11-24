import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { BlogShell } from '../../components/layout/BlogShell';
import { siteConfig } from '../../config/site.config';
import { useBlog } from '../../context/BlogContext';

export function AboutPage() {
  const { sourceInfo, posts } = useBlog();

  useEffect(() => {
    document.title = `About — ${siteConfig.title}`;
  }, []);

  return (
    <BlogShell>
      <article className="animate-page-enter mx-auto max-w-[68ch] space-y-8">
        <header className="space-y-3 border-b border-[var(--border-hairline)] pb-7">
          <h1 className="font-editorial text-[2.1rem] font-medium leading-[1.2] tracking-[-0.02em] text-[var(--text-primary)] sm:text-[2.45rem]">
            {siteConfig.about.heading}
          </h1>
          <p className="text-[1.02rem] leading-[1.72] text-[var(--text-secondary)]">
            {siteConfig.about.lead}
          </p>
        </header>

        <section className="space-y-5 text-[0.98rem] leading-[1.82] text-[var(--text-primary)]">
          {siteConfig.about.paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </section>

        <section className="space-y-4 border-t border-[var(--border-hairline)] pt-7">
          <h2 className="font-editorial text-[1.45rem] font-medium text-[var(--text-primary)]">
            Editorial Architecture
          </h2>
          <div className="divide-y divide-[var(--border-hairline)] rounded-[10px] border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
            {siteConfig.about.principles.map((item) => (
              <div key={item.title} className="p-5">
                <h3 className="font-editorial text-[1.1rem] font-medium text-[var(--text-primary)]">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-[0.88rem] leading-relaxed text-[var(--text-secondary)]">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[10px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 text-[0.86rem] text-[var(--text-secondary)]">
          <h2 className="font-medium text-[var(--text-primary)]">Content Provider Configuration</h2>
          <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-[var(--text-muted)]">Active Provider</dt>
              <dd className="mt-0.5 font-medium text-[var(--text-primary)]">
                {sourceInfo.mode === 'github' ? 'GitHub Markdown Repository' : 'Local Markdown Fixtures'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--text-muted)]">Published Articles</dt>
              <dd className="tabular-nums mt-0.5 font-medium text-[var(--text-primary)]">
                {posts.length}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--text-muted)]">Source Path</dt>
              <dd className="font-code mt-0.5 text-xs text-[var(--text-primary)]">
                {sourceInfo.repoSlug
                  ? `${sourceInfo.repoSlug}@${sourceInfo.branch}/${sourceInfo.postsPath}`
                  : sourceInfo.postsPath}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs leading-relaxed text-[var(--text-muted)]">
            Configure <code className="font-code">VITE_GITHUB_OWNER</code> and{' '}
            <code className="font-code">VITE_GITHUB_REPO</code> to switch automatically to any public GitHub content repository.
          </p>
        </section>

        <div className="flex flex-wrap items-center gap-5 pt-2 text-[0.88rem]">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]"
          >
            <span>Browse recent articles</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            to="/archives"
            className="text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]"
          >
            Explore archives
          </Link>
        </div>
      </article>
    </BlogShell>
  );
}
