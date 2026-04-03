# Quota Management

Google Stitch free tier quota tracking and conservation strategies.

## Limits

| Mode | Credits/Day | Reset |
|------|-------------|-------|
| Standard (Gemini 2.5 Flash) | 200 | Midnight UTC |
| Experimental (Gemini 2.5 Pro) | 50 | Midnight UTC |

Each generation = 1 credit. Each variant = 1 credit per variant.

## Local Tracking

Stitch SDK has no programmatic quota check endpoint. ClaudeKit tracks locally:

**File:** `~/.claudekit/.stitch-quota.json`

```json
{
  "date": "2026-03-23",
  "count": 42,
  "limit": 200
}
```

**Auto-reset:** When `date` != today (UTC), count resets to 0.

**Override limit:** `export STITCH_QUOTA_LIMIT="300"` (if Google increases limits).

## Warning Thresholds

| Remaining | Action |
|-----------|--------|
| > 20% | Normal operation |
| < 20% | `[!] Low quota` warning printed |
| 0 | `[X] Exhausted` — exit code 2, suggest fallback |

## Conservation Tips

1. **Use variants instead of regenerating** — 3 variants = 3 credits vs regenerating 3 times = 3 credits, but variants are more purposeful
2. **Use `screen.edit()` to refine** — Editing costs 1 credit but preserves context
3. **Export early** — Don't regenerate just to see the design again; export HTML/image once
4. **Batch planning** — Plan all designs for the day, generate in one session
5. **Review prompts** — Better prompts = fewer regenerations

## Fallback Workflow

When quota is exhausted:

1. `stitch-quota.ts check` returns exit code 2
2. Skill prints: "Daily quota exhausted. Use ck:ui-ux-pro-max as fallback."
3. Activate `ck:ui-ux-pro-max` with the same design prompt
4. `ui-ux-pro-max` generates text-based design spec (no external API needed)
5. Proceed with implementation using text-based spec

## Drift Warning

Local tracking can drift if user generates designs outside ClaudeKit (via Stitch web UI or other tools). If you hit `RATE_LIMITED` error despite local tracker showing credits available:

1. Run `npx tsx stitch-quota.ts reset`
2. Set count to match actual usage (or leave at 0 if unknown)
3. Stitch API itself enforces the real limit — local tracker is advisory only
