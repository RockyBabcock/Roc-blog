export interface CategoryDefinition {
  name: string;
  description: string;
}

export const CANONICAL_CATEGORIES: readonly CategoryDefinition[] = [
  {
    name: 'AI & Deep Learning',
    description:
      'Architectures, inference systems, agentic orchestration, and evaluation methodology for modern foundation models.',
  },
  {
    name: 'Web3 & Blockchain',
    description:
      'Deterministic state machines, consensus protocols, cryptography, and protocol engineering notes.',
  },
  {
    name: 'Engineering & Tutorials',
    description:
      'Practical software architecture, compilers, frontend systems, and reproducible engineering walkthroughs.',
  },
  {
    name: 'Personal Essays & Thoughts',
    description:
      'Long-form reflections on craft, quiet tools, reading habits, and technical writing.',
  },
  {
    name: 'Research & Experiments',
    description:
      'Empirical benchmarks, hardware-level measurements, and exploratory prototypes.',
  },
] as const;

export const CANONICAL_CATEGORY_NAMES: readonly string[] = CANONICAL_CATEGORIES.map(
  (category) => category.name
);

export const siteConfig = {
  title: 'ROCKY JOURNAL',
  tagline: 'Independent Notes on Systems, AI & Craft',
  description:
    'Long-form technical essays, architecture notes, and quiet research logs. Written in Markdown, read without distraction.',
  author: 'Rocky',
  language: 'en-US',
  siteUrl: 'https://rockyjournal.example',
  postsPerPage: 6,
  recentSidebarCount: 4,
  popularTagsCount: 12,
  footerNote: 'Independent publication · Markdown-native reading interface',
  about: {
    heading: 'About Rocky Journal',
    lead: 'An independent reading space built for durable technical writing, bilingual essays, and reproducible engineering notes.',
    paragraphs: [
      'Rocky Journal separates writing from presentation. Articles are authored as portable Markdown documents with standard YAML Front Matter and published to a version-controlled GitHub repository. This frontend discovers, parses, and typesets each essay automatically without manual page wiring.',
      'The typography and three-column layout draw inspiration from Stellar minimal publishing: generous margins, warm ivory paper tones, quiet hairline divisions, and unobtrusive navigation that keeps attention on the argument.',
      'Topics span five recurring threads—AI & Deep Learning, Web3 & Blockchain, Engineering & Tutorials, Personal Essays & Thoughts, and Research & Experiments—written in both English and Chinese (中文).',
    ],
    principles: [
      {
        title: 'Portable Content First',
        detail:
          'Every article lives as plain Markdown with relative image references, standard math, diagrams, and structured metadata.',
      },
      {
        title: 'Calm Reading Rhythm',
        detail:
          'Measured line lengths, sticky contextual outlines, and restrained micro-interactions built for long-form focus.',
      },
      {
        title: 'Zero Editorial Friction',
        detail:
          'Commit a new .md file to the configured content repository and it appears across listings, categories, tags, archives, and search.',
      },
    ],
  },
} as const;

export function getCategoryDescription(categoryName: string): string {
  const matched = CANONICAL_CATEGORIES.find(
    (item) => item.name.toLowerCase() === categoryName.toLowerCase()
  );
  if (matched) {
    return matched.description;
  }
  return `Articles filed under ${categoryName}, ordered chronologically from most recent.`;
}
