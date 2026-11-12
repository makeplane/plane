# Linting in Plane - How It Works

We use [OxLint](https://oxc.rs/docs/guide/usage/linter) for linting across the entire monorepo. OxLint is a single Rust binary that's 50-100x faster than ESLint, with zero Node.js dependencies at runtime.

## Key Points

1. **Single Root Config** - One `.oxlintrc.json` at the repo root handles all packages and apps
2. **No Build Required** - OxLint doesn't need TypeScript build artifacts, so lint runs independently of build
3. **Plugin Coverage** - react, typescript, jsx-a11y, import, promise, unicorn, oxc

## How to Run

From the root of the repo:

```bash
# Check for lint errors
pnpm check:lint

# Auto-fix lint errors
pnpm fix:lint
```

To lint a specific package:

```bash
pnpm turbo run check:lint --filter=@plane/blocks
```

## VS Code Integration

Install the [Oxc extension](https://marketplace.visualstudio.com/items?itemName=oxc.oxc-vscode) for inline errors/warnings as you type.

## What Gets Linted

The config applies to all TypeScript and JavaScript files across:

- `apps/web`, `apps/admin`, `apps/space`, `apps/live`
- All packages in `packages/`

**Ignored paths:**

- `node_modules/`, `dist/`, `build/`, `coverage/`, `storybook-static/`
- `.cache/`, `.next/`, `.react-router/`, `.storybook/`, `.turbo/`, `.vite/`
- Config files (`*.config.{js,mjs,cjs,ts}`)
- Public folders

## Rules Overview

OxLint uses category-based configuration:

| Category        | Level | What It Catches                          |
| --------------- | ----- | ---------------------------------------- |
| **correctness** | warn  | Real bugs that will cause runtime errors |
| **suspicious**  | warn  | Code patterns that are likely mistakes   |
| **perf**        | warn  | Performance anti-patterns                |

Every category reports warnings, so the gate is the warning budget: each package's `check:lint` script runs `oxlint --max-warnings=<n> .`, and the job fails if the count goes above `n`. Do not add new warnings; lower `n` when you fix existing ones.

Additional rule overrides:

- `react/react-in-jsx-scope` and `react/prop-types` off (TypeScript handles prop validation)
- `no-unused-vars` warns with `_` prefix pattern ignored
- Several noisy unicorn rules disabled (`filename-case`, `no-null`, `prevent-abbreviations`)

## Backward Compatibility

OxLint supports `eslint-disable` comments, so existing inline suppressions continue to work.

## Suppressing Warnings

```typescript
// Single line
// eslint-disable-next-line no-unused-vars
const data = response;

// Block
/* eslint-disable no-unused-vars */
// ... code
/* eslint-enable no-unused-vars */
```

**Please use sparingly** - most warnings indicate real issues that should be fixed.

## Pre-commit Hook

Lint-staged runs automatically on commit via Husky:

- oxfmt formats your staged files
- OxLint fixes what it can (with `--deny-warnings`)

If the commit fails due to lint errors, fix them before committing.

## Formatting

[oxfmt](https://oxc.rs/docs/guide/usage/formatter) formats the repo using [.oxfmtrc.json](../.oxfmtrc.json) (print width 120, Tailwind class sorting). Run `pnpm check:format` to check and `pnpm fix:format` to apply. CI runs `check:format` on every pull request.

## Python (apps/api)

The backend is linted with [Ruff](https://docs.astral.sh/ruff/) using [apps/api/ruff.toml](../apps/api/ruff.toml). Run `uv run ruff check .` from `apps/api`; CI runs the same command on pull requests that touch `apps/api`.

## Reference Files

- [.oxlintrc.json](../.oxlintrc.json) - OxLint configuration
- [.oxfmtrc.json](../.oxfmtrc.json) - oxfmt configuration
- [package.json](../package.json) - Available scripts
