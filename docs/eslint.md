# ESLint in Plane - How It Works

We've recently upgraded our ESLint setup to use **typed linting** with a **single root-level configuration**. This means faster lint runs and simpler config management across the entire monorepo.

## Key Changes

1. **Single Root Config** - Instead of individual `eslint.config.mjs` files in every package, we now have one config at the repo root that handles all packages and apps
2. **Typed Linting Enabled** - ESLint now uses TypeScript's type information for more powerful checks (catching things like floating promises, unsafe any usage, etc.)
3. **ESLint Flat Config** - We're using ESLint v9's new flat config format

## How to Run ESLint

From the root of the repo:

```bash
# Check for lint errors
pnpm check:lint

# Auto-fix lint errors
pnpm fix:lint
```

## VS Code Integration

ESLint should work automatically in VS Code. The extension will:

- Show inline errors/warnings as you type
- Use the root `eslint.config.mjs` for all files in the monorepo

**Tip:** Make sure you have the [ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) installed.

## What Gets Linted

The config applies to all TypeScript and JavaScript files across:

- `apps/web`, `apps/admin`, `apps/space`, `apps/live`
- All packages in `packages/`

**Ignored paths:**

- `node_modules/`, `dist/`, `build/`, `.next/`, `.turbo/`
- Config files (`*.config.{js,mjs,cjs,ts}`)
- Public folders

## Rules Overview

We're enforcing warnings (not errors) for most rules during the transition period. Key categories:

| Category          | What It Catches                                                                  |
| ----------------- | -------------------------------------------------------------------------------- |
| **TypeScript**    | `no-explicit-any`, `no-floating-promises`, `no-unsafe-*` family, unused vars     |
| **React**         | Display names, hooks rules (including new React Compiler rules), refresh exports |
| **Accessibility** | Alt text, keyboard events, ARIA roles, focus management                          |
| **Imports**       | Type imports style (`prefer-top-level`), unresolved imports                      |
| **Promises**      | Always return, catch-or-return                                                   |

## Adding New Packages

When creating a new package, **you don't need to add an ESLint config**. Just ensure:

1. The package has a `tsconfig.json`
2. The `tsconfig.json` is discoverable via the pattern `{apps,packages}/*/tsconfig.json`

The root config will automatically pick it up.

## Suppressing Warnings

If you need to suppress a specific warning:

```typescript
// Single line
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = response;

// Block
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// ... code
/* eslint-enable @typescript-eslint/no-unsafe-assignment */
```

**Please use sparingly** - most warnings indicate real issues that should be fixed.

## Pre-commit Hook

Lint-staged runs automatically on commit via Husky:

- Prettier formats your staged files
- ESLint fixes what it can (with `--max-warnings=0`)

If the commit fails due to lint errors, fix them before committing.

## Reference Files

- [eslint.config.mjs](../eslint.config.mjs) - Full ESLint configuration
- [package.json](../package.json) - Available scripts

## Help Us Improve!

If you have the time, please consider trying to put up PRs to turn the rules I've set to `warn` to `error`, or getting all of strict mode in TypeScript working for a package (e.g., `noUncheckedIndexAccess`, `strictNullChecks`). It'll help prevent bugs at Plane, and your co-workers will unknowingly thank you for it.

If you do decide to tackle this, please feel free to reach out to [@lifeiscontent](https://github.com/lifeiscontent) for advice on issues you get stuck on.

Thanks!
