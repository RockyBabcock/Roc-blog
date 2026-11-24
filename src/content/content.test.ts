import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  calculateReadingTime,
  deriveSlugFromFilePath,
  parseMarkdownDocument,
} from './parsers/frontmatter';
import {
  extractTocHeadings,
  resolveRelativeAssetUrl,
  sanitizeUrl,
  transformCustomDirectives,
} from './parsers/markdown';
import { highlightTextSegments, searchPostRecords } from './search';
import { MockContentProvider } from './providers/MockContentProvider';
import { GitHubMarkdownProvider } from './providers/GitHubMarkdownProvider';
import {
  buildArchiveGroups,
  buildCategoryStats,
  buildTagStats,
  generateRssXml,
  getAdjacentPosts,
  getRelatedPosts,
} from './helpers';
import { resolveContentConfig } from '../config/content.config';

const POSTS_DIR = path.resolve(process.cwd(), 'content/posts');

function loadRealFixtures() {
  const files = fs.readdirSync(POSTS_DIR).filter((name) => name.endsWith('.md'));
  return files.map((name) => ({
    filePath: `content/posts/${name}`,
    raw: fs.readFileSync(path.join(POSTS_DIR, name), 'utf8'),
  }));
}

test('Front Matter parser handles exampleblog1.md metadata, slug, excerpt, and relative cover', () => {
  const raw = fs.readFileSync(path.join(POSTS_DIR, 'exampleblog1.md'), 'utf8');
  const post = parseMarkdownDocument({
    filePath: 'content/posts/exampleblog1.md',
    raw,
    assetMap: {
      'content/assets/agent_architecture_cover.jpg': '/src/assets/images/test_cover.jpg',
    },
  });

  assert.equal(post.slug, 'exampleblog1');
  assert.equal(
    post.title,
    'Understanding Modern AI Agents: Memory, Planning, and Tool Orchestration'
  );
  assert.equal(post.date, '2026-11-22');
  assert.equal(post.updated, '2026-11-23');
  assert.deepEqual(post.categories, ['AI & Deep Learning']);
  assert.equal(post.pinned, true);
  assert.equal(post.draft, false);
  assert.equal(post.cover, '/src/assets/images/test_cover.jpg');
  assert.ok(post.readingTime >= 3);
});

test('Front Matter parser derives slug from filename and supports <!-- more --> excerpt when description is missing', () => {
  const raw = `---
title: "Custom Excerpt Article"
date: "2026-11-01"
categories:
  - Engineering & Tutorials
---

Opening summary paragraph before the fold.

<!-- more -->

Detailed body text after the fold.
`;

  const post = parseMarkdownDocument({
    filePath: 'content/posts/derived-article-slug.md',
    raw,
  });

  assert.equal(post.slug, 'derived-article-slug');
  assert.equal(post.description, 'Opening summary paragraph before the fold.');
  assert.equal(post.updated, undefined);
  assert.equal(deriveSlugFromFilePath('content/posts/exampleblog1.md'), 'exampleblog1');
});

test('Bilingual reading time accounts for both English words and CJK characters', () => {
  const englishShort = 'Hello world '.repeat(50);
  const chineseLong = '人工智能系统架构设计需要清晰的边界与可验证的工具契约。'.repeat(40);
  assert.equal(calculateReadingTime(englishShort), 1);
  assert.ok(calculateReadingTime(chineseLong) >= 3);
});

test('TOC extractor ignores headings inside fenced code blocks and deduplicates IDs', () => {
  const markdown = `
## Overview

\`\`\`markdown
## Not A Heading
\`\`\`

### Details
### Details
#### Deep Note
`;
  const headings = extractTocHeadings(markdown);
  assert.deepEqual(headings, [
    { id: 'overview', text: 'Overview', level: 2 },
    { id: 'details', text: 'Details', level: 3 },
    { id: 'details-1', text: 'Details', level: 3 },
    { id: 'deep-note', text: 'Deep Note', level: 4 },
  ]);
});

