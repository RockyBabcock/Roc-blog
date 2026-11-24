# Rocky Journal — Content Authoring Specification

This specification defines the exact repository layout, YAML Front Matter contract, Markdown features, and asset resolution rules required for automated publishing (e.g., via Codex) to **Rocky Journal**.

## 1. Repository Directory Layout

The frontend reads Markdown articles from a configured public GitHub repository (via `VITE_GITHUB_OWNER`, `VITE_GITHUB_REPO`, `VITE_GITHUB_BRANCH`, `VITE_GITHUB_POSTS_PATH`, and `VITE_GITHUB_ASSETS_PATH`).

```text
<repo-root>/
└── content/
    ├── posts/
    │   ├── exampleblog1.md
    │   └── my-next-article.md
    └── assets/
        ├── ai-agent-cover.webp
        └── figure-01.png
```

- Only files ending in `.md` inside `VITE_GITHUB_POSTS_PATH` (default: `content/posts`) are indexed.
- Non-Markdown files in the posts folder are ignored.
- One malformed file will never crash the site; it is safely skipped while valid articles continue to render.

---

## 2. YAML Front Matter Contract

Every article should start with a YAML Front Matter block delimited by `---`:

```yaml
---
title: "Understanding Modern AI Agents"
date: "2026-11-24"
updated: null
description: "A practical exploration of AI agent architecture."
categories:
  - AI & Deep Learning
tags:
  - LLM
  - AI Agents
  - Architecture
cover: "../assets/ai-agent-cover.webp"
draft: false
pinned: false
slug: "understanding-modern-ai-agents"
---
```

### Field Reference

| Field | Type | Required | Behavior / Default |
| :--- | :--- | :--- | :--- |
| `title` | `string` | Recommended | Displayed as article H1 and listing title. Falls back to the first `# H1` or formatted filename if omitted. |
| `date` | `YYYY-MM-DD` | Recommended | Primary publication date used for descending sort and archive grouping (`Year / Month`). |
| `updated` | `YYYY-MM-DD \| null` | Optional | Rendered alongside publication date when provided. |
| `description` | `string` | Recommended | Used as article lead and listing summary. Falls back to `<!-- more -->` excerpt or first ~180 plain-text characters. |
| `categories` | `string[]` | Recommended | Prefer one of the five canonical categories below. |
| `tags` | `string[]` | Optional | Automatically populates the Tags index and related articles matching. |
| `cover` | `string \| null` | Optional | Relative path from the Markdown file (e.g., `../assets/cover.webp`) or absolute `https://` URL. |
| `draft` | `boolean` | Optional | Defaults to `false`. When `true`, the article is excluded from all public views and search. |
| `pinned` | `boolean` | Optional | Defaults to `false`. Pinned articles are highlighted in the Featured / Pinned slot on the homepage. |
| `slug` | `string` | Optional | Determines the route `/posts/:slug`. When omitted, automatically derived from the filename (e.g., `exampleblog1.md` -> `/posts/exampleblog1`). |

### Canonical Categories

Use these exact strings so articles map cleanly to sidebar navigation:

1. `AI & Deep Learning`
2. `Web3 & Blockchain`
3. `Engineering & Tutorials`
4. `Personal Essays & Thoughts`
5. `Research & Experiments`

*(Additional custom category names are also supported dynamically and will appear on `/categories` automatically.)*

---

## 3. Supported Markdown Features

The renderer supports standard CommonMark, GitHub Flavored Markdown (GFM), math, diagrams, and four explicit container directives:

- **Headings (`#` through `####`)**: Automatically indexed into the sticky Table of Contents with deterministic anchor IDs and scroll-spy tracking.
- **Excerpt Separator**: Place `<!-- more -->` in the article body to control the automatic excerpt when `description` is omitted.
- **GFM Extensions**: Tables, strikethrough (`~~text~~`), task lists (`- [x]` / `- [ ]`), and autolinks.
- **Fenced Code Blocks**: Syntax-highlighted via Shiki with a language header and one-click Copy button. Specify the language tag (e.g., ` ```typescript `, ` ```python `, ` ```rust `, ` ```bash `).
- **Mathematical Equations (KaTeX)**:
  - Inline math: `$E = mc^2$`
  - Display math:
    ```markdown
    $$
    M_{\text{KV}} = 2 \cdot L \cdot H_{kv} \cdot d \cdot B \cdot N \cdot b
    $$
    ```
- **Mermaid Diagrams**: Use a fenced `mermaid` code block (` ```mermaid ... ``` `) to render flowcharts, sequence diagrams, and state diagrams safely in strict mode.
- **Images & Captions**:
  ```markdown
  ![Descriptive alt text](../assets/diagram.webp "Optional figure caption shown below the image")
  ```
  - Relative paths are resolved from the Markdown file's directory (`content/posts/` -> `../assets/...` resolves to `content/assets/...`).
  - Clicking any article image opens the built-in Lightbox viewer.
- **Bilingual Support**: Full English and Simplified Chinese (`Noto Serif SC` / `Noto Sans SC`) typography and reading-time estimation.

---

## 4. Supported Custom Directives

Only the following four explicit container directives are supported (Hexo/Stellar `{% ... %}` tag plugins are intentionally **not** emulated):

```markdown
:::note{title="Important"}
This is a highlighted note block.
:::

:::tip{title="Recommendation"}
This is a helpful engineering tip.
:::

:::warning{title="Caution"}
This highlights a caveat or common failure mode.
:::

:::details{title="Expandable Technical Note"}
Hidden until clicked by the reader. Supports standard Markdown inside.
:::
```

---

## 5. Security & Sanitization Rules

- Raw HTML is passed through a strict allowlist sanitizer (`rehype-sanitize`).
- `<script>`, `<iframe>`, inline event handlers (`onclick`, `onerror`), and `javascript:` or `data:` URLs are automatically stripped.
- Mermaid renders with `securityLevel: 'strict'`.

---

## 6. Connecting a GitHub Content Repository

Configure these Vite environment variables (no authentication token needed for public repositories; **never** place a GitHub PAT in any `VITE_*` variable):

```env
VITE_GITHUB_OWNER=your-github-username
VITE_GITHUB_REPO=your-blog-content-repo
VITE_GITHUB_BRANCH=main
VITE_GITHUB_POSTS_PATH=content/posts
VITE_GITHUB_ASSETS_PATH=content/assets
```

When `VITE_GITHUB_OWNER` and `VITE_GITHUB_REPO` are set, the frontend switches automatically from `MockContentProvider` to `GitHubMarkdownProvider` without any code changes. For future private repositories, configure a server-side proxy via `VITE_CONTENT_PROXY_URL`.
