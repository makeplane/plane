# Phase 2 — Workweek Chip Pills (Vertical List → Horizontal Pills)

## Context Links

- Parent: [plan.md](./plan.md)
- Depends on: [phase-01-route-simplification.md](./phase-01-route-simplification.md) (host route stable)
- Reads: `apps/admin/components/calendar/workweek-toggle.tsx` (current vertical list)
- Rule refs: `.claude/rules/color-tokens.md`, `.claude/rules/component-libraries.md`

## Overview

- **Priority**: P2
- **Status**: ✅ Complete
- **Effort**: 0.5d
- **Description**: Replace 7-row Switch list (~350px tall) with 7 horizontal chip buttons (T2 T3 T4 T5 T6 T7 CN). Single row, full-width even distribution. Click toggles `week_pattern[index]`, debounced 300ms persist via `updateSchedule`. Active = solid accent; inactive = muted with strikethrough.

## Key Insights

- Current implementation already correct on data shape (`boolean[7]` Mon=0..Sun=6) and debounce — only visual presentation changes
- Drop `<Switch>` component dependency for chips (button + cn classes is simpler — KISS)
- Use button `aria-pressed={isActive}` + `role="button"` for a11y; treat each chip as toggle not radio
- Single-source `WEEKDAY_LABELS` array of `{ label, full }` already idiomatic — keep
- `aria-label` should expose full Vietnamese name (`Thứ Hai`) for screen readers; visible label is short (`T2`)
- Strikethrough on inactive uses `line-through` Tailwind utility

## Requirements

### Functional

1. 7 chips render in single horizontal row, evenly distributed full-width of parent container
2. Active chip: visible label only, accent background, `text-on-color`, no strikethrough
3. Inactive chip: visible label with `line-through`, muted background, tertiary text
4. Click any chip → flips boolean → debounced save (300ms) → toast on error
5. Hover state: subtle highlight (`hover:bg-accent-subtle` for inactive, slightly lighter for active)
6. Disabled while save pending (optional — current code does NOT disable; keep behavior)
7. Header text "Bật/tắt các ngày trong tuần. Thay đổi tự động lưu sau 300ms." retained above chips

### Non-functional

- File size <100 lines (currently 73 — should stay under)
- Zero new dependencies
- Maintain `observer()` MobX wrapper
- Semantic tokens only — no `bg-blue-500`, `bg-gray-300`, etc.

## Architecture

### Visual layout

```
┌─────────────────────────────────────────────────────────────┐
│ Bật/tắt các ngày trong tuần. Thay đổi tự động lưu sau 300ms.│
├─────────────────────────────────────────────────────────────┤
│  ┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐                │
│  │ T2 ││ T3 ││ T4 ││ T5 ││ T6 ││ ̶T̶7̶ ││ ̶C̶N̶ │  ← chip pills    │
│  └────┘└────┘└────┘└────┘└────┘└────┘└────┘                │
│  active active active active active inact. inact.          │
└─────────────────────────────────────────────────────────────┘
```

### Class matrix (semantic tokens only)

| State    | Base                                                                                                              | Hover                    | Border                 |
| -------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------ | ---------------------- |
| Active   | `bg-accent-primary text-on-color`                                                                                 | `hover:bg-accent-strong` | `border-accent-strong` |
| Inactive | `bg-surface-2 text-tertiary line-through`                                                                         | `hover:bg-accent-subtle` | `border-subtle`        |
| Common   | `flex-1 px-3 py-2 rounded-md border text-body-sm-medium text-center transition-colors cursor-pointer select-none` | —                        | —                      |

### Component structure (chosen: keep inline)

If file stays <150 lines (likely ~80 after refactor), inline the chip rendering directly. Skip extracting `weekday-chip.tsx` (YAGNI). Re-evaluate at end of step 4 — if line count grows past 150, extract.

```tsx
<div className="flex w-full gap-2">
  {WEEKDAY_LABELS.map(({ label, full }, index) => {
    const isActive = Boolean(schedule.week_pattern[index]);
    return (
      <button
        key={index}
        type="button"
        aria-label={full}
        aria-pressed={isActive}
        onClick={() => handleToggle(index, !isActive)}
        className={cn(
          "flex-1 px-3 py-2 rounded-md border text-body-sm-medium text-center transition-colors cursor-pointer select-none",
          isActive
            ? "bg-accent-primary text-on-color border-accent-strong hover:bg-accent-strong"
            : "bg-surface-2 text-tertiary line-through border-subtle hover:bg-accent-subtle"
        )}
      >
        {label}
      </button>
    );
  })}
</div>
```

### Data flow (unchanged)

