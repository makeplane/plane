---
title: "Shinhan Bank Branding — Login Page"
status: pending
priority: P2
effort: 30m
---

# Phase 2 — Shinhan Bank Branding on Login Page

## Context Links

- Plan: [plan.md](./plan.md)
- Auth screen header: `apps/web/core/components/auth-screens/header.tsx`
- Auth screen footer: `apps/web/core/components/auth-screens/footer.tsx`
- Auth base layout: `apps/web/core/components/auth-screens/auth-base.tsx`

## Overview

Customize login page branding to reflect Shinhan Bank's identity while keeping Plane CE platform attribution.

## Requirements

1. **Top-left logo**: Add Shinhan Bank logo alongside existing Plane logo (separated by a divider)
2. **Remove brand logos**: Delete Zerodha, Sony, Dolby, Accenture logos from footer
3. **Footer attribution**: Replace brand logos with "Powered by Plane CE" text + Shinhan Bank customization note

## Key Insights

- Top-left logos in `auth-screens/header.tsx` → `AuthHeaderBase` component, uses `PlaneLockup` from `@plane/propel/icons`
- Footer in `auth-screens/footer.tsx` → `AuthFooter` component with `BRAND_LOGOS` array
- Shinhan Bank logo asset needs to be added to `apps/web/app/assets/` (SVG preferred)
- Semantic color tokens must be used (no hardcoded colors)

## Architecture

```
AuthBase (auth-base.tsx)
├── AuthHeader (header.tsx)         ← ADD Shinhan logo next to PlaneLockup
│   └── AuthHeaderBase
│       └── [PlaneLockup] + [divider] + [ShinhanLogo]
├── AuthRoot (auth-root.tsx)        ← No changes
│   └── StaffIdLoginForm
└── AuthFooter (footer.tsx)         ← REWRITE: remove brand logos, add attribution
    └── "Powered by Plane CE — Customized for Shinhan Bank Vietnam"
```

## Related Code Files

### Files to Modify

| File                                               | Action                                                        |
| -------------------------------------------------- | ------------------------------------------------------------- |
| `apps/web/core/components/auth-screens/header.tsx` | Add Shinhan logo next to PlaneLockup with `×` or `\|` divider |
| `apps/web/core/components/auth-screens/footer.tsx` | Remove brand logos, add "Powered by Plane" attribution        |

### Files to Create

| File                                              | Purpose               |
| ------------------------------------------------- | --------------------- |
| `apps/web/app/assets/logos/shinhan-bank-logo.svg` | Shinhan Bank SVG logo |

## Implementation Steps

### 1. Add Shinhan Bank logo asset

- Source or create Shinhan Bank logo in SVG format
- Save to `apps/web/app/assets/logos/shinhan-bank-logo.svg`
- Keep reasonable dimensions (height ~20-24px when rendered)

### 2. Update `header.tsx` — Add co-branding

In `AuthHeaderBase`, modify the logo section:

```tsx
// Current:
<Link href="/">
  <PlaneLockup height={20} width={95} className="text-primary" />
</Link>

// New:
<Link href="/" className="flex items-center gap-3">
  <img src={ShinhanBankLogo} alt="Shinhan Bank" className="h-6" />
  <span className="text-color-tertiary text-sm">×</span>
  <PlaneLockup height={20} width={95} className="text-primary" />
</Link>
```

- Import logo: `import ShinhanBankLogo from "@/app/assets/logos/shinhan-bank-logo.svg";`
- Divider: use `×` or `|` character in `text-color-tertiary`
- Shinhan logo first (left), then divider, then Plane logo

### 3. Update `footer.tsx` — Replace brand logos with attribution

```tsx
export function AuthFooter() {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-13 text-tertiary whitespace-nowrap">Join 10,000+ teams building with Plane</span>
      <span className="text-xs text-color-tertiary">Powered by Plane CE — Customized for Shinhan Bank Vietnam</span>
    </div>
  );
}
```

- Remove `BRAND_LOGOS` array and all brand icon imports
- Remove brand logo rendering loop
- Add attribution text below existing tagline
- Use `text-color-tertiary` + `text-xs` for subtle appearance

## Todo List

- [ ] Source/create Shinhan Bank SVG logo
- [ ] Add logo to `apps/web/app/assets/logos/`
- [ ] Update `header.tsx` — co-branded logo section
- [ ] Update `footer.tsx` — remove brands, add attribution
- [ ] Verify dark mode compatibility (semantic tokens)
- [ ] Build check: `pnpm turbo run build --filter=web`

## Success Criteria

- Shinhan Bank logo visible top-left alongside Plane logo
- No Zerodha/Sony/Dolby/Accenture logos on page
- Attribution text visible at bottom: "Powered by Plane CE — Customized for Shinhan Bank Vietnam"
- Dark mode works correctly (semantic color tokens)
- Build passes

## Risk Assessment

- **Logo quality**: SVG preferred for crisp rendering at all sizes; PNG fallback acceptable
- **Dark mode**: Logo must be visible in both light/dark themes — consider using `dark:invert` or dual-theme logo

## Security Considerations

- No sensitive data involved — purely visual branding change
