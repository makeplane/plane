# Phase 3: Integration — Place Indicator in Header

**Priority**: High | **Status**: Pending | **Effort**: Small

## Overview

Insert `DailyLogtimeIndicator` into `top-navigation-root.tsx`, positioned to the left of the notification (Inbox) button.

## Related Code Files

**Modify:**

- `apps/web/ce/components/navigations/top-navigation-root.tsx`

## Implementation Steps

1. Import `DailyLogtimeIndicator` in `top-navigation-root.tsx`
2. Add component before the `<Tooltip tooltipContent="Inbox">` block (line 61)

Target layout in the right section:

```tsx
<div className="shrink-0 flex-1 flex gap-1 items-center justify-end">
  <DailyLogtimeIndicator />   {/* NEW */}
  <Tooltip tooltipContent="Inbox" ...>
    ...
  </Tooltip>
  <HelpMenuRoot />
  <div ...><UserMenuRoot /></div>
</div>
```

3. Run `pnpm check:lint` to verify no errors

## Todo

- [ ] Import and place component in header
- [ ] Verify visual alignment with other header items
- [ ] Run lint check

## Success Criteria

- Indicator visible to the left of notification bell
- Vertically centered with other header items
- No layout shift or overflow issues
- Lint passes