```
chip click
  → handleToggle(index, nextBoolean)
  → clearTimeout(prev) → setTimeout(300ms)
    → updateSchedule(scheduleId, { week_pattern: [...] })
    → store.set(schedulesMap, id, updatedSchedule)
    → MobX rerender → chip reflects new state
  → on error: setToast ERROR
```

## Related Code Files

### Modify

- `apps/admin/components/calendar/workweek-toggle.tsx` — replace render JSX (handleToggle logic untouched)

### Create

- (none — inline chip rendering keeps file <150 lines)
- **Conditional**: if line count exceeds 150 after refactor → extract `apps/admin/components/calendar/weekday-chip.tsx` (single-purpose chip with props `{ label: string; full: string; isActive: boolean; onClick: () => void }`)

### Delete

- (none)

## Implementation Steps

1. Open `apps/admin/components/calendar/workweek-toggle.tsx`
2. Remove `Switch` import from `@plane/propel/switch` (no longer needed)
3. Add `cn` import from `@plane/utils`
4. Replace JSX section (lines 48-71) with horizontal flex container of 7 buttons
5. Preserve `WEEKDAY_LABELS`, `handleToggle`, `debounceRef`, `observer()` wrapper
6. Update header text wrapper: `<div className="space-y-3">` → keep, child `<p>` → keep
7. Container: `<div className="flex w-full gap-2">` outer chips wrapper
8. Each chip: `<button>` with class matrix above, `aria-pressed={isActive}`, `aria-label={full}`
9. Verify line count <150; if exceeds, extract `weekday-chip.tsx`
10. Run `pnpm typecheck --filter admin` — expect 0 errors
11. Run `pnpm format` to apply Prettier (120-char width)
12. Manual smoke (each theme: light, dark, light-contrast, dark-contrast):
    - All 7 chips render in single row
    - Active chips show accent fill, no strikethrough
    - Inactive chips show muted bg with strikethrough
    - Click toggles state visually within ~50ms
    - Save fires after 300ms inactivity
    - Refresh page persists state (backend round-trip works)

## Todo List

- [ ] P2.1 Remove `Switch` import, add `cn` import
- [ ] P2.2 Replace render JSX with horizontal chip flex container
- [ ] P2.3 Apply class matrix per state (active/inactive)
- [ ] P2.4 Add `aria-pressed` + `aria-label` to chip buttons
- [ ] P2.5 Verify line count <150 (extract `weekday-chip.tsx` only if exceeded)
- [ ] P2.6 `pnpm typecheck --filter admin` → 0 errors
- [ ] P2.7 `pnpm format` (Prettier clean)
- [ ] P2.8 Manual smoke 4 themes + 300ms debounced save round-trip

## Success Criteria

- 7 chips render in single horizontal row, evenly distributed (`flex-1`)
- Active chips: solid accent bg, on-color text, no strikethrough
- Inactive chips: muted bg, tertiary text, strikethrough
- Click toggles after 300ms with backend persistence (verify via DB query: `SELECT week_pattern FROM business_work_schedule WHERE is_default = true`)
- All 4 themes render correctly (manual screenshot or visual check)
- File <150 lines
- TypeScript: 0 errors
- Backend untouched: `git diff apps/api/` empty

## Risk Assessment

| Risk                                                                    | Likelihood | Impact | Mitigation                                                             |
| ----------------------------------------------------------------------- | ---------- | ------ | ---------------------------------------------------------------------- |
| Chip text overflows on narrow viewport                                  | Low        | Low    | Desktop-only target ≥1920px; not a concern                             |
| `aria-pressed` not announced by VoiceOver/NVDA                          | Low        | Low    | Pair with `aria-label` (full VN name); standard pattern                |
| Hover bg `bg-accent-subtle` clashes with inactive `bg-surface-2`        | Low        | Low    | Verify on 4 themes; fallback `hover:bg-surface-3` if exists            |
| Active hover state too dark on `dark-contrast`                          | Low        | Low    | `hover:bg-accent-strong` is darker on contrast themes; verify visually |
| User clicks 7 chips rapidly → only last save fires (debounce)           | Medium     | Low    | Acceptable behavior — last-write-wins; existing logic                  |
| `text-on-color` invisible on `light-contrast` if accent token redefined | Low        | Med    | Smoke test all 4 themes mandatory before merge                         |

## Security Considerations

- No new auth surface — `updateSchedule` already protected by `InstanceAdminPermission`
- Client-side state mutation does not bypass backend validation (week_pattern length=7 enforced server-side)
- No new PII or secrets exposed

## Next Steps

- After merge, P3 can proceed (independent file owner)
- Future enhancement: keyboard-driven chip navigation (Tab + Space) — already free with native `<button>` semantics; verify focus-ring visible
