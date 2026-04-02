# llms.txt Specification

Source: [llmstxt.org](https://llmstxt.org/)

## Purpose

`/llms.txt` is a markdown file at a website's root providing LLM-friendly information about a site. Context windows are too small for most full websites — llms.txt provides a curated "smart table of contents."

## Required Elements

- **H1 heading**: Project or site name (only mandatory element)

## Recommended Structure (in order)

1. **H1** — Project name
2. **Blockquote** — Brief project summary with essential context
3. **Body sections** — Zero or more markdown paragraphs/lists with details
4. **H2 sections** — Zero or more sections with categorized link lists

## Link Format

```markdown
- [Link Title](https://example.com/path): Optional description
```

Each list item uses a markdown hyperlink, optionally followed by colon and notes.

## Special Sections

### `## Optional`

When present, signals that its URLs can be skipped for shorter context windows. Contains secondary/supplementary information.

Place at the END of the file.

## Companion Files

| File | Purpose |
|------|---------|
| `llms.txt` | Curated index with links |
| `llms-full.txt` | Complete content inlined (no external URLs needed) |

## Writing Guidelines

- Use concise, clear language
- Include brief, informative descriptions per link
- Avoid ambiguous terms or unexplained jargon
- One canonical URL per topic/intent
- Group related docs under H2 sections
- Test output with multiple LLMs

## Example

```markdown
# Polar

> Polar is a payment and billing platform for developers and creators. It handles subscriptions, one-time payments, license keys, and file downloads.

## Getting Started

- [Quick Start](https://polar.sh/docs/guides/quick-start): Set up your first product and checkout
- [Authentication](https://polar.sh/docs/guides/auth): OAuth2 setup and API key management

## API Reference

- [Products](https://polar.sh/docs/api-reference/products/list): Create and manage products
- [Checkouts](https://polar.sh/docs/api-reference/checkouts/create-session): Create checkout sessions
- [Subscriptions](https://polar.sh/docs/api-reference/subscriptions/list): Manage customer subscriptions

## Integrations

- [Next.js](https://polar.sh/docs/integrations/nextjs): Server-side integration guide
- [Python SDK](https://polar.sh/docs/sdk/python): Python client library

## Optional

- [Migration Guide](https://polar.sh/docs/guides/migration): Migrating from other platforms
- [FAQ](https://polar.sh/docs/faq): Frequently asked questions
```

## Anti-patterns

- Dumping every page URL without curation
- Missing descriptions on links
- Using relative URLs without base (for web-hosted files)
- Overly long descriptions that defeat the purpose
- No categorization (flat list of 100+ links)
