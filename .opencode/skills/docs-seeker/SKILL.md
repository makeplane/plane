---
name: docs-seeker
description: Search library/framework documentation via llms.txt (context7.com). Use for API docs, GitHub repository analysis, technical documentation lookup, latest library features.
version: 3.1.0
---

# Documentation Discovery via Scripts

## Overview

**Script-first** documentation discovery using llms.txt standard.

Execute scripts to handle entire workflow - no manual URL construction needed.

## Primary Workflow

**ALWAYS execute scripts in this order:**

```bash
# 1. DETECT query type (topic-specific vs general)
node scripts/detect-topic.js "<user query>"

# 2. FETCH documentation using script output
node scripts/fetch-docs.js "<user query>"

# 3. ANALYZE results (if multiple URLs returned)
cat llms.txt | node scripts/analyze-llms-txt.js -
```

Scripts handle URL construction, fallback chains, and error handling automatically.

## Scripts

**`detect-topic.js`** - Classify query type
- Identifies topic-specific vs general queries
- Extracts library name + topic keyword
- Returns JSON: `{topic, library, isTopicSpecific}`
- Zero-token execution

**`fetch-docs.js`** - Retrieve documentation
- Constructs context7.com URLs automatically
- Handles fallback: topic → general → error
- Outputs llms.txt content or error message
- Zero-token execution

**`analyze-llms-txt.js`** - Process llms.txt
- Categorizes URLs (critical/important/supplementary)
- Recommends agent distribution (1 agent, 3 agents, 7 agents, phased)
- Returns JSON with strategy
- Zero-token execution

## Workflow References

**[Topic-Specific Search](./workflows/topic-search.md)** - Fastest path (10-15s)

**[General Library Search](./workflows/library-search.md)** - Comprehensive coverage (30-60s)

**[Repository Analysis](./workflows/repo-analysis.md)** - Fallback strategy

## References

**[context7-patterns.md](./references/context7-patterns.md)** - URL patterns, known repositories

**[errors.md](./references/errors.md)** - Error handling, fallback strategies

**[advanced.md](./references/advanced.md)** - Edge cases, versioning, multi-language

## Execution Principles

1. **Scripts first** - Execute scripts instead of manual URL construction
2. **Zero-token overhead** - Scripts run without context loading
3. **Automatic fallback** - Scripts handle topic → general → error chains
4. **Progressive disclosure** - Load workflows/references only when needed
5. **Agent distribution** - Scripts recommend parallel agent strategy

## Quick Start

**Topic query:** "How do I use date picker in shadcn?"
```bash
node scripts/detect-topic.js "<query>"  # → {topic, library, isTopicSpecific}
node scripts/fetch-docs.js "<query>"    # → 2-3 URLs
# Read URLs with WebFetch
```

**General query:** "Documentation for Next.js"
```bash
node scripts/detect-topic.js "<query>"         # → {isTopicSpecific: false}
node scripts/fetch-docs.js "<query>"           # → 8+ URLs
cat llms.txt | node scripts/analyze-llms-txt.js -  # → {totalUrls, distribution}
# Deploy agents per recommendation
```

## Environment

Scripts load `.env`: `process.env` > `.opencode/skills/docs-seeker/.env` > `.opencode/skills/.env` > `.opencode/.env`

See `.env.example` for configuration options.
