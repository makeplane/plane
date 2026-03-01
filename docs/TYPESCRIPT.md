# TypeScript Guidelines

Modern TypeScript conventions for Plane (v5.0+).

## Key Principles

1. **Use modern features** - `const` type parameters, `satisfies`, `using` declarations
2. **Prefer erasable syntax** - Avoid `enum`s and `namespace`s; use `const` objects or unions
3. **Explicit type imports** - Use `import type` for type-only imports (`verbatimModuleSyntax`)
4. **Trust inference** - Let TypeScript infer where possible, annotate at boundaries

## Type System

```typescript
// const type parameters for literal inference
declare function names<const T extends string[]>(...names: T): void;

// satisfies for validation without widening
const config = { port: 3000 } satisfies Config;

// NoInfer to block inference
function create<T>(value: T, defaultValue: NoInfer<T>): T;
```

## Resource Management

```typescript
// using declarations (5.2+) for automatic cleanup
using resource = new Resource();
// resource.dispose() called automatically at block end
```

## Imports

```typescript
// Type-only imports (required with verbatimModuleSyntax)
import type { User } from "./types";
import { createUser, type UserOptions } from "./users";

// Import attributes for JSON
import data from "./data.json" with { type: "json" };
```

## Modern APIs

```typescript
// Object.groupBy instead of lodash
const grouped = Object.groupBy(items, (item) => item.category);

// Copying array methods for immutability
const sorted = arr.toSorted();
const modified = arr.with(0, newValue);

// Promise.withResolvers
const { promise, resolve, reject } = Promise.withResolvers<T>();
```

## Avoid

| Avoid               | Prefer                                        |
| ------------------- | --------------------------------------------- |
| `enum Foo {}`       | `const Foo = { ... } as const` or union types |
| `namespace`         | ES modules                                    |
| `import ... assert` | `import ... with`                             |
| Explicit `any`      | `unknown` with narrowing                      |
| Manual cleanup      | `using` declarations                          |

## Narrowing

TypeScript handles these automatically:

- `switch(true)` blocks
- Boolean comparisons
- Closures (when variable isn't reassigned)
- Constant indexed access (`obj["key"]` where `"key"` is const)

## Configuration

Projects use `--moduleResolution bundler` and `--verbatimModuleSyntax`. See [ESLINT.md](./ESLINT.md) for linting rules.
