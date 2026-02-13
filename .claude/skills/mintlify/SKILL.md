---
name: mintlify
description: Build and deploy documentation sites with Mintlify. Use when creating API docs, developer portals, or knowledge bases. Covers docs.json configuration, MDX components (Cards, Steps, Tabs, Accordions, CodeGroup, Callouts, Mermaid, View, Tiles, Tree, Badge, Banner, Color, Tooltips, Panel), page frontmatter, navigation structure (tabs, anchors, dropdowns, products, versions, languages), theming (7 themes), OpenAPI/AsyncAPI integration, AI features (llms.txt, MCP, skill.md), deployment (GitHub, GitLab, Vercel, Cloudflare, AWS), and CLI commands for local development and validation.
version: 2.0.0
license: MIT
---

# Mintlify Documentation Builder

Mintlify is a modern documentation platform that transforms Markdown/MDX files into beautiful, interactive documentation sites.

## Quick Start

```bash
npm i -g mintlify
mint new                    # Initialize new docs
mint dev                    # Local preview
mint validate               # Validate configuration
```

## Core Concepts

**Configuration:** `docs.json` file defines theme, navigation, branding, colors, integrations.

**Themes:** 7 options - mint, maple, palm, willow, linden, almond, aspen

**Content:** MDX files with frontmatter, support for React components and Mintlify-specific components.

**Navigation:** Tabs, anchors, groups, dropdowns, products, versions, languages (28+ locales).

**Components:** 26+ built-in components for structure, API documentation, callouts, diagrams, interactivity.

## CLI Commands

```bash
mint dev                    # Local server on port 3000
mint new                    # Scaffold new docs project
mint update                 # Update Mintlify packages
mint broken-links           # Check for broken links
mint a11y                   # Accessibility audit
mint validate               # Validate docs.json config
mint openapi-check          # Validate OpenAPI specs
mint rename <old> <new>     # Rename file + update refs
mint migrate-mdx            # Migrate mint.json to docs.json
```

## Key Features

**API Documentation:** Auto-generate from OpenAPI/AsyncAPI specs, interactive playgrounds, multi-language code examples.

**AI Features:** llms.txt, skill.md, MCP support, contextual AI menu options, Discord/Slack bots.

**Customization:** Custom fonts, colors, backgrounds, logos, favicons, page modes (default|wide|custom|frame|center).

**Analytics:** GA4, PostHog, Amplitude, Clarity, Fathom, Heap, Hotjar, LogRocket, Mixpanel, Plausible, and more.

**Deployment:** Auto-deploy from GitHub/GitLab, preview deployments, custom domains, subpath hosting, Vercel/Cloudflare/AWS.

**Navigation:** Products (partition docs), versions (multiple doc versions), languages (i18n), tabs, menus, anchors.

**SEO:** Custom metatags, indexing control, redirects, sitemap generation.

## Reference Files

- `references/docs-json-configuration-reference.md` - Complete docs.json configuration
- `references/mdx-components-reference.md` - All 26+ MDX components
- `references/api-documentation-components-reference.md` - API docs and OpenAPI integration
- `references/navigation-structure-and-organization-reference.md` - Navigation patterns
- `references/deployment-and-continuous-integration-reference.md` - Deployment and CI/CD
- `references/ai-features-and-integrations-reference.md` - AI assistant, llms.txt, MCP

## Common Patterns

**Basic docs.json:**
```json
{
  "theme": "mint",
  "name": "My Docs",
  "colors": {
    "primary": "#0D9373"
  },
  "navigation": [
    {
      "group": "Getting Started",
      "pages": ["introduction", "quickstart"]
    }
  ]
}
```

**MDX page with components:**
```mdx
---
title: "Getting Started"
description: "Quick introduction"
---

<Note>Important information</Note>

<CodeGroup>
```bash
npm install
```

```python
pip install
```
</CodeGroup>

<Steps>
  <Step title="Install">Install the package</Step>
  <Step title="Configure">Set up config</Step>
</Steps>
```

## Resources

- Official docs: https://mintlify.com/docs
- GitHub: https://github.com/mintlify
- Community: Discord server for support
