# BIM Tutorials

Internal tutorial site for BIM/GIS workflows, built with [Astro](https://astro.build) + [Starlight](https://starlight.astro.build).

## Quick Start

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # production build
```

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import the repo in [Vercel](https://vercel.com/new).
3. Vercel auto-detects Astro — no config needed.
4. Every push to `main` triggers a new deploy.

## Writing Guides

All content lives in `src/content/docs/`. Guides are `.mdx` files (markdown + components).

### File structure

```
src/content/docs/
├── en/
│   ├── index.mdx            ← English landing page
│   ├── acc/
│   │   ├── file-structure.mdx
│   │   └── review-comments.mdx
│   ├── revit/
│   │   └── new-project-setup.mdx
│   └── plugins/
│       ├── revit-to-geopackage.mdx
│       ├── export-citygml-3dtiles.md
│       └── geopackage-to-imdf.md
└── ja/
    └── ...                   ← Mirror the en/ structure
```

### Adding a new guide

1. Create an `.mdx` file in the appropriate category folder under `en/`.
2. Add frontmatter:
   ```yaml
   ---
   title: Your Guide Title
   description: One-line summary.
   ---
   ```
3. Add a sidebar entry in `astro.config.mjs`.
4. (Optional) Create the Japanese translation in the matching `ja/` path.

### Using Starlight components

Import at the top of your `.mdx` file:

```mdx
import { Steps, Aside, Tabs, TabItem } from '@astrojs/starlight/components';
```

- **Steps** — numbered procedure blocks
- **Aside** — callout boxes (`type="tip"`, `"caution"`, `"danger"`, `"note"`)
- **Tabs / TabItem** — tabbed content (useful for showing different options)

### Embedding videos

```mdx
import Video from '../../../components/Video.astro';

{/* YouTube */}
<Video src="https://www.youtube.com/watch?v=VIDEO_ID" title="Demo" />

{/* Self-hosted (place files in public/videos/) */}
<Video src="/videos/my-walkthrough.mp4" title="Walkthrough" />
```

For self-hosted videos, drop `.mp4` files into the `public/videos/` folder.
Avoid committing very large videos to Git — consider hosting them externally
and linking by URL instead.

### Adding images / diagrams

Drop SVG or PNG files next to your `.mdx` file or in `src/assets/` and use
standard markdown image syntax:

```md
![Diagram of folder structure](./acc-folder-diagram.svg)
```

## Adding a New Sidebar Section

Edit `astro.config.mjs` and add an entry to the `sidebar` array. Each section
needs a `label`, optional `translations` for Japanese, and an `items` array
with `label`, `translations`, and `slug` for each page.
