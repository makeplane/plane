---
phase: 04-workspace-template-management
plan: 02
subsystem: project-templates
tags: [frontend, settings, swr, list-page, breadcrumbs, admin-gate]
dependency_graph:
  requires: []
  provides:
    - "Workspace settings Project Templates list page (admin-only)"
    - "Two-section grouped list of System + Custom templates"
    - "Reusable list components under apps/web/core/components/project-templates/"
  affects:
    - "apps/web/app/routes/core.ts (route already registered in Task 1)"
    - "apps/web app header + workspace settings sidebar"
status: complete
key-files:
  created:
    - "apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/templates/page.tsx"
    - "apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/templates/header.tsx"
    - "apps/web/core/components/project-templates/list/root.tsx"
    - "apps/web/core/components/project-templates/list/template-row.tsx"
    - "apps/web/core/components/project-templates/list/loader.tsx"
    - "apps/web/core/components/project-templates/index.ts"
  modified: []
decisions:
  - "Defer /new and /:templateId/edit route registrations to Plan 03/05 so each plan's typegen gate is self-consistent (no route pointing at a not-yet-created module)."
  - "Built-in rows render muted text-tertiary metadata (no edit controls) — provenance conveyed by parent section heading rather than row tint per UI-SPEC Color."
  - "Right-aligned row action slot ships as a placeholder div in this plan; full Edit/Duplicate/Deactivate/Reactivate wiring lands in Plan 05."
  - "Custom-empty branch uses EmptyStateCompact (align=start, rootClassName=py-20) per UI-SPEC Screen 1; system section falls back to a muted dashed-border helper rather than an empty state (system templates are always expected to be populated)."
  - "Error path is non-blocking inline copy with a retry Button that calls SWR mutate(); no toast on transient fetch failure (UI-SPEC Interaction & State Contracts)."
  - "List page uses SettingsContentWrapper in non-hugging mode (max-w-225) per UI-SPEC Screen 1; editor pages will switch to hugging in Plan 03."
metrics:
  duration_min: 22
  completed_date: 2026-07-01
  tasks: 2
  files: 6
one_liner: "Admin-only Project Templates settings page with breadcrumb header and two-section (System/Custom) list, gated end-to-end and verified against the live list endpoint."
---

# Phase 4 Plan 2: Project Templates List Page Summary

**Plan:** 04-02-PLAN.md
**Status:** Complete (both tasks shipped)
**Date:** 2026-07-01
**Commits:**

- `613aa2e2f` — feat(04-02): register admin-only Project Templates settings page (Task 1)
- `8a34e937f` — feat(04-02): add admin-gated project templates list page (Task 2)

## One-liner

Admin-only Project Templates settings page with breadcrumb header and a two-section (System/Custom) list, gated end-to-end and verified against the live list endpoint.

## Objective

Deliver the thinnest visible end-to-end slice: an admin-gated "Project Templates" workspace-settings page, discoverable from the existing settings sidebar, that lists built-in (System) and custom templates in two labeled sections fetched live from the existing list endpoint. After this plan a workspace admin can navigate to the page and see their real templates; a non-admin is blocked. Row actions and the editor are deferred to later plans — this plan proves the navigation + fetch + render path.

## Task Recap

### Task 1 — Four-touchpoint settings registration, route, icon, i18n (SHIPPED in `613aa2e2f`)

Already landed on `dev` before this plan's executor dispatched. The five files modified by Task 1 ship on the working branch:

