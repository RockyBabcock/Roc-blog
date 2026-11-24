---
title: "Building a Decoupled Markdown Content Pipeline for Independent Blogs"
date: "2026-09-09"
updated: null
description: "How to separate content authoring from frontend presentation using typed ContentProvider contracts, pure parsers, and GitHub as a read-only CMS."
categories:
  - Engineering & Tutorials
tags:
  - TypeScript
  - Markdown
  - Architecture
  - Frontend
draft: false
pinned: false
---

Most personal sites stall not because of a lack of ideas, but because publishing a new essay requires fighting build toolchains, upgrading fragile themes, or editing React JSX files just to fix a typo.

<!-- more -->

Separating **content production** (plain Markdown files committed to Git) from **content presentation** (a clean frontend consuming a narrow `ContentProvider` interface) solves that friction permanently.

## 1. The Provider Boundary

UI pages should never know whether an article came from a local fixture, GitHub's Contents API, or a future edge cache. They depend strictly on a small asynchronous contract:

```ts
export interface ContentProvider {
  getPosts(): Promise<BlogPostSummary[]>;
  getPostBySlug(slug: string): Promise<BlogPost | null>;
  getCategories(): Promise<string[]>;
  getTags(): Promise<string[]>;
  searchPosts(query: string): Promise<BlogPostSummary[]>;
  refresh(): Promise<void>;
}
```

### Summary vs. Full Document Payloads

| Route | Data Needed | Rendering Strategy |
| :--- | :--- | :--- |
| Homepage & Categories | `BlogPostSummary[]` | Lightweight list rows without compiling Markdown AST |
| Article Detail | `BlogPost` | Full Markdown body, TOC headings, syntax highlight, Mermaid |
| Archives & Tags | `BlogPostSummary[]` | Pure client-side grouping by year, month, and tag frequency |

:::tip{title="Isolate Per-File Parse Failures"}
Never wrap an entire directory load in a single `Promise.all` without per-item error isolation. A single unclosed quote in one file's YAML Front Matter should log a clean warning and skip that file—never take down the entire blog.
:::

## 2. Relative Asset Resolution

Authors should be able to preview images locally in any Markdown editor using standard relative paths like `../assets/diagram.webp`. At render time, the parser resolves that relative path against the article's directory inside the repository so images work seamlessly both in GitHub's web viewer and on the published site.
