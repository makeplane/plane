---
phase: 7
title: "Discovery and Contextual Help"
status: done
priority: P2
effort: "1d"
dependencies: [5]
---

# Phase 7: Discovery and Contextual Help

## Implementation Status — 2026-05-30 (entry points done; verified live)

2 discovery entry points to `/:workspaceSlug/help`, browser-verified. **Design note (user-confirmed):**
the Help Center IS the self-hosted guide, so it REPLACES the former (dead) `${origin}/docs` link
that the fork had repointed for self-hosting (`fix(help-menu): customize docs link…`). No new
top-level sidebar nav entry — the help guide lives in the existing help surfaces, not a per-workspace
sidebar item.

- **Header "?" help menu** (`HelpMenuRoot`, top-right near the version, rendered in
  `ce/components/navigations/top-navigation-root.tsx`): the "Documentation" item (→ dead `${origin}/docs`)
  is REPLACED by a "Help Center" item routing to `/:workspaceSlug/help` — `workspace/sidebar/help-section/root.tsx`.
- **Cmd+K command** "Help Center" (open-only, D5-compliant — no search-results group): replaces the
  dead `open_plane_documentation` command — `power-k/config/help-commands.ts`.

Both use `t("help_center.menu_label")` + `LifeBuoy` icon. Verified via Playwright (authenticated session):
the "?" dropdown shows "Help Center" (not "Documentation") above the version; Cmd+K shows "Help Center"
(no "Documentation"); the left sidebar has NO Help entry. eslint clean (1 pre-existing unrelated warning).

**Reverted from the first attempt:** the top-level left-sidebar nav entry (it showed in every one of
the ~100 workspaces — too intrusive). **Deferred:** `<HelpHint slug>` contextual "?" on core screens.

### D7 Rework — retarget entry points to standalone `/help` (2026-05-30, validated)

When the reader moves to standalone `/help` (D7), the two committed entry points retarget:
- `help-section/root.tsx` + `help-commands.ts`: `router.push(/${workspaceSlug}/help)` → `router.push("/help")`.
- **Discovery is GLOBAL (user-confirmed):** REMOVE the `!!workspaceSlug` gating so the help "?" menu item
  and the Cmd+K command are visible+functional for EVERY authenticated user (push `/help`, no slug needed).
  `/help` is auth-gated but visible to all logged-in users regardless of workspace.
- **Reserve `help` in `RESTRICTED_URLS`** (`packages/constants/src/workspace.ts`) so no workspace slug
  can be "help" and shadow the top-level route (decision D-5).
- **Optional legacy redirect** `/{slug}/help[/a/:slug]` → `/help[...]` for already-shared links (decision D-3).

## Overview

Make the Help Center discoverable: a Cmd+K (PowerK) "Help Center" command that OPENS `/help`, a
prominent top-level sidebar Help nav entry, an internal sidebar Help-menu item, a reusable contextual
"?" hint component for feature screens, and consistent empty states. **All help search/lookup lives in
the in-page `/help` search box (Phase 5) — there is NO Help search-results group in Cmd+K (D5).** Prefer
CE extension seams; keep any unavoidable core touch minimal and isolated.

## Requirements

- Functional: open Help Center from Cmd+K (command only — no in-Cmd+K results); a top-level sidebar Help
  nav entry + a "Trung tâm trợ giúp" item in the sidebar Help dropdown; reusable `<HelpHint slug>` "?"
  linking to an article; help-aware empty states.
- Non-functional: feature logic in `ce/`; any `core/` edit is ≤ a few lines registering a CE-provided
  command/item (flag for review); respects locale. **`searchWorkspace()` / global Cmd+K search backend
  is NOT touched** (D5).

## Architecture

