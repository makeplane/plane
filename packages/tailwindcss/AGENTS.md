# Tailwind Config

Shared Tailwind CSS configuration with semantic design system tokens.

See [docs/TYPESCRIPT.md](../../docs/TYPESCRIPT.md) for conventions.

## Design System

Uses a **Canvas → Surface → Layer** hierarchy for consistent UI depth:

| Token                | Purpose               | Rule                                   |
| -------------------- | --------------------- | -------------------------------------- |
| `bg-canvas`          | App root background   | Only once, at application root         |
| `bg-surface-{1,2,3}` | Page-level containers | Siblings, never nested (except modals) |
| `bg-layer-{1,2,3}`   | Nested elements       | Match layer number to parent surface   |

**Key rules:**

- `bg-surface-1` → use `bg-layer-1` for children
- Hover: always `bg-layer-X hover:bg-layer-X-hover` (matching)
- Modals/overlays can reset to `bg-surface-1` (different z-plane)

## Semantic Tokens

**Text**: `text-primary`, `text-secondary`, `text-tertiary`, `text-placeholder`

**Borders**: `border-subtle`, `border-subtle-1`, `border-strong`, `border-strong-1`

**States**: `-hover`, `-active`, `-selected` variants for layers

## Full Documentation

See [docs/DESIGN_SYSTEM.md](../../docs/DESIGN_SYSTEM.md) for complete guide with examples, decision trees, and common patterns.
