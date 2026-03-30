## <!-- Scope: apps/web/**, apps/admin/**, apps/space/**, packages/** -->

## description: Prettier formatting standards for all frontend code

# Prettier Formatting

Configured via root `.prettierrc` with `@prettier/plugin-oxc`.

## Key Settings

| Setting        | Value | Note                                   |
| -------------- | ----- | -------------------------------------- |
| Print width    | 120   | NOT default 80                         |
| Tab width      | 2     | Spaces, not tabs                       |
| Trailing comma | es5   | Arrays, objects -- not function params |
| Semicolons     | yes   | Default                                |

Override: `packages/codemods/**` uses 80-char width.

## Commands

- Check: `pnpm check:format`
- Fix: `pnpm format`

WRONG -- Lines exceeding 120 characters without wrapping
CORRECT -- Wrap at 120 characters, let Prettier handle formatting