**PowerK static command — OPEN ONLY (sanctioned core edit — Finding 5)** — add a "Help Center" action
(group `"help"`) routing to `/:workspaceSlug/help`. There is NO CE seam for top-level static commands —
`useProjectsAppPowerKCommands` (`apps/web/core/components/power-k/config/commands.ts:9-33`) imports
sources statically and CE `actions/index.ts:8` only re-exports work-item context actions. So this IS a
sanctioned core edit: copy `open_plane_documentation` (`power-k/config/help-commands.ts:35-48`), change
`action` to `ctx.router.push(/${slug}/help)`. Keep it to one isolated entry; do not refactor core.

**NO Cmd+K Help search-results group (D5)** — deliberately dropped. The CE seam
`SEARCH_RESULTS_GROUPS_MAP_EXTENDED` (`.../search-results-map.tsx:14`) is presentation-only and never
fetches; the Cmd+K modal renders ONLY keys present in the single `workspaceService.searchWorkspace()`
payload (fixed 7 keys, no `help` key — `search-menu.tsx:52`, `search-results.tsx:34-38`). Surfacing help
there would require a core+API change to `searchWorkspace()` + `IWorkspaceSearchResults`. Per D5 we do
NOT do that: **all help lookup is the in-page `/help` search box (Phase 5)**, which already supports
multilingual (VI/EN/KO) + Vietnamese accent-insensitive search via the folded `search_text` column +
`AccentInsensitiveSearchFilter` (Phase 1/2). The Cmd+K command takes the user TO `/help`, where they
search. Do NOT register a `help` key in the CE seam, do NOT modify `searchWorkspace`.

**Prominent top-level sidebar Help nav (sanctioned core edit — D4/g10)** — to maximise discoverability
for non-technical staff, add a top-level Help entry at the STATIC navigation level alongside
Home/Dashboards in `WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS_LINKS` (`packages/constants/src/workspace.ts`
— grep for that constant). Renders via the existing `SidebarItem` pattern
(`sidebar-menu-items.tsx:100-102`), no new component. Icon: `LifeBuoy` (Lucide); label key:
`help_center.menu_label`; href: `/:workspaceSlug/help`. Isolated (add one entry object, do not refactor
the constant).

**Sidebar Help dropdown item (sanctioned core edit — Finding 5)** — also add an internal item to
`apps/web/core/components/workspace/sidebar/help-section/root.tsx` (the file opens `/docs` externally at
line 77 — `CustomMenu` imported from `@plane/ui:15`). Insert a `<CustomMenu.MenuItem>` →
`router.push(/${workspaceSlug}/help)`, icon `HelpCircle`,
label `t("help_center.menu_label")` (flat-merged key — NOT `t("core.help_center")`, Finding 6). Place it
FIRST in the dropdown so non-technical staff see it immediately ("Trung tâm trợ giúp" = vi value of
`help_center.menu_label`). Isolated, ≤ a few lines.

**Contextual `<HelpHint>`** (`apps/web/ce/components/help-center/help-hint.tsx`) — a small "?" icon
button that links to `/help/a/:slug` (new tab or in-app). Reusable, self-contained in CE. Use Propel
`Button` (ghost/icon variant) with a Lucide `HelpCircle` and `text-icon-primary` token so it matches the
native icon-button look in core screens (do NOT hand-roll the button). Integrate on a
CURATED few high-value screens only (project header, work-item, cycles) — each integration is a 1-line
core touch; keep the set small to bound blast radius. Broad per-screen rollout = follow-up.

**Empty states** — use `help_center.no_articles_yet/no_categories_yet` (Phase 3) in Reading UI;
optionally surface a "Visit Help Center" link in existing feature empty states (CE component, opt-in).

## Related Code Files

### CE (no core edit)

- Create: `apps/web/ce/components/help-center/help-hint.tsx`
  (NOTE: do NOT touch the Cmd+K CE seam `search-results-map.tsx` / `power-k/types.ts` — D5, no Cmd+K Help search.)

### Sanctioned core edits (isolated, do NOT refactor core)

