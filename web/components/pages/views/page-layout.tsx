import { FC, Fragment, ReactNode } from "react";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
// hooks
import { useProjectPages } from "hooks/store";
// components
import { PageLoader, PageEmptyState, PageTabNavigation, PageSearchInput } from "..";
import { TPageNavigationTabs } from "@plane/types";

type TPageView = {
  workspaceSlug: string;
  projectId: string;
  pageType?: TPageNavigationTabs;
  children: ReactNode;
};

export const PageView: FC<TPageView> = observer((props) => {
  const { workspaceSlug, projectId, pageType = "public", children } = props;
  // hooks
  const {
    loader,
    getAllPages,
    pageIds,
    filters: { searchQuery },
  } = useProjectPages(projectId);

  // fetching pages list
  useSWR(projectId && pageType ? `PROJECT_PAGES_${projectId}_${pageType}` : null, async () => {
    projectId && pageType && (await getAllPages());
  });

  // pages loader
  if (loader === "init-loader") return <PageLoader />;
  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col">
      {/* tab header */}
      <div className="flex-shrink-0 w-full border-b border-custom-border-200 px-3 relative flex justify-between">
        <PageTabNavigation workspaceSlug={workspaceSlug} projectId={projectId} pageType={pageType} />

        <div className="flex-shrink-0 relative flex items-center border-b border-custom-border-200 p-3">
          <PageSearchInput projectId={projectId} />

          <div className="ml-auto">Sort filter</div>

          <div>Filters</div>
        </div>
      </div>

      {pageIds && pageIds.length === 0 ? (
        // no filtered pages are available
        <PageEmptyState
          pageType={pageType}
          title={`No matching pages`}
          description={`Remove the filters to see all pages`}
        />
      ) : pageIds && pageIds.length === 0 && searchQuery.length > 0 ? (
        // no searching pages are available
        <PageEmptyState
          pageType={pageType}
          title={`No matching pages`}
          description={`Remove the search criteria to see all pages`}
        />
      ) : pageIds && pageIds.length === 0 ? (
        // no pages are available
        <PageEmptyState pageType={pageType} />
      ) : (
        <div className="w-full h-full overflow-hidden">{children}</div>
      )}

      {/* no search elements */}
    </div>
  );
});
