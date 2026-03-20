# @plane/blocks

Domain-specific component library built on `@plane/propel` primitives. Contains composed, higher-level components that combine propel primitives with business logic and domain knowledge.

## Architecture

```
@plane/propel (primitives)
    ↓
@plane/blocks (domain components)
    ↓
apps/web, apps/space, etc.
```

- **propel** — Generic, reusable UI primitives (Button, Dialog, Input, etc.)
- **blocks** — Plane-specific composed components (e.g., WorkItemProperty, MemberSelector)
- **apps** — Application-level pages and features consuming both

## Adding a New Component

Each component lives in its own directory under `src/`:

```
src/
  my-component/
    my-component.tsx        # Implementation
    my-component.stories.tsx # Storybook story
    my-component.types.ts   # Types (if needed)
    index.ts                # Barrel export
```

### Naming Conventions

- Directory: `kebab-case` (e.g., `member-selector`)
- Component file: `kebab-case.tsx` matching directory name
- Component name: `PascalCase` (e.g., `MemberSelector`)
- `displayName`: `"blocks.MemberSelector"`
- Stories file: `kebab-case.stories.tsx`

### Import Patterns

```tsx
// Import propel primitives
import { Button } from "@plane/propel/button";
import { Dialog } from "@plane/propel/dialog";

// Import from sibling packages
import { EIssuePropertyType } from "@plane/constants";
import { useMember } from "@plane/hooks";
import type { IMember } from "@plane/types";

// Import local utils
import { cn } from "#src/utils/classname";
```

## Development

```bash
# Start Storybook (port 6007)
pnpm --filter=@plane/blocks storybook

# Build
pnpm --filter=@plane/blocks build

# Type check
pnpm --filter=@plane/blocks check:types

# Run tests
pnpm --filter=@plane/blocks test
```

## Conventions

- Every source file must include the copyright header (see AGENTS.md for current template and guidance)
- Use `cn()` from local utils for className merging (re-exported from propel)
- Prefer composition of propel primitives over reimplementing UI patterns
- All components should have a corresponding `.stories.tsx` file