test('Custom directive transformer converts note, tip, warning, and details safely without touching code fences', () => {
  const markdown = `:::note{title="Heads Up"}
Important point here.
:::

\`\`\`markdown
:::warning{title="Literal"}
Stay untouched inside code block
:::
\`\`\`

:::details{title="Expand"}
Hidden content.
:::`;

  const transformed = transformCustomDirectives(markdown);
  assert.match(transformed, /<aside class="md-callout" data-callout="note">/);
  assert.match(transformed, /<div class="md-callout-title">Heads Up<\/div>/);
  assert.match(transformed, /:::warning\{title="Literal"\}/);
  assert.match(transformed, /<details class="md-details"><summary>Expand<\/summary>/);
});

test('Relative asset resolution and URL sanitization block dangerous schemes', () => {
  const resolved = resolveRelativeAssetUrl(
    '../assets/diagram.webp',
    'content/posts/exampleblog1.md',
    'https://raw.githubusercontent.com/rocky/blog/main'
  );
  assert.equal(
    resolved,
    'https://raw.githubusercontent.com/rocky/blog/main/content/assets/diagram.webp'
  );

  assert.equal(sanitizeUrl('javascript:alert(1)'), '');
  assert.equal(sanitizeUrl('data:text/html,<script>alert(1)</script>'), '');
  assert.equal(sanitizeUrl('https://example.com/article'), 'https://example.com/article');
  assert.equal(sanitizeUrl('/posts/exampleblog1', { allowRelative: true }), '/posts/exampleblog1');
});

test('MockContentProvider loads fixtures, excludes drafts, tolerates malformed files, and auto-discovers added articles', async () => {
  const fixtures = loadRealFixtures();
  const malformed = {
    filePath: 'content/posts/broken-yaml.md',
    raw: `---\ntitle: "Unclosed quote\ncategories: [unterminated\n---\nBody`,
  };
  const addedArticle = {
    filePath: 'content/posts/exampleblog2.md',
    raw: `---
title: "Second Automatically Discovered Article"
date: "2026-11-23"
description: "Verifies that adding a new Markdown file appears automatically."
categories:
  - AI & Deep Learning
tags:
  - Verification
draft: false
---

Body of second article.
`,
  };

  const provider = new MockContentProvider({
    sources: [...fixtures, malformed, addedArticle],
  });

  const posts = await provider.getPosts();
  // Draft excluded, malformed skipped, exampleblog1 + exampleblog2 + 4 other valid posts included
  assert.ok(posts.some((p) => p.slug === 'exampleblog1'));
  assert.ok(posts.some((p) => p.slug === 'exampleblog2'));
  assert.ok(!posts.some((p) => p.slug === 'unpublished-draft-notes'));
  assert.equal(provider.getParseWarnings().length, 1);

  // Sorted newest first
  assert.equal(posts[0].slug, 'exampleblog2');
  assert.equal(posts[1].slug, 'exampleblog1');

  const fullPost = await provider.getPostBySlug('exampleblog1');
  assert.ok(fullPost);
  assert.match(fullPost.content, /Layered Memory Architecture/);

  const searchHits = await provider.searchPosts('quantization');
  assert.equal(searchHits.length, 1);
  assert.equal(searchHits[0].slug, 'kv-cache-quantization-benchmarks');

  const catStats = buildCategoryStats(posts);
  const aiStat = catStats.find((c) => c.name === 'AI & Deep Learning');
  assert.equal(aiStat?.count, 2);

  const tagStats = buildTagStats(posts);
  assert.ok(tagStats.some((t) => t.name === 'LLM' && t.count >= 2));

  const archives = buildArchiveGroups(posts);
  assert.equal(archives[0].year, '2026');
  assert.equal(archives[1].year, '2025');

  const related = getRelatedPosts(posts[1], posts, 3);
  assert.ok(related.length >= 1);

  const adjacent = getAdjacentPosts('exampleblog1', posts);
  assert.equal(adjacent.newer?.slug, 'exampleblog2');
  assert.ok(adjacent.older !== null);

  const rss = generateRssXml(posts, 'https://rocky.blog');
  assert.match(rss, /<rss version="2.0">/);
  assert.match(rss, /Understanding Modern AI Agents/);
});

