<!-- Scope: packages/types/** -->

# TypeScript Types & Interfaces

## Naming Conventions

- `I` prefix for interfaces: `IIssue`, `IWorkspace`, `IModule`, `ICycle`
- `T` prefix for type aliases: `TIssue`, `TBaseActivity`, `TPageVersion`
- ❌ No other prefixes — no `S` for shapes, no bare names for public types

## File Organization

- Domain-based folders: `packages/types/src/{domain}/`
- Examples: `issues/`, `cycle/`, `dashboard/`, `settings/`, `workspace/`
- Barrel exports via `index.ts` at each level
- Root `index.ts`: `export * from "./activity"`, `export * from "./cycle"`, etc.

## Rules

- ✅ Define types in `packages/types/src/` — shared across all apps
- ✅ Export via barrel `index.ts` files
- ✅ Use `export type` for type-only exports
- ✅ Group by domain (issues, workspace, project, etc.)
- ❌ Don't create types in component files
- ❌ Don't duplicate types across apps — use `@plane/types`
- ❌ Don't use `any` — use explicit types

## Import Pattern

```typescript
import type { IIssue, IWorkspace } from "@plane/types";
```

## Relationship to Backend

- Types mirror Django serializer output fields
- UUID fields → `string` type
- Datetime fields → `string` (ISO format)
- Nullable fields → `T | null`
