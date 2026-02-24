# Empty States

This document details the standard implementation for empty, blank, or placeholder states in Plane logic (e.g. no results, disabled features, empty lists).

## The Standard Pattern

Plane uses pre-defined Empty State components rather than custom text nodes or icons. You MUST use `@plane/propel/empty-state`.

There are two primary variants:
1. `EmptyStateDetailed` (For full page, main content areas, large panels)
2. `EmptyStateCompact` (For sidebars, small widgets, restricted spaces)

### Required Imports
```tsx
import { EmptyStateDetailed, EmptyStateCompact } from "@plane/propel/empty-state";
```

### 1. Detailed Empty State
Used when the main focus of a page has no data.

```tsx
export const MyEmptyList = ({ onAddClick }) => {
  const { t } = useTranslation();

  return (
    // Wrapper to center the empty state within parents
    <div className="flex items-center justify-center h-full w-full">
      <EmptyStateDetailed
        // assetKey loads predefined illustrations (e.g. "search", "inbox", "projects")
        assetKey="search"
        title={t("common_empty_state.search.title")}
        description={t("common_empty_state.search.description")}
        
        // Always size the asset. Usually size-20 (80px)
        assetClassName="size-20"
        
        // Optional array of CTA buttons
        actions={[
          {
            label: t("project_empty_state.intake_sidebar.cta_primary"),
            onClick: onAddClick,
            variant: "primary",
          },
        ]}
      />
    </div>
  );
};
```

### 2. Compact Empty State
Used in tight layouts like sidebars or dropdowns. It generally excludes actions and descriptions, focusing only on an icon/small asset and a title.

```tsx
export const SidebarEmpty = () => {
  const { t } = useTranslation();

  return (
    <EmptyStateCompact
      assetKey="intake"
      title={t("project_empty_state.intake_main.title")}
      assetClassName="size-16" // Smaller asset (size-16 = 64px)
    />
  );
};
```

### Key Technical Rules:
1. **Asset Keys**: Use generic asset keys like `"search"`, `"inbox"`, `"projects"`, `"issues"`, etc. Check `@plane/propel` for the full list if needed.
2. **Alignment**: Wrap the `EmptyState...` component in `<div className="flex items-center justify-center h-full w-full">` to center it vertically and horizontally. Do not rely on the `EmptyStateDetailed` applying its own auto-margins correctly without a flex parent.
3. **i18n Translation**: Always use `t()` keys for the titles and descriptions (`common_empty_state.search.title`). Do not hardcode "No results found" in English.
4. **Button Actions**: The `actions` prop expects an array of objects matching `{ label: string, onClick: function, variant: "primary" | "secondary" | "outline" }`. Do not render custom `<Button>` components underneath the empty state manually.
