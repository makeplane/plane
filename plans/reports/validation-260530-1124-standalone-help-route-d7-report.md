# Validation — Standalone top-level `/help` (D7), no workspace

**Date:** 2026-05-30 · **Method:** 7-agent workflow (4 feasibility scouts + 3 red-team lenses), evidence-grounded in code.
**Verdict: GO — feasible.** Backend = ZERO change (read API already global). Frontend = small-to-medium (~2–3h). One red-team correction is important (don't ship a bare shell). 5 decisions need your sign-off.

## 1. What was validated
Move the Help Center reader from workspace-prefixed `/:workspaceSlug/help` → **standalone top-level `/help`** + `/help/a/:articleSlug`, with NO workspace context (workspace-agnostic, instance-global).

## 2. Feasibility (verified facts)
- **Routing/auth: feasible.** Precedent exists — `/settings/profile`, `/create-workspace`, `/onboarding` are standalone auth-gated routes under `(all)/layout.tsx` WITHOUT `[workspaceSlug]`. `AuthenticationWrapper(EPageTypes.AUTHENTICATED)` gates login but does NOT require workspace membership. So `/help` lives at `apps/web/app/(all)/help/{layout,page,article}.tsx`. (`authentication-wrapper.tsx:90-120`, `settings/profile/layout.tsx`.)
- **Backend: no change.** Read API (`plane/app/views/help_center/*`) already `IsAuthenticated` + zero workspace filter; `/api/help/...` has no slug. Slug endpoint already global.
- **Editor/asset render: feasible-with-work.** `help-content-renderer.tsx` currently hard-guards `if(!workspaceId) return null` — must drop it. Scope red-team verdict: **the workspaceId guard is dead weight; ship P5 render without blocking on P6 asset infra.** Text + articles whose images already use global URLs render fine. Images uploaded via P6 must use the global static URL.
- **Impact on committed code: small-medium.** Files to change: `extended.ts` (route), new `(all)/help/{layout,page,article}.tsx`, `help-content-renderer.tsx` (drop guard), `help-center-header.tsx` + `help-article-footer.tsx` + `article-list.tsx` (links → `/help/...`), `help-article-view.tsx` (no more `workspaceSlug` param), `help-section/root.tsx` + `help-commands.ts` (push `/help`). Backend untouched.

## 3. Red-team corrections (must fold into the spec)
1. **[HIGH] Do NOT ship a "bare shell."** The cited precedent `/settings/profile` is NOT bare — it renders its own sidebar (`ProfileSettingsSidebarWorkspaceOptions`) listing every workspace as a return link. A standalone `/help` with no nav = dead-end (only browser-back). **Fix:** give `/help` a lightweight shell with a **"Back to {workspace}" affordance** (+ optional workspace switcher), modeled on the profile sidebar. Closes the "how do I get back" question.
2. **[HIGH] Back-target data source = server, not localStorage.** `last_workspace_slug` already exists in user settings (`settings.store.ts`, consumed at `store/workspace/index.ts:133`). Use it (fallback: first of `useWorkspace().workspaces`). Do not invent localStorage.
3. **[MED] Old deep-links 404.** `/{slug}/help[/a/:slug]` → add a redirect to `/help[...]`. Pre-release so low blast radius, but ~zero cost and protects cross-dept shared links.
4. **[MED] Discovery contradiction.** Route is global but entry doors (help menu, Cmd+K) are workspace-gated (`!!workspaceSlug`). For SHBVN (all staff belong to a dept workspace) this is fine — keep guards, note it. A truly no-workspace user could only reach `/help` by typing the URL.

## 4. Security (hardening, not blockers)
- **[HIGH] Broadcast audience is PRE-EXISTING** (read API already global). Not created by the route move. **Action:** authoring guardrail/text — "help content is visible to every authenticated SHBVN user across all workspaces; never put dept-confidential content here."
- **[HIGH] Public image endpoint (decision).** P6 plan serves help images via the **AllowAny** `StaticFileAssetEndpoint` → image bytes world-readable by UUID (article text is login-gated). UUIDv4 unguessable + same as avatars/logos today → acceptable, but must be a conscious choice. (Decision D-2 below.)
- **[MED] Soft-deleted assets still served.** `StaticFileAssetEndpoint` doesn't check `is_deleted` → a deleted help image stays fetchable. **Action:** add `if asset.is_deleted: return 404` when adding `HELP_ARTICLE_CONTENT` (P6/P2).
- **[MED] Reverse-tabnabbing test.** Help allowlist permits `<a target>` but not `rel`; nh3 default *should* inject `noopener noreferrer` — unconfirmed in this env. **Action:** add a backend unit test asserting it (P8).
- **[LOW] XSS posture strong & unchanged** (nh3, `style` stripped, html-only reader path).

## 5. Decisions needed from you (during review)

> **RESOLVED 2026-05-30 (user):** Auth boundary = **all authenticated users**, no workspace gating, **NOT public** (internal content stays behind login; read API stays `IsAuthenticated`). Discovery = **GLOBAL** (entry doors visible to every logged-in user, push `/help`) → **D-4 resolved (global, not workspace-gated).** Remaining D-1/D-2/D-3/D-5 stand as impl-level defaults below.
- **D-1 (UX, back-affordance):** `/help` shell carries (a) just a "Back to {last workspace}" link [lighter, recommended], or (b) full workspace-switcher sidebar (profile-style). 
- **D-2 (security, images):** serve help images via the public AllowAny static endpoint [simplest, matches avatars, recommended] vs an IsAuthenticated endpoint (image-auth parity with text).
- **D-3 (compat):** add the `/{slug}/help → /help` redirect for legacy links? [recommended yes, cheap]
- **D-4 (discovery):** keep entry doors workspace-gated (SHBVN staff always in a workspace) [recommended] vs make them globally visible (follow-up).
- **D-5 (reserve slug):** add `help` to `RESTRICTED_URLS` so no workspace can be named "help" and shadow the route [recommended yes]. (Scouts split on wording; the safe action is to reserve.)

## 6. Sequencing
- **P5 reading UI** can move to standalone `/help` NOW (drop the workspaceId guard); renders text + global-URL images. Does NOT block on P6.
- **P6 authoring** must produce global `/api/assets/v2/static/{id}/` image URLs (`HELP_ARTICLE_CONTENT` entity type + static-endpoint allowlist + `is_deleted` guard). Required for uploaded images to render in the workspace-less reader.
- **P7 discovery** entry-point targets change to `/help`; reserve slug; optional redirect.
- **P8 tests** add: standalone route renders without workspace; nh3 `rel` test; image-render-without-workspace.

## Open questions (carry to implementation)
- Does the read-only RichTextEditor actually call `fileHandler.getAssetSrc` at render, or only for edit ops? If render reads `description_html` directly (URLs already absolute), the placeholder-workspaceId concern is fully moot — confirm at implementation.
- Any already-published article with workspace-scoped image `src` needing a one-time rewrite? (Greenfield → likely none.)
