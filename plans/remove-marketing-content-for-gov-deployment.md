# Remove Marketing Content for Self-Hosted Government Deployment

## Overview

Remove external company references, sales material, and marketing content from the Plane codebase to make it suitable for a self-hosted government deployment. Keep the Plane logo/branding and all core functionality intact.

## Categorized Changes

### 1. SAFE TO REMOVE - External Links & Marketing Copy

These changes have zero impact on functionality:

#### 1.1 Help Menu & Sidebar Links
**File:** `core/components/workspace/sidebar/help-section/root.tsx`
- Remove Discord link (line 91-96)
- Remove "Contact Sales" mailto link to sales@plane.so (line 65-70)
- Keep: Documentation link (can be made configurable), Keyboard shortcuts, What's new

#### 1.2 Product Updates Footer
**File:** `core/components/global/product-updates/footer.tsx`
- Remove entire component or strip external links:
  - Docs link to go.plane.so (keep if self-hosted docs exist)
  - Changelog link to go.plane.so
  - Support mailto to support@plane.so
  - Discord link
  - "Powered by Plane Pages" link

#### 1.3 Command Palette (Power-K) Help Commands
**File:** `core/components/power-k/config/help-commands.ts`
- Remove "Join Discord" command (lines 44-56)
- Remove "Report Bug" GitHub link command (lines 57-69) - or redirect to internal issue tracker
- Remove docs.plane.so link (line 38) - or make configurable
- Keep: Keyboard shortcuts, Chat support (only shows if enabled)

#### 1.4 Error Page External Links
**File:** `app/error/prod.tsx`
- Remove/replace `linkMap` array (lines 10-26):
  - `mailto:support@plane.so`
  - `https://status.plane.so/`
  - Twitter handle `@planepowers`

#### 1.5 Workspace Invitations Page
**File:** `app/(all)/workspace-invitations/page.tsx`
- Remove "Star us on GitHub" link (line 109)
- Remove "Join our community" Discord link (lines 110-114)

#### 1.6 Maintenance Message
**File:** `ce/components/instance/maintenance-message.tsx`
- Remove `mailto:support@plane.so` reference

#### 1.7 Integration Guide Docs Link
**File:** `core/components/integration/guide.tsx`
- Remove link to `https://docs.plane.so/importers/github` (line 86)

#### 1.8 Estimate Documentation Link
**File:** `core/components/estimates/root.tsx`
- Remove link to `https://docs.plane.so/core-concepts/projects/run-project#estimate` (line 104)

#### 1.9 Project Settings External Link
**File:** `app/(all)/[workspaceSlug]/(settings)/settings/projects/page.tsx`
- Remove link to `https://plane.so/` (line 29)

#### 1.10 Latest Feature Block
**File:** `core/components/common/latest-feature-block.tsx`
- Remove changelog link to `https://plane.so/changelog` (line 17)

---

### 2. SAFE TO REMOVE - Social/Meta Tags

These are SEO tags that don't affect functionality:

#### 2.1 App Layout Meta Tags
**Files:** `app/layout.tsx`, `app/root.tsx`
- Remove Twitter card meta tags referencing `@planepowers`
- Remove og:url pointing to `app.plane.so`
- Keep: Title, description, and local image references

---

### 3. CONDITIONAL - Analytics/Tracking (Already Disabled by Default)

PostHog analytics only runs if explicitly configured via environment variables. **No changes needed** - just don't set these env vars:
- `VITE_POSTHOG_KEY`
- `VITE_POSTHOG_HOST`

**File:** `core/lib/posthog-provider.tsx` - Already checks `is_telemetry_enabled` flag

---

### 4. CONDITIONAL - Chat Support (Already Disabled by Default)

Intercom/Crisp only runs if configured. **No changes needed** - just don't set:
- `is_intercom_enabled` in Instance config
- `intercom_app_id` in Instance config

**File:** `core/hooks/use-chat-support.ts` - Already checks config flags

---

### 5. KEEP AS-IS - Upgrade/License Components

These components are part of the CE (Community Edition) architecture and show "Pro" badges or upgrade prompts. They're **safe to keep** because:
- Self-hosted deployments can configure licensing server to disable these
- They don't send data externally
- Removing them would break the component hierarchy

If you want to hide upgrade prompts entirely, configure the Instance settings accordingly.

---

### 6. KEEP AS-IS - Plane Branding

Per user request, keep all Plane logos and branding:
- Logo in sidebar
- "Plane" in page titles
- Logo spinner

---

## Implementation Plan

### Phase 1: External Links (Low Risk)
1. `core/components/workspace/sidebar/help-section/root.tsx` - Remove Discord, Contact Sales
2. `core/components/global/product-updates/footer.tsx` - Return null or remove external links
3. `core/components/power-k/config/help-commands.ts` - Remove Discord, GitHub, external docs
4. `app/error/prod.tsx` - Replace linkMap with empty array or internal links

### Phase 2: Misc External Links (Low Risk)
5. `app/(all)/workspace-invitations/page.tsx` - Remove GitHub/Discord from empty states
6. `ce/components/instance/maintenance-message.tsx` - Remove support email
7. `core/components/integration/guide.tsx` - Remove docs link
8. `core/components/estimates/root.tsx` - Remove docs link
9. `core/components/common/latest-feature-block.tsx` - Remove changelog link
10. `app/(all)/[workspaceSlug]/(settings)/settings/projects/page.tsx` - Remove plane.so link

### Phase 3: Meta Tags (Low Risk)
11. `app/layout.tsx` - Remove Twitter/social meta tags
12. `app/root.tsx` - Remove Twitter/social meta tags

---

## Files Summary

| File | Change Type | Risk |
|------|-------------|------|
| `core/components/workspace/sidebar/help-section/root.tsx` | Remove menu items | Low |
| `core/components/global/product-updates/footer.tsx` | Return null | Low |
| `core/components/power-k/config/help-commands.ts` | Remove commands | Low |
| `app/error/prod.tsx` | Replace linkMap | Low |
| `app/(all)/workspace-invitations/page.tsx` | Remove empty state links | Low |
| `ce/components/instance/maintenance-message.tsx` | Remove email | Low |
| `core/components/integration/guide.tsx` | Remove docs link | Low |
| `core/components/estimates/root.tsx` | Remove docs link | Low |
| `core/components/common/latest-feature-block.tsx` | Remove changelog link | Low |
| `app/(all)/[workspaceSlug]/(settings)/settings/projects/page.tsx` | Remove link | Low |
| `app/layout.tsx` | Remove meta tags | Low |
| `app/root.tsx` | Remove meta tags | Low |

**Already modified:**
- `core/components/auth-screens/footer.tsx` - Returns null (marketing footer removed)
- `core/components/account/terms-and-conditions.tsx` - Legal links removed, dev hint only

---

## What NOT to Remove

1. **PostHog provider** - Already conditional, just don't configure it
2. **Intercom/Chat support** - Already conditional, just don't configure it
3. **License/Upgrade components** - Part of CE architecture, configure via Instance
4. **Plane logo and branding** - Keep per user request
5. **Constants files** - May break imports even if unused
6. **Service files** - May be called from backend
