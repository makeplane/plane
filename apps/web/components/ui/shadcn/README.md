# shadcn/ui components

Copied from the [shadcn/ui](https://ui.shadcn.com) registry (MIT), `base-vega` style, which is
built on Base UI (`@base-ui/react`, already a web dependency). Only the parts we use are kept.

shadcn's colour classes (`bg-primary`, `text-muted-foreground`, `ring-ring`, ...) are swapped for
Plane's tokens, because several of its names already mean something else here (`text-primary` is
Plane's main text colour, not the brand colour). So `pnpm dlx shadcn add` output cannot be dropped
in as is: map its classes the same way.

| shadcn                                   | Plane                                      |
| ---------------------------------------- | ------------------------------------------ |
| `bg-background`, `bg-card`, `bg-popover` | `bg-surface-1`                             |
| `text-foreground`, `*-foreground`        | `text-primary`                             |
| `text-muted-foreground`                  | `text-secondary` / `text-tertiary`         |
| `bg-muted`, `bg-accent` (hover, focus)   | `bg-layer-1`, `bg-layer-transparent-hover` |
| `bg-primary text-primary-foreground`     | `bg-accent-primary text-on-color`          |
| `border-border`, `border-input`          | `border-subtle`, `border-strong`           |
| `ring-ring`                              | `ring-accent-strong`                       |
| `destructive`                            | `danger-*`                                 |

`tw-animate-css` is not installed, so enter/exit animations use Base UI's
`data-starting-style` / `data-ending-style` transitions instead of `animate-in`.