- Modify: `apps/web/core/components/power-k/config/help-commands.ts` — add static "Help Center" OPEN command
- Modify: `packages/constants/src/workspace.ts` — add Help entry to `WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS_LINKS` (top-level sidebar nav)
- Modify: `apps/web/core/components/workspace/sidebar/help-section/root.tsx` — add first-position internal Help item (`t("help_center.menu_label")`)
- Modify (≤3 screens): one-line `<HelpHint>` placements in curated core screens (project header, work-item, cycles)

### Read for pattern

- `apps/web/core/components/power-k/config/help-commands.ts:35-48` (copy `open_plane_documentation`)
- `apps/web/core/components/power-k/config/commands.ts:17-35` (aggregator)
- `apps/web/core/components/workspace/sidebar/help-section/root.tsx:77` (existing `/docs` item)
- `apps/web/core/components/workspace/sidebar/sidebar-menu-items.tsx:100-102` (SidebarItem pattern)

## Implementation Steps

1. Add the static "Help Center" PowerK command: isolated core edit to `help-commands.ts`, copy `open_plane_documentation`, action = `ctx.router.push(/${slug}/help)`. No CE seam exists; this is the ONLY Cmd+K touch.
2. Add top-level Help nav entry: add one object to `WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS_LINKS` in `packages/constants/src/workspace.ts`; icon `LifeBuoy`, key `help_center.menu_label`, href `/:workspaceSlug/help`. Isolated, do not refactor the constant.
3. Add sidebar dropdown internal Help item (first position in `help-section/root.tsx`, router push to `/help`, `t("help_center.menu_label")`).
4. Build `<HelpHint slug>` component (CE); integrate on ≤3 curated screens (project header, work-item, cycles) with 1-line core touch each. List integrations explicitly in PR.
5. Wire help-aware empty states.
6. Verify: Cmd+K "Help Center" command opens `/help`; top-level sidebar nav item + dropdown item (first) navigate to `/help`; "?" deep-links resolve; locale respected. Confirm NO `help` key was added to the Cmd+K search seam.

## Success Criteria

- [ ] Cmd+K shows a "Help Center" command that OPENS `/help` (sanctioned core edit to `help-commands.ts`; no search-results group)
- [ ] Top-level sidebar nav has a Help entry (alongside Home/Dashboards) → one-click access for non-technical staff (D4)
- [ ] Sidebar Help dropdown has "Trung tâm trợ giúp" as FIRST item (localized, `t("help_center.menu_label")`) → `/help`
- [ ] `<HelpHint slug>` renders a "?" that deep-links to the right article; used on ≤3 curated screens
- [ ] NO Cmd+K Help search-results group; `searchWorkspace()` / `IWorkspaceSearchResults` UNCHANGED (D5). All help lookup is the in-page `/help` search box (Phase 5).
- [ ] Empty states reference the Help Center; locale respected
- [ ] Sanctioned core edits limited to: PowerK open command (1) + top-level Help nav constant (2) + sidebar dropdown item (3) + ≤3 HelpHint placements; all isolated, self-documented (no plan refs in code comments)

## Risk Assessment

- **Sanctioned core edits** → 3 fixed categories + ≤3 HelpHint placements; all isolated (≤ a few lines
  each), no refactoring of core logic. Reviewers MUST expect these; call out in PR. Do NOT refactor core
  patterns while making these edits.
- **No Cmd+K Help search (D5)** → confirm no `help` key is registered in the CE seam and `searchWorkspace`
  is untouched. All help search lives in the `/help` in-page box (Phase 5) — which carries the
  multilingual + accent-insensitive requirement, so discovery does not regress.
- **Top-level Help nav** → adding an entry to `WORKSPACE_SIDEBAR_STATIC_NAVIGATION_ITEMS_LINKS` is low
  risk (constant extend, one object); verify the constant type accepts the new entry without casting.
- **`<HelpHint>` core touches** → each integration = 1-line import+JSX; bound to ≤3 curated screens.
  List all 3 in the PR explicitly so reviewers expect the touches.
