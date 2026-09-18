---
description: Guidelines for using modern TypeScript features (v5.0-v5.8)
applyTo: "**/*.{ts,tsx,mts,cts}"
---

# TypeScript Coding Guidelines & Modern Features (v5.0 - v5.8)

When writing TypeScript code, prioritize using modern features and best practices introduced in recent versions (up to 5.8).

## Global Themes Across 5.x

1. **Standard decorators are here; legacy decorators are legacy.**
   New TC39-compliant decorators landed in 5.0 and were extended in 5.2 (metadata). Old `experimentalDecorators`-style behavior is still supported but should be treated as legacy.

2. **Type system is more precise and less noisy.**
   Major work went into narrowing, control flow analysis, error messages, and new helpers like `NoInfer`, inferred predicates, and better `undefined`/`never`/uninitialized checks.

3. **Module / runtime interop has been modernized.**
   Options like `--moduleResolution bundler`, `--module nodenext`/`node18`, `--rewriteRelativeImportExtensions`, `--erasableSyntaxOnly`, and `--verbatimModuleSyntax` are about playing nicely with ESM, Node 18+/22+, direct TypeScript execution, and bundlers.

4. **The standard library keeps tracking modern JS.**
   Support for new ES features (iterator helpers, `Object.groupBy`/`Map.groupBy`, new Set/ES2024 APIs) shows up as type declarations and sometimes extra checks (regex syntax checking, etc.).

When generating or refactoring code, prefer these newer idioms, and avoid patterns that conflict with updated checks.

## Modern Features to Utilize

### Type System & Inference
- **`const` Type Parameters (5.0)**: Use `const` type parameters for more precise literal inference.
  ```typescript
  declare function names<const T extends string[]>(...names: T): void;
  ```
- **`@satisfies` Operator (5.0)**: Use `satisfies` to validate types without widening them.
- **Inferred Type Predicates (5.5)**: Allow TypeScript to infer type predicates for functions that filter arrays or check types, reducing the need for explicit `is` return types.
- **`NoInfer` Utility (5.4)**: Use `NoInfer<T>` to block inference for specific type arguments when you want them to be determined by other arguments.
- **Narrowing**:
  - **Switch(true) (5.3)**: Utilize narrowing in `switch(true)` blocks.
  - **Boolean Comparisons (5.3)**: Rely on narrowing from direct boolean comparisons.
  - **Closures (5.4)**: Trust preserved narrowing in closures when variables aren't modified after the check.
  - **Constant Indexed Access (5.5)**: Use constant indices to narrow object/array properties.

### Syntax & Control Flow
- **Decorators (5.0)**: Use standard ECMAScript decorators (Stage 3).
- **`using` Declarations (5.2)**: Use `using` for explicit resource management (Disposable pattern) instead of manual cleanup.
  ```typescript
  using resource = new Resource();
  ```
- **Import Attributes (5.3/5.8)**: Use `with { type: "json" }` for import attributes. Avoid the deprecated `assert` syntax.
- **`switch` Exhaustiveness**: Rely on TypeScript's exhaustiveness checking in switch statements.

### Modules & Imports
- **`verbatimModuleSyntax` (5.0)**: Respect this flag by using `import type` explicitly when importing types to ensure they are erased during compilation.
- **Type-Only Imports with Extensions (5.2)**: You can use `.ts`, `.mts`, `.cts` extensions in `import type` statements.
- **`resolution-mode` (5.3)**: Use `import type { Type } from "mod" with { "resolution-mode": "import" }` if needed for specific module resolution contexts.
- **JSDoc `@import` (5.5)**: Use `@import` tags in JSDoc for cleaner type imports in JS files if working in a mixed codebase.

### Standard Library & Built-ins
- **Iterator Helpers (5.6)**: Use new iterator methods (map, filter, etc.) if targeting modern environments.
- **Set Methods (5.5)**: Utilize new `Set` methods like `union`, `intersection`, etc., when available.
- **`Object.groupBy` / `Map.groupBy` (5.4)**: Use these standard methods for grouping instead of external libraries like Lodash when appropriate.
- **`Promise.withResolvers` (5.7)**: Use `Promise.withResolvers()` for creating promises with exposed resolve/reject functions.

### Configuration & Tooling
- **`--moduleResolution bundler` (5.0)**: Assume this resolution strategy for modern web projects (Vite, Next.js, etc.).
- **`--erasableSyntaxOnly` (5.8)**: Be aware of this flag; avoid TypeScript-specific syntax that cannot be simply erased (like `enum`s or `namespaces`) if the project aims for maximum compatibility with tools like Node.js's `--strip-types`. Prefer `const` objects or unions over `enum`s if requested.

## Specific Coding Patterns

### Arrays & Collections
- Use **Copying Array Methods (5.2)** (`toSorted`, `toSpliced`, `with`) for immutable array operations.
- **TypedArrays (5.7)**: Be aware that TypedArrays are now generic over `ArrayBufferLike`.

### Classes
- **Parameter Decorators (5.0/5.2)**: Use modern standard decorators.
- **`super` Property Access (5.3)**: Avoid accessing instance fields via `super`.

### Error Handling
- **Checks for Never-Initialized Variables (5.7)**: Ensure variables are initialized before use to avoid new errors.

## Deprecations to Avoid
- Avoid `import ... assert` (use `with`).
- Avoid implicit `any` returns in `undefined`-returning functions (though 5.1 makes this easier, explicit is better).
- Avoid `enum`s if the project prefers erasable syntax (5.8).

## Version-Specific Highlights

### TypeScript 5.0
- **Decorators**: Use standard decorators unless `experimentalDecorators` is explicitly enabled.
- **`const` Type Parameters**: Use for literal inference.
- **Enums**: All enums are union enums.
- **Modules**: `--moduleResolution bundler` and `--verbatimModuleSyntax` are key for modern bundlers.

### TypeScript 5.1
- **Returns**: `undefined`-returning functions don't need explicit returns.
- **Getters/Setters**: Can have unrelated types with explicit annotations.

### TypeScript 5.2
- **Resource Management**: `using` declarations for `Symbol.dispose`.
- **Decorator Metadata**: Use `context.metadata` for design-time metadata.

### TypeScript 5.3
- **Import Attributes**: Use `with { type: "json" }`.
- **Switch(true)**: Narrowing works in `switch(true)`.

### TypeScript 5.4
- **Closures**: Narrowing preserved in closures if last assignment is before creation.
- **`NoInfer`**: Block inference for specific arguments.
- **Grouping**: `Object.groupBy` / `Map.groupBy`.

### TypeScript 5.5
- **Inferred Predicates**: Functions checking types often don't need explicit `is` return types.
- **Constant Index Access**: Better narrowing for constant keys.
- **Regex**: Syntax checking for regex literals.

### TypeScript 5.6
- **Truthiness Checks**: Errors on always-truthy/falsy conditions (e.g., `if (/regex/)`).
- **Iterator Helpers**: `.map`, `.filter` on iterators.

### TypeScript 5.7
- **Uninitialized Variables**: Stricter checks for never-initialized variables.
- **Relative Imports**: `--rewriteRelativeImportExtensions` for `.ts` imports in output.
- **ES2024**: Support for `Promise.withResolvers`, `Atomics.waitAsync`.

### TypeScript 5.8
- **Return Checks**: Granular checks for conditional returns.
- **Node Modules**: `--module node18` stable; `require()` of ESM allowed in `nodenext`.
- **Erasable Syntax**: `--erasableSyntaxOnly` forbids enums, namespaces, etc.

When generating code, always prefer the most modern, standard, and type-safe approach available in TypeScript 5.8.
