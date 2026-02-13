# Type Error Fix Workflow

Quick workflow for TypeScript/type errors.

## Commands
```bash
bun run typecheck
tsc --noEmit
npx tsc --noEmit
```

## Rules
- Fix ALL type errors, don't stop at first
- **NEVER use `any` just to pass** - find proper types
- Repeat until zero errors

## Common Fixes
- Missing type imports
- Incorrect property access
- Null/undefined handling
- Generic type parameters
- Union type narrowing

## Workflow
1. Run typecheck command
2. Fix errors one by one
3. Re-run typecheck
4. Repeat until clean

## Tips
- Group related errors (same root cause)
- Check `@types/*` packages for library types
- Use `unknown` + type guards instead of `any`
