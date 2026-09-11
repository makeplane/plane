Update brand colors, typography, and style - automatically syncs to all design system files.

<args>$ARGUMENTS</args>

## Overview

This command systematically updates:
1. `design/brand-guidelines.md` - Human-readable brand doc
2. `design/design-tokens.json` - Token source of truth
3. `design/design-tokens.css` - Generated CSS variables

## Workflow

### Step 1: Gather Brand Input

Use `AskUserQuestion` to collect:

**Theme Selection:**
- Theme name (e.g., "Ocean Professional", "Electric Creative", "Forest Calm")

**Primary Color:**
- Color name (e.g., "Ocean Blue", "Coral", "Forest Green")
- Hex code (e.g., #3B82F6)

**Secondary Color:**
- Color name (e.g., "Golden Amber", "Electric Purple")
- Hex code

**Accent Color:**
- Color name (e.g., "Emerald", "Neon Mint")
- Hex code

**Brand Mood (for AI image generation):**
- Mood keywords (e.g., "professional, trustworthy, premium" or "bold, creative, energetic")

### Step 2: Update Brand Guidelines

Edit `design/brand-guidelines.md`:

1. **Quick Reference table** - Update color names and hex codes
2. **Brand Concept section** - Update theme name and description
3. **Color Palette section** - Update Primary, Secondary, Accent colors with shades
4. **AI Image Generation section** - Update base prompt, keywords, mood descriptors

### Step 3: Sync to Design Tokens

Run the sync script:
```bash
node .claude/skills/design/scripts/tokens/sync-brand-to-tokens.cjs
```

This will:
- Update `design/design-tokens.json` with new color names and values
- Regenerate `design/design-tokens.css` with correct CSS variables

### Step 4: Verify Sync

Confirm all files are updated:
```bash
# Check brand context extraction
node .claude/skills/design/scripts/tokens/inject-brand-context.cjs --json | head -30

# Check CSS variables
grep "primary" design/design-tokens.css | head -5
```

### Step 5: Report

Output summary:
- Theme: [name]
- Primary: [name] ([hex])
- Secondary: [name] ([hex])
- Accent: [name] ([hex])
- Files updated: brand-guidelines.md, design-tokens.json, design-tokens.css

## Files Modified

| File | Purpose |
|------|---------|
| `design/brand-guidelines.md` | Human-readable brand documentation |
| `design/design-tokens.json` | Token definitions (primitive→semantic→component) |
| `design/design-tokens.css` | CSS variables for UI components |

## Skills Used

- `design` (brand mode) - Brand context extraction and sync
- `design` (design-system mode) - Token generation

## Examples

```bash
# Interactive mode
/design brand update

# With theme hint
/design brand update "Ocean Professional"

# Quick preset
/design brand update "midnight purple"
```

## Color Presets

If user specifies a preset name, use these defaults:

| Preset | Primary | Secondary | Accent |
|--------|---------|-----------|--------|
| ocean-professional | #3B82F6 Ocean Blue | #F59E0B Golden Amber | #10B981 Emerald |
| electric-creative | #FF6B6B Coral | #9B5DE5 Electric Purple | #00F5D4 Neon Mint |
| forest-calm | #059669 Forest Green | #92400E Warm Brown | #FBBF24 Sunlight |
| midnight-purple | #7C3AED Violet | #EC4899 Pink | #06B6D4 Cyan |
| sunset-warm | #F97316 Orange | #DC2626 Red | #FACC15 Yellow |

## Important

- **Always sync all three files** - Never update just brand-guidelines.md alone
- **Verify extraction** - Run inject-brand-context.cjs after update to confirm
- **Test image generation** - Optionally generate a test image to verify brand application
