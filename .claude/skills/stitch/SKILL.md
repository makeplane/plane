---
name: ck:stitch
description: "AI design generation with Google Stitch. Generate UI designs from text prompts, export Tailwind/HTML/DESIGN.md, orchestrate design-to-code pipeline. Use for rapid prototyping, UI generation, design exploration."
license: MIT
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
argument-hint: "[design prompt or action]"
metadata:
  author: claudekit
  version: "1.0.0"
---

# Google Stitch — AI Design Generation

Generate high-fidelity UI designs from text prompts via Google Stitch. Export Tailwind/HTML, orchestrate design-to-code pipelines with existing UI skills.

**Free tier:** 400 credits/day + 15 redesign credits/day. Resets at midnight UTC.

## Setup

### 1. API Key

Get an API key at https://stitch.withgoogle.com → Settings → API Keys.

Add `STITCH_API_KEY=sk_...` to `~/.claude/.env` (or `~/.claude/skills/.env`).

Running `install.sh` auto-adds the placeholder if missing — just fill in the value.

### 2. Install SDK

```bash
cd ~/.claude/skills/stitch/scripts && npm install
```

Or run `~/.claude/skills/install.sh` which handles this automatically.

### 3. Optional

```bash
# In ~/.claude/.env
STITCH_PROJECT_ID="my-project"    # Default project (auto-creates "claudekit-default" if unset)
STITCH_QUOTA_LIMIT="200"          # Override daily limit
```

### 4. MCP Server (optional)

Add to `~/.claude/.mcp.json` for native design context in Claude Code:

```json
{
  "mcpServers": {
    "stitch": {
      "command": "npx",
      "args": ["@_davideast/stitch-mcp", "proxy"],
      "env": { "STITCH_API_KEY": "${STITCH_API_KEY}" }
    }
  }
}
```

See `references/stitch-mcp-setup.md` for alternative options (gcloud, auto-installer).

## Quick Start

```bash
# Check quota
npx tsx scripts/stitch-quota.ts check

# Generate design
npx tsx scripts/stitch-generate.ts "A checkout page with payment form and cart summary"

# Export as HTML + DESIGN.md
npx tsx scripts/stitch-export.ts <screen-id> --format all --output ./stitch-exports/
```

## Actions

### generate

Generate UI design from text prompt.

```bash
npx tsx scripts/stitch-generate.ts "<prompt>" [--project <id>] [--device MOBILE|DESKTOP|TABLET] [--variants <count>]
```

Returns: screen ID, preview image URL. With `--variants`: additional design alternatives.

### export

Export generated design as HTML/Tailwind, screenshot, or DESIGN.md.

```bash
npx tsx scripts/stitch-export.ts <screen-id> [--format html|image|all] [--output <dir>]
```

Outputs:
- `design.html` — Semantic HTML with Tailwind CSS classes
- `design.png` — Screenshot of the design
- `DESIGN.md` — Agent-readable design spec (colors, typography, spacing, components)

### quota

Check and manage daily quota.

```bash
npx tsx scripts/stitch-quota.ts check       # Show remaining credits
npx tsx scripts/stitch-quota.ts increment   # Bump after generation
npx tsx scripts/stitch-quota.ts reset       # Force reset (auto-resets daily)
```

### edit

Refine an existing design.

```typescript
const editedScreen = await screen.edit("Make the header darker and add a search bar");
```

## Orchestration Pipeline

### Design-to-Code Flow

1. **Check quota** — Run `stitch-quota.ts check`. If exhausted, suggest `ck:ui-ux-pro-max` fallback.
2. **Generate** — Run `stitch-generate.ts` with user's design prompt
3. **Review** — Show generated design image to user for feedback
4. **Variants** (optional) — Generate alternatives if user wants exploration
5. **Export** — Run `stitch-export.ts --format all` to get HTML + DESIGN.md
6. **Implement** — Hand off exported artifacts to implementation skill:
   - `ck:frontend-design` — React/Vue/Svelte components from Tailwind export
   - `ck:ui-ux-pro-max` — Full page layouts with style guide integration
   - `ck:ui-styling` — Design token extraction from DESIGN.md
7. **Track quota** — Run `stitch-quota.ts increment`

### Handoff Protocol

- Export creates `DESIGN.md` in project root or plan directory
- Implementation skills detect `DESIGN.md` and use it as design spec
- DESIGN.md takes precedence over text descriptions when present
- If no DESIGN.md exists, skills fall back to normal text-based design flow

See `references/design-to-code-pipeline.md` for detailed patterns and examples.

## Quota Management

- 400 credits/day + 15 redesign/day, resets at midnight UTC
- Local tracking via `~/.claudekit/.stitch-quota.json`
- Warns when remaining credits < 20%
- **Fallback:** When exhausted, use `ck:ui-ux-pro-max` for text-based design generation

See `references/quota-management.md` for strategies.

## Limitations

- **No React export** — HTML/Tailwind only; Claude converts to React/Vue components
- **Non-responsive layouts** — Must add breakpoints manually during implementation
- **No animations** — Static designs only; add micro-interactions in code
- **Single-user** — No multiplayer/collaboration features
- **Hard daily quota** — No paid tier to increase limits
- **Generic output risk** — Combine with style guides for differentiation

## References

| Topic | File |
|-------|------|
| SDK API | `references/stitch-sdk-api.md` |
| MCP Setup | `references/stitch-mcp-setup.md` |
| Pipeline Patterns | `references/design-to-code-pipeline.md` |
| Quota Strategy | `references/quota-management.md` |
