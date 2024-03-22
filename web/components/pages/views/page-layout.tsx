import { observer } from "mobx-react-lite";
import useSWR from "swr";
import { ListFilter } from "lucide-react";
// hooks
import { useLabel, useMember, useProjectPages } from "hooks/store";
// components
import {
  PageLoader,
  PageEmptyState,
  PageTabNavigation,
  PageSearchInput,
  PageOrderByDropdown,
  PageFiltersSelection,
} from "..";
import { FiltersDropdown } from "components/issues";
// types
import { TPageNavigationTabs } from "@plane/types";

type TPageView = {
  workspaceSlug: string;
  projectId: string;
  pageType: TPageNavigationTabs;
  children: React.ReactNode;
};

export const PageView: React.FC<TPageView> = observer((props) => {
  const { workspaceSlug, projectId, pageType = "public", children } = props;
  // store hooks
  const { loader, getAllPages, pageIds, filters, updateFilters } = useProjectPages(projectId);
  const {
    workspace: { workspaceMemberIds },
  } = useMember();
  const { projectLabels } = useLabel();

  // fetching pages list
  useSWR(projectId && pageType ? `PROJECT_PAGES_${projectId}_${pageType}` : null, async () => {
    projectId && pageType && (await getAllPages(pageType));
  });

  // pages loader
  if (loader === "init-loader") return <PageLoader />;
  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col">
      {/* tab header */}
      <div className="flex-shrink-0 w-full border-b border-custom-border-200 px-3 relative flex items-center gap-4 justify-between">
        <PageTabNavigation workspaceSlug={workspaceSlug} projectId={projectId} pageType={pageType} />

        <div className="h-full flex items-center gap-2 self-end">
          <PageSearchInput projectId={projectId} />

          <PageOrderByDropdown
            sortBy={filters.sortBy}
            sortKey={filters.sortKey}
            onChange={(val) => {
              if (val.key) updateFilters("sortKey", val.key);
              if (val.order) updateFilters("sortBy", val.order);
            }}
          />

          <FiltersDropdown icon={<ListFilter className="h-3 w-3" />} title="Filters" placement="bottom-end">
            <PageFiltersSelection
              filters={filters}
              handleFiltersUpdate={updateFilters}
              labels={projectLabels}
              memberIds={workspaceMemberIds ?? undefined}
            />
          </FiltersDropdown>
        </div>
      </div>

      {pageIds && pageIds.length === 0 ? (
        // no filtered pages are available
        <PageEmptyState
          pageType={pageType}
          title={`No matching pages`}
          description={`Remove the filters to see all pages`}
        />
      ) : pageIds && pageIds.length === 0 && filters.searchQuery.length > 0 ? (
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
