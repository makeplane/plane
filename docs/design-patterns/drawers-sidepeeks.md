# Drawers & Side-Peeks

This document outlines how to handle side-peek panels (slide-out drawers from the right side) in Plane, specifically for Issue overviews.

## The Standard Pattern

Do **NOT** build custom CSS/HTML slide-out animations or use raw `Dialog`/`ModalCore` to simulate a right-side drawer. 

Plane handles side-peek visibility primarily through **URL Query Parameters** (e.g. `?peekId=123`) intercepted by standard hooks.

### Required Imports
```tsx
import useIssuePeekOverviewRedirection from "@/hooks/use-issue-peek-overview-redirection";
```

### 1. Triggering a Peek
When a user clicks on an item in a list or board, do not manage a local `isDrawerOpen` state. Instead, use the redirection hook to append the `peekId` to the URL.

```tsx
import useIssuePeekOverviewRedirection from "@/hooks/use-issue-peek-overview-redirection";

export const IssueListItem = ({ issue, workspaceSlug, isMobile }) => {
  // 1. Initialize the hook
  const { handleRedirection } = useIssuePeekOverviewRedirection(!!issue?.is_epic);

  // 2. Wrap the handler
  const handleIssuePeekOverview = () => {
    handleRedirection(workspaceSlug, issue, isMobile);
  };

  return (
    <div 
      onClick={handleIssuePeekOverview}
      className="cursor-pointer hover:bg-layer-1-hover"
    >
      {issue.name}
    </div>
  );
};
```

### 2. Rendering the Peek
The actual `<IssuePeekOverview />` component is usually rendered at the Layout or Root level of the page, which listens to the URL for a `peekId` and slides in automatically.

```tsx
import { IssuePeekOverview } from "@/components/issues/peek-overview";

export const ProjectLayout = () => {
  return (
    <div className="flex h-full w-full relative overflow-hidden">
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        <MyIssueList />
      </div>
      
      {/* 
        The Peek Overview listens to URL context globally. 
        It will animate in from the right when the URL contains ?peekId=...
      */}
      <IssuePeekOverview />
    </div>
  );
}
```

### Key Technical Rules:
1. **No Local State**: Never use `const [isPeekOpen, setIsPeekOpen] = useState(false)`. Always use URL params so that users can copy-paste the URL and land natively with the peek model open.
2. **`useIssuePeekOverviewRedirection`**: Always use this hook to calculate the correct URL to push to the Next/React router. It handles edge cases for modules, epics, and mobile views.
3. **Z-Index context**: Ensure the container rendering `<IssuePeekOverview />` has `relative flex overflow-hidden` so the drawer slides over the content without breaking the page width or causing horizontal scrollbars.