test('GitHubMarkdownProvider discovers .md files, ignores non-markdown, skips malformed files, and resolves relative assets', async () => {
  const sampleMd = `---
title: "Remote GitHub Essay"
date: "2026-11-20"
description: "Loaded from mocked GitHub Contents API."
categories:
  - Engineering & Tutorials
tags:
  - GitHub
cover: "../assets/remote-cover.webp"
---

Hello from GitHub!
`;

  const malformedMd = `---\ntitle: [broken\n---\nOops`;

  const mockFetch: typeof fetch = async (input) => {
    const url = String(input);
    if (url.includes('api.github.com/repos/octo/journal/contents/content/posts?ref=main')) {
      return new Response(
        JSON.stringify([
          {
            type: 'file',
            name: 'remote-essay.md',
            path: 'content/posts/remote-essay.md',
            download_url: 'https://raw.githubusercontent.com/octo/journal/main/content/posts/remote-essay.md',
          },
          {
            type: 'file',
            name: 'broken.md',
            path: 'content/posts/broken.md',
            download_url: 'https://raw.githubusercontent.com/octo/journal/main/content/posts/broken.md',
          },
          {
            type: 'file',
            name: 'README.txt',
            path: 'content/posts/README.txt',
            download_url: 'https://raw.githubusercontent.com/octo/journal/main/content/posts/README.txt',
          },
        ]),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (url.endsWith('remote-essay.md')) {
      return new Response(sampleMd, { status: 200 });
    }
    if (url.endsWith('broken.md')) {
      return new Response(malformedMd, { status: 200 });
    }
    return new Response('Not Found', { status: 404 });
  };

  const provider = new GitHubMarkdownProvider({
    config: {
      owner: 'octo',
      repo: 'journal',
      branch: 'main',
      postsPath: 'content/posts',
      assetsPath: 'content/assets',
    },
    fetchImpl: mockFetch,
    maxRetries: 0,
  });

  const posts = await provider.getPosts();
  assert.equal(posts.length, 1);
  assert.equal(posts[0].slug, 'remote-essay');
  assert.equal(
    posts[0].cover,
    'https://raw.githubusercontent.com/octo/journal/main/content/assets/remote-cover.webp'
  );
  assert.equal(provider.getParseWarnings().length, 1);

  const inlineAsset = provider.resolveAssetUrl(
    '../assets/fig1.png',
    'content/posts/remote-essay.md'
  );
  assert.equal(
    inlineAsset,
    'https://raw.githubusercontent.com/octo/journal/main/content/assets/fig1.png'
  );
});

test('Content config switches cleanly between mock and github modes', () => {
  const mockCfg = resolveContentConfig({ owner: '', repo: '' });
  assert.equal(mockCfg.mode, 'mock');

  const githubCfg = resolveContentConfig({
    owner: 'rocky-dev',
    repo: 'journal-content',
    branch: 'main',
  });
  assert.equal(githubCfg.mode, 'github');
  assert.equal(githubCfg.github.owner, 'rocky-dev');
});

test('Search highlighter segments matched terms accurately', () => {
  const segments = highlightTextSegments('Understanding Modern AI Agents', 'agent');
  assert.ok(segments.some((seg) => seg.highlighted && seg.text.toLowerCase() === 'agent'));

  const hits = searchPostRecords(
    [
      {
        summary: {
          slug: 'a',
          filePath: 'content/posts/a.md',
          title: 'Memory Architecture',
          description: 'Episodic traces',
          date: '2026-11-20',
          categories: ['AI & Deep Learning'],
          tags: ['Agents'],
          readingTime: 4,
          draft: false,
          pinned: false,
        },
        bodyText: 'Structured tool loops and bounded planning.',
      },
    ],
    'bounded'
  );
  assert.equal(hits.length, 1);
  assert.ok(hits[0].matchedFields.includes('content'));
});
