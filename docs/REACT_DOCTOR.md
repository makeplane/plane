# React Doctor

[React Doctor](https://github.com/millionco/react-doctor) is a CLI tool by the Million.js team that scans React codebases for performance issues, security problems, dead code, and more. It produces a health score out of 100.

## What It Checks

React Doctor runs two analysis passes in parallel:

1. **Lint pass** — 60+ rules across:
   - State & effects (unnecessary re-renders, missing deps)
   - Performance (inline functions, missing memoization)
   - Architecture (component size, prop drilling)
   - Bundle size (heavy imports, tree-shaking issues)
   - Security (dangerouslySetInnerHTML, XSS vectors)
   - Correctness (key usage, hook rules)
   - Accessibility (missing alt text, ARIA issues)

2. **Dead code pass** — detects:
   - Unused files, exports, and types
   - Duplicate code

Diagnostics are scored by severity (errors weigh more than warnings) to produce a **0–100 health score**:

| Score  | Label      |
| ------ | ---------- |
| 75–100 | Great      |
| 50–74  | Needs work |
| 0–49   | Critical   |

## Quick Start

From the repo root:

```bash
# Diagnose all React apps (web, admin, space)
pnpm diagnose

# Diagnose a specific app
pnpm diagnose:web
pnpm diagnose:admin
pnpm diagnose:space
```

Each app has its own `diagnose` script, orchestrated via Turbo. You can also run it directly inside an app:

```bash
cd apps/web && pnpm diagnose
```

## Reading the Output

React Doctor prints a summary like:

```
Health Score: 82/100 (Good)

  12 errors, 34 warnings

  Top issues:
  - react-hooks/exhaustive-deps (8 errors)
  - performance/inline-function (15 warnings)
  - knip/unused-exports (11 warnings)
```

Each diagnostic includes a file path and line number so you can jump straight to the issue.

## Configuration

The config lives at `react-doctor.config.json` in the repo root. You can:

- **Ignore rules** — if a rule produces too many false positives:

  ```json
  {
    "ignore": {
      "rules": ["react/no-danger"]
    }
  }
  ```

- **Ignore files** — generated code or vendor files are already excluded:
  ```json
  {
    "ignore": {
      "files": ["**/generated/**"]
    }
  }
  ```

## When to Run It

- **Before opening a PR** — run `pnpm diagnose` on the app you changed to catch regressions.
- **During code review** — if you see a suspicious pattern, run it on the relevant app for a second opinion.
- **Periodically** — run `pnpm diagnose` to track overall frontend health trends.

## CI Integration

React Doctor runs automatically on every PR that touches frontend code (`apps/web`, `apps/admin`, `apps/space`, or `packages/`). It uses the GitHub Action in `.github/workflows/react-doctor.yml`.

**It is currently non-blocking** — the check appears on your PR but won't prevent merging if it fails. This lets the team build awareness of React health issues without being gated by pre-existing warnings.

The action runs in **diff mode**, so it only reports issues in files changed by your PR, not the entire codebase.

Once the overall health score is consistently above 75, we can flip it to a blocking check.

## What It Does NOT Do

React Doctor is a **static analysis** tool. It does NOT:

- Profile runtime performance or measure actual re-render counts
- Replace React DevTools Profiler for live debugging
- Replace our existing linting setup (oxlint) — it complements it with React-specific checks

For runtime re-render debugging, use the [React DevTools](https://react.dev/learn/react-developer-tools) browser extension with "Highlight updates" and the Profiler tab.
