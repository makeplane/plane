# Naming Conventions

Comprehensive naming rules for all file types. See SKILL.md Rule 2 for overview.

## Slug Generation

### Rules

- Convert title/topic to lowercase
- Replace spaces and special chars with hyphens
- Keep numbers
- Max 50 characters (truncate at word boundary)
- No leading/trailing hyphens
- No consecutive hyphens

### Examples

| Title | Slug |
|-------|------|
| "User Authentication Flow" | `user-authentication-flow` |
| "Fix: API Rate Limiting Bug #42" | `fix-api-rate-limiting-bug-42` |
| "10 Tips for Better CI/CD" | `10-tips-for-better-ci-cd` |
| "AI & Automation: A Guide" | `ai-automation-a-guide` |

## Date Formats

Use `$CK_PLAN_DATE_FORMAT` env var if set, otherwise default to `YYMMDD-HHmm`.

| Format | Example | Use case |
|--------|---------|----------|
| `YYMMDD-HHmm` | `260304-1530` | Default for time-sensitive files |
| `YYMMDD` | `260304` | Date-only (ADRs, daily reports) |
| No date | `{slug}` | Evergreen content |

### When to timestamp

- Plans, reports, journals, sessions, brainstorms
- Generated/AI content
- Campaign-specific assets
- Any content that becomes stale over time

### When NOT to timestamp

- Docs (architecture, standards, guides)
- Config files
- Source code
- Templates
- Brand assets (logos, styles)

## Code File Naming

Defer to `descriptive-name` hook for language-specific conventions:

| Language | Convention | Example |
|----------|-----------|---------|
| JS/TS/Python/Shell | kebab-case | `user-auth-service.ts` |
| C#/Java/Kotlin/Swift | PascalCase | `UserAuthService.cs` |
| Go/Rust | snake_case | `user_auth_service.go` |
| CSS/SCSS | kebab-case | `auth-form-styles.scss` |

**Priority:** Self-documenting > short. A long descriptive name is better than a cryptic abbreviation.

## File Extensions

| Type | Extensions |
|------|-----------|
| Images | `.png`, `.jpg`, `.webp`, `.svg`, `.gif` |
| Videos | `.mp4`, `.mov`, `.webm` |
| Audio | `.mp3`, `.wav`, `.m4a` |
| Documents | `.md`, `.txt`, `.pdf` |
| Data | `.json`, `.yaml`, `.yml`, `.csv`, `.xml` |
| Config | `.json`, `.yaml`, `.toml`, `.ini`, `.env` |

## Variant Naming

### Size variants

Pattern: `{name}-{width}x{height}.{ext}`

- `hero-1920x1080.png`
- `thumbnail-300x200.jpg`
- `banner-mobile-640x100.png`

### Platform variants

Pattern: `{name}-{platform}.{ext}`

- `cover-youtube.png`
- `post-instagram.png`
- `ad-linkedin.jpg`

### Theme/style variants

Pattern: `{name}-{variant}.{ext}`

- `logo-dark.svg`
- `logo-light.svg`
- `banner-alt.png`

### Version variants

Pattern: `{name}-v{N}.{ext}`

- `mockup-v2.png`
- `proposal-v3.pdf`

## Directory Naming

- Always kebab-case
- Plural for collections: `tests/`, `scripts/`, `assets/`
- Singular for specific items: `src/auth/`, `docs/`
- No abbreviations: `configurations/` not `configs/` (exception: well-known like `docs/`, `src/`)

## Report File Naming

Pattern: `{agent-type}-{YYMMDD-HHmm}-{slug}.md`

Examples:
- `scout-260304-1530-auth-module-analysis.md`
- `researcher-260304-1545-oauth2-comparison.md`
- `brainstorm-260304-1600-caching-strategy.md`
- `code-reviewer-260304-1700-api-endpoints.md`

## Plan Folder Naming

Pattern: `{YYMMDD-HHmm}-{slug}/`

Examples:
- `260304-1530-implement-user-authentication/`
- `260305-0900-migrate-database-to-postgres/`
- `260306-1400-redesign-dashboard-layout/`

## Scene/Sequence Naming

Pattern: `scene-{NN}-{position}.{ext}` or `step-{NN}-{name}.{ext}`

- `scene-01-start.png`, `scene-01-end.png`
- `step-01-install.md`, `step-02-configure.md`

Zero-padded numbers for correct sorting.