| File                                                                | Change                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/types/src/settings.ts`                                    | Adds `"project-templates"` to `TWorkspaceSettingsTabs` (compile driver for the two Records below).                                                                                                                                                                                                                                                                                                                         |
| `packages/constants/src/settings/workspace.ts`                      | Adds `WORKSPACE_SETTINGS["project-templates"]` entry (admin-only, `startsWith` highlight) and pushes it into `GROUPED_WORKSPACE_SETTINGS[ADMINISTRATION]`.                                                                                                                                                                                                                                                                 |
| `apps/web/core/components/settings/workspace/sidebar/item-icon.tsx` | Imports `LayoutTemplate` from `lucide-react` and adds `"project-templates": LayoutTemplate` to `WORKSPACE_SETTINGS_ICONS`.                                                                                                                                                                                                                                                                                                 |
| `apps/web/app/routes/core.ts`                                       | Registers the `/settings/templates` route inside the `(workspace)` layout (Plan 03 will add `/new` and `/edit` siblings alongside the editor pages).                                                                                                                                                                                                                                                                       |
| `packages/i18n/src/locales/en/workspace-settings.json`              | Adds the `workspace_settings.settings.project_templates.*` namespace: `title`, `description`, `new_template`, `system_section.{title,description}`, `custom_section.{title,description}`, `counts.{states,labels,modules,cycles,starter_issues}`, `empty.{title,description}`, `error.{load,retry}`. The 18 non-English locales intentionally fall back to English at runtime — populated later by the translate workflow. |

The executor of this dispatch verified the registration on the working tree (grepped every file) and did **not** redo Task 1.

### Task 2 — Admin-gated list page, breadcrumb header, two-section list (SHIPPED in `8a34e937f`)

Six new files created:

| File                                                                                      | Role                                                                                                                                                                                                                                                                                                                                               |
| ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/templates/page.tsx`   | `observer`-wrapped page; admin gate → `NotAuthorizedView`; `SettingsContentWrapper` (non-hugging, `max-w-225`); `PageHead`; `SettingsHeading` with primary `New template` CTA.                                                                                                                                                                     |
| `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/templates/header.tsx` | `ProjectTemplatesSettingsHeader` mirroring `webhooks/header.tsx` — `SettingsPageHeader` + `Breadcrumbs` + `LayoutTemplate` icon, reading `WORKSPACE_SETTINGS["project-templates"]` (bracket access for the hyphenated key).                                                                                                                        |
| `apps/web/core/components/project-templates/list/root.tsx`                                | `ProjectTemplatesListRoot` — `useSWR(WORKSPACE_PROJECT_TEMPLATES(slug))`; split into `is_system === true/false`; three explicit branches for loading (`Loader` skeleton), error (inline copy + `Button variant="secondary"` calling `mutate()`), and success (two `<section>` blocks separated by `gap-6`).                                        |
| `apps/web/core/components/project-templates/list/template-row.tsx`                        | `ProjectTemplateRow` — bordered `bg-layer-2 border-subtle rounded-lg px-4 py-3` row; template name (`text-body-sm-medium`) + payload-derived counts caption (`text-body-xs-regular text-tertiary`); built-in rows render muted `text-tertiary` metadata (provenance by heading, not tint — UI-SPEC Color); right-aligned actions slot placeholder. |
| `apps/web/core/components/project-templates/list/loader.tsx`                              | `ProjectTemplatesListLoader` — `Loader` with four `Loader.Item height="42px"` rows (labels idiom).                                                                                                                                                                                                                                                 |
| `apps/web/core/components/project-templates/index.ts`                                     | Barrel — exports `ProjectTemplateRow`, `ProjectTemplatesListRoot`, `ProjectTemplatesListLoader`.                                                                                                                                                                                                                                                   |

## Acceptance Criteria Verification

