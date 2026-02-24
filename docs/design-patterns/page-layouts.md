# Page Layouts

This document defines the standard macro-structure of a standard page in Plane (Project settings, Workspaces, Time Tracking, etc.).

## Base Structure
A standard full-screen feature page must always split the visual area into a **Fixed Header** and a **Scrollable Content Area**.

### Required Components
- `@/components/core/app-header`
- `@/components/core/content-wrapper`

### The Pattern
Never let the whole page scroll. Only the `ContentWrapper` should scroll.

```tsx
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { MyPageHeader } from "./header";

export default function MyPageLayout() {
  return (
    // The main container MUST be h-full and overflow-hidden to prevent body scrolling
    <div className="flex flex-col h-full w-full overflow-hidden">
      
      {/* 1. Top Header - Fixed */}
      <AppHeader header={<MyPageHeader />} />

      {/* 2. Scrollable Content Area */}
      <div className="flex-grow overflow-hidden bg-surface-1">
        {/* ContentWrapper handles the internal overflow-y-scroll */}
        <ContentWrapper className="!p-0 h-full">
           <Outlet /> {/* Or page content */}
        </ContentWrapper>
      </div>
    </div>
  );
}
```

### Key Technical Rules:
1. `flex flex-col h-full w-full overflow-hidden`: The outmost wrapper prevents the default browser scrollbar.
2. `flex-grow overflow-hidden bg-surface-1`: The container holding the ContentWrapper takes up the remaining height and defines the background color. 
3. `ContentWrapper className="!p-0 h-full"`: This component provides the actual `overflow-y-scroll`. Overriding padding with `!p-0` allows the inner content to handle its own safe areas if needed.
