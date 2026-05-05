## <!-- Scope: all code files -->

## description: Development standards, verification gates, and testing rules

# Development Rules

**Principles:** YAGNI / KISS / DRY -- always.

## Standards

- kebab-case file names (descriptive, self-documenting for LLM tools)
- Code files <200 lines, components <150 lines
- Follow codebase structure and code standards in `./docs`
- Real implementations only -- no mocks, simulations, or fake data

## Code Quality

- Functionality + readability over strict style enforcement
- No syntax errors -- code must compile
- Try-catch error handling, cover security standards
- Review your own code after implementation (check patterns, imports, edge cases)

## Post-Implementation Verification (MANDATORY)

After EVERY implementation, run these checks before marking done:

1. **Compile check**: `pnpm check:lint` (frontend) or Python import test (backend)
2. **Import verification**: Grep your new imports against actual `package.json` / `requirements.txt`
3. **Pattern check**: Grep codebase for similar patterns to verify yours matches existing convention
4. **No new files without need**: If you created a new file, verify no existing file serves the same purpose

WRONG -- Skipping verification:
"I've implemented the feature" (without running lint/compile)

CORRECT -- Verified implementation:

1. Implemented feature
2. Ran pnpm check:lint -- 0 errors
3. Verified imports exist in package.json
4. Grepped similar patterns -- matches convention

## Pre-commit

- Run linting before commit, tests before push
- Never commit secrets (.env, API keys, credentials)
- Conventional commit format, no AI references
- Never ignore failing tests
- **Real data only** -- no mocks/stubs/fakes to pass tests (unless testing external API boundaries)
- **Test behavior, not implementation** -- tests should verify outcomes, not internal method calls
- If a test requires >3 mocks, the code under test likely needs refactoring

## ESLint

- Config: Root `eslint.config.mjs` (v9 flat config, single file for monorepo)
- **Typed linting** enabled -- type-aware checks catch unsafe `any`, floating promises
- Fix: `pnpm fix:lint` | Check: `pnpm check:lint`
- Import style: prefer top-level type imports (`import type { X } from "y"`)

WRONG -- `import { SomeType } from "module"` (when only used as type)
CORRECT -- `import type { SomeType } from "module"`

## Implementation

- Follow established architectural patterns
- Handle edge cases and error scenarios
- Update existing files directly -- never create "enhanced" copies
