# Plane Design Patterns Index

This directory contains modular documentation for Plane's user interface design patterns.

**CRITICAL INSTRUCTION FOR AI AGENTS:**
Before building or modifying any UI component in Plane, you **MUST** read the specific markdown file below that matches your task. Failure to follow these patterns will result in rejected code.

## Available Patterns

| Pattern Document | When to read this file |
| :--- | :--- |
| **`page-layouts.md`** | Building a new page, screen, or dashboard. Contains rules for `AppHeader` and `ContentWrapper`. |
| **`tabs-navigation.md`** | Building a page with sub-tabs (like Intake open/closed, Views, or Time Tracking). Contains exact styling rules for `Header SECONDARY` variants and active states. |
| **`tables-grids.md`** | Building data tables or lists. Contains the required semantic tokens (`text-tertiary`, `bg-layer-1-hover`, etc.) instead of custom Tailwind colors. |
| **`modals-drawers.md`** | Building overlays, dialogs, or confirmation modals. Contains exact configs for `ModalCore`, `EModalPosition`, and action buttons. |
| **`empty-states.md`** | Building scenarios where no data exists. Contains rules for using `@plane/propel/empty-state` specifically `EmptyStateDetailed`. |
| **`forms-inputs.md`** | Building data entry blocks. Demonstrates the pattern for `react-hook-form` connected to `@plane/propel` Inputs and proper error outlines. |
| **`loaders-skeletons.md`** | Building loading states. Outlines the difference between structural skeleton `Loader`s, data-fetching `CircularSpinner`s, and Button loaders. |
| **`dropdowns-menus.md`** | Building action menus or selects. Outlines the usage of modern Propel `Menu` and `Select` vs deprecated UI tools. |
| **`toasts-notifications.md`** | Triggering success/error alerts. Outlines `setToast` and `setPromiseToast` from Propel. |
| **`avatars-badges.md`** | Rendering users, projects, priorities, or states. Outlines Propel `Avatar` and `Badge`. |
| **`rich-text-editors.md`** | Rendering text editors. Outlines `LiteTextEditor` over raw textarea inputs, including mention contexts. |
| **`drawers-sidepeeks.md`** | Rendering slide-out side panels. Outlines URL query params and `useIssuePeekOverviewRedirection` instead of custom Drawers. |
| **`tooltips-popovers.md`** | Rendering hover hints or click popups. Outlines `Tooltip` vs `Popover` components. |
| **`toggles-accordions.md`** | Rendering boolean switches or collapsing sections. Outlines Propel `Switch` and `Accordion`. |
| **`custom-scroll-areas.md`** | Handling overflow scrolling. Outlines `ScrollArea` usage to avoid native browser UI breaks across OS. |

Always check the core codebase (e.g., `apps/web/core/components/inbox/sidebar/root.tsx` or `apps/web/app/(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/settings/layout.tsx`) if you need a working example of these patterns in action.
