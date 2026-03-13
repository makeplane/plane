---
paths:
  - apps/web/app/**
  - apps/web/app/routes/**
---

# Routing & Layout Patterns (React Router v7)

## Route Files

- **`app/routes/core.ts`** — core routes (upstream shared, avoid modifying)
- **`app/routes/extended.ts`** — CE-specific routes (add CE features here)

## CRITICAL: Route Nesting in `extended.ts`

Khi thêm route CE mới cho các trang có layout sẵn, **BẮT BUỘC** bọc `route()` bên trong chính xác các lớp `layout()` tree y hệt như `core.ts`. Nếu thiếu, màn hình sẽ mất AppHeader hoặc Sidebar.

```typescript
import { index, layout, route } from "@react-router/dev/routes";

export const coreRoutes = [
  layout("./(all)/[workspaceSlug]/layout.tsx", [
    layout("./(all)/[workspaceSlug]/(projects)/layout.tsx", [
      route(":workspaceSlug/projects/:projectId/issues", "./(all)/[workspaceSlug]/(projects)/issues/page.tsx"),
    ]),
  ]),
];
```

## Layout Hierarchy (outer → inner)

```
./(all)/layout.tsx                               ← auth gate
  ./(all)/[workspaceSlug]/layout.tsx             ← loads workspace data
    ./(all)/[workspaceSlug]/(projects)/layout.tsx ← sidebar + nav
      ./(all)/[workspaceSlug]/(projects)/my-feature/layout.tsx ← feature layout
        page.tsx                                  ← actual content
```

## Layout Component — MANDATORY for every feature

```typescript
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@plane/ui";
import { Outlet } from "react-router";

export default function MyFeatureLayout() {
  return (
    <>
      <AppHeader header={<MyFeatureHeader />} />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
```

**Rules:**

- NEVER build inline headers in `page.tsx` files
- ALWAYS use `AppHeader` + `ContentWrapper` + `Outlet` pattern
- Breadcrumbs from `@plane/ui` `Breadcrumbs` component
- `PageHead` component for page title in every route page

## Page Component Pattern

```typescript
import type { Route } from "./+types/page";
import { observer } from "mobx-react";

function MyFeaturePage({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;
  const { t } = useTranslation();
  return (
    <>
      <PageHead title={t("my_feature.label")} />
      <div className="h-full w-full">{/* content */}</div>
    </>
  );
}
export default observer(MyFeaturePage);
```

## React Router v7 — Advanced Patterns

### Route Groups (Parenthesized Directories)

Directories wrapped in `()` are layout groups — they affect nesting but NOT the URL:

```
(all)/                    ← Not in URL, just a layout wrapper
  [workspaceSlug]/        ← URL segment: /:workspaceSlug
    (projects)/           ← Not in URL, provides sidebar layout
      issues/page.tsx     ← URL: /:workspaceSlug/issues
    (settings)/           ← Not in URL, provides settings layout
      profile/page.tsx    ← URL: /:workspaceSlug/profile
```

### SSR vs CSR Apps

| App          | Rendering    | Notes                              |
| ------------ | ------------ | ---------------------------------- |
| `apps/web`   | CSR (client) | SPA, no server loaders             |
| `apps/admin` | CSR (client) | SPA, no server loaders             |
| `apps/space` | SSR (server) | Has loaders, use `useLoaderData()` |

❌ WRONG — Using SSR loader in apps/web:

```typescript
export async function loader() { ... }  // Only for apps/space
```

✅ CORRECT — CSR data fetching in apps/web:

```typescript
// Use SWR or store.fetchX() in useEffect, not loaders
useEffect(() => {
  store.fetchItems(slug);
}, [slug]);
```

## Breadcrumbs

```typescript
import { Breadcrumbs } from "@plane/ui";

<Breadcrumbs>
  <Breadcrumbs.BreadcrumbItem
    type="text"
    link={<BreadcrumbLink label={t("dashboards")} href={`/${slug}/dashboards`} />}
  />
  <Breadcrumbs.BreadcrumbItem type="text" link={<BreadcrumbLink label={pageTitle} />} />
</Breadcrumbs>;
```