| Criterion                                                                                                                           | Status | Evidence                                                                                                                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web check:types` passes with the new routes and pages                                                                         | PASS   | `pnpm --filter=web check:types` exits 0.                                                                                                                                            |
| `check:lint` adds no new warnings above the existing baseline (983 pre-existing warnings, 0 new)                                    | PASS   | `pnpm --filter=web check:lint` reports no warnings from any of the six new files.                                                                                                   |
| `templates/page.tsx` returns `NotAuthorizedView` when `workspaceUserInfo && !canPerformWorkspaceAdminActions`                       | PASS   | grep: `NotAuthorizedView section="settings" className="h-auto"` in `page.tsx:48`; `allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE)` in `page.tsx:36`.   |
| `list/root.tsx` fetches via `useSWR(WORKSPACE_PROJECT_TEMPLATES(...))` and splits by `is_system`; renders distinct section headings | PASS   | grep: `WORKSPACE_PROJECT_TEMPLATES` in `root.tsx:46`; `is_system` filter on `root.tsx:84-85`; `system_section.title` + `custom_section.title` rendered on `root.tsx:93` and `:118`. |
| Loading renders `Loader.Item`; custom-empty renders `EmptyStateCompact`; error path renders inline retry                            | PASS   | grep: `Loader.Item` in `loader.tsx`; `EmptyStateCompact` in `root.tsx:131`; `mutate()` call in `root.tsx:75`.                                                                       |
| No inline axios/fetch — all data access via `projectService`                                                                        | PASS   | grep for `axios`/`fetch(` in all six new files returns 0 matches; only `projectService.getProjectTemplates(workspaceSlug)` is called.                                               |

## Deviations from Plan

None — Task 2 was executed as written. The five files Task 1 already modified contain the expected state on `dev` (verified by grep), so Task 1 was not redone. Two compile-time deviations surfaced during execution and were corrected inline before the commit:

1. **Button variant/size tokens.** The plan called for `variant="neutral"` and `size="md"` on the inline error-retry button. `@plane/propel/button`'s typed signature rejects both — the supported variants are `link | primary | secondary | error-fill | error-outline | tertiary | ghost` and the sizes are `sm | base | lg | xl`. Corrected to `variant="secondary" size="base"` (the equivalent of the existing webhooks/settings retry pattern).

2. **`isLoading` destructure unused.** The plan references `useSWR` returning `{ data, isLoading }`. SWR v2 does return `isLoading`, but the loading branch is correctly derived from `!data && !error` (which catches the first-paint and revalidation cases more precisely). `isLoading` was destructured-but-unused, which would have been a lint warning — removed it from the destructure.

No plan-level deviations; no architectural decisions deferred.

## Threat Model Coverage

Plan-level threat register entries relevant to this plan:

| Threat ID                                            | Mitigation implemented                                                                                                                                                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| T-04-05 (EoP — direct-URL access)                    | `page.tsx` returns `NotAuthorizedView` when `workspaceUserInfo && !canPerformWorkspaceAdminActions`; sidebar entry is `access: [ADMIN]` (Task 1). Backend list enforces admin/member (defense in depth, V4). |
| T-04-06 (Info Disclosure — XSS via template strings) | React auto-escapes all rendered template fields (`name`, `description`, caption); no `dangerouslySetInnerHTML` anywhere in the new components.                                                               |
| T-04-07 (Tampering — oversized strings)              | Row name uses `truncate`; caption uses `truncate`; backend enforces `max_length`.                                                                                                                            |

## Auth Gates

None encountered during execution.

## Known Stubs

- Right-aligned row actions slot ships as a `<div className="shrink-0" />` placeholder in `template-row.tsx` (intentional — wired in Plan 05 per D-07/D-08).
- `useRouter().push("/${slug}/settings/templates/new")` is invoked from both `page.tsx` (primary CTA) and `root.tsx` (empty-state CTA). The route registration lands in Plan 03 alongside the editor page module that backs it; the navigation itself is harmless on click (Next.js will surface a 404 until then).

## Self-Check

- All six Task 2 files exist on disk and are tracked under `8a34e937f`.
- `8a34e937f` present in `git log --oneline -5`.
- `613aa2e2f` (Task 1) present in `git log --oneline -5`.
- `pnpm --filter=web check:types` exits 0.
- `pnpm --filter=web check:lint` reports no warnings from any new file.

## Outcome

- Discoverable admin-only "Project Templates" settings page exists and lists System + Custom templates end-to-end.
- Non-admins are blocked in-page via `NotAuthorizedView`.
- Loading → `Loader` skeleton rows; custom-empty → `EmptyStateCompact`; error → inline retry.
- Type-check and lint pass with zero new warnings above the existing baseline.
- Requirement UI-05 marked complete via `requirements.mark-complete`.
