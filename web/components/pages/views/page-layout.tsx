import { observer } from "mobx-react-lite";
import useSWR from "swr";
import { ListFilter } from "lucide-react";
// hooks
import { TPageNavigationTabs } from "@plane/types";
import { FiltersDropdown } from "@/components/issues";
// types
import { useLabel, useMember, useProjectPages } from "@/hooks/store";
// assets
import AllFiltersImage from "public/empty-state/pages/all-filters.svg";
import NameFilterImage from "public/empty-state/pages/name-filter.svg";
// components
import {
  PageLoader,
  PageEmptyState,
  PageTabNavigation,
  PageSearchInput,
  PageOrderByDropdown,
  PageFiltersSelection,
} from "..";

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
  useSWR(
    projectId && pageType ? `PROJECT_PAGES_${projectId}_${pageType}` : null,
    projectId && pageType ? () => getAllPages(pageType) : null
  );

  // pages loader
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

      {loader === "init-loader" ? (
        <PageLoader />
      ) : pageIds?.length === 0 ? (
        <PageEmptyState
          pageType={pageType}
          image={filters.searchQuery.length > 0 ? NameFilterImage : AllFiltersImage}
          title="No matching pages"
          description={
            filters.searchQuery.length > 0
              ? "Remove the search criteria to see all pages"
              : "Remove the filters to see all pages"
          }
        />
      ) : (
        <div className="h-full w-full overflow-hidden">{children}</div>
      )}
    </div>
  );
});
