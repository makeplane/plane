import { observer } from "mobx-react";
import Image from "next/image";
import { useParams } from "next/navigation";
// types
import { TPageNavigationTabs } from "@plane/types";
// components
import { EmptyState } from "@/components/empty-state";
import { PageLoader } from "@/components/pages";
// constants
import { EmptyStateType } from "@/constants/empty-state";
import { EPageAccess } from "@/constants/page";
// hooks
import { useCommandPalette } from "@/hooks/store";
// plane web components
import { PageListBlock } from "@/plane-web/components/pages";
// plane web hooks
import { useWorkspacePages } from "@/plane-web/hooks/store";
// assets
import AllFiltersImage from "@/public/empty-state/pages/all-filters.svg";
import NameFilterImage from "@/public/empty-state/pages/name-filter.svg";

type Props = {
  pageType: TPageNavigationTabs;
};

export const PagesListLayoutRoot: React.FC<Props> = observer((props) => {
  const { pageType } = props;
  // params
  const { workspaceSlug } = useParams();
  // store hooks
  const { toggleCreatePageModal } = useCommandPalette();
  const {
    filters,
    getCurrentWorkspacePageIdsByType,
    getCurrentWorkspaceFilteredPageIdsByType,
    loader,
    isAnyPageAvailable,
  } = useWorkspacePages();
  // derived values
  const pageIds = getCurrentWorkspacePageIdsByType(pageType);
  const filteredPageIds = getCurrentWorkspaceFilteredPageIdsByType(pageType);

  if (loader === "init-loader") return <PageLoader />;
  // if no pages exist in the active page type
  if (!isAnyPageAvailable || pageIds?.length === 0) {
    if (!isAnyPageAvailable) {
      return (
        <EmptyState
          type={EmptyStateType.WORKSPACE_PAGE}
          primaryButtonOnClick={() => {
            toggleCreatePageModal({ isOpen: true });
          }}
        />
      );
    }
    if (pageType === "public")
      return (
        <EmptyState
          type={EmptyStateType.WORKSPACE_PAGE_PUBLIC}
          primaryButtonOnClick={() => {
            toggleCreatePageModal({ isOpen: true, pageAccess: EPageAccess.PUBLIC });
          }}
        />
      );
    if (pageType === "private")
      return (
        <EmptyState
          type={EmptyStateType.WORKSPACE_PAGE_PRIVATE}
          primaryButtonOnClick={() => {
            toggleCreatePageModal({ isOpen: true, pageAccess: EPageAccess.PRIVATE });
          }}
        />
      );
    if (pageType === "archived") return <EmptyState type={EmptyStateType.WORKSPACE_PAGE_ARCHIVED} />;
  }

  // if no pages match the filter criteria
  if (filteredPageIds?.length === 0)
    return (
      <div className="h-full w-full grid place-items-center">
        <div className="text-center">
          <Image
            src={filters.searchQuery.length > 0 ? NameFilterImage : AllFiltersImage}
            className="h-36 sm:h-48 w-36 sm:w-48 mx-auto"
            alt="No matching modules"
          />
          <h5 className="text-xl font-medium mt-7 mb-1">No matching pages</h5>
          <p className="text-custom-text-400 text-base">
            {filters.searchQuery.length > 0
              ? "Remove the search criteria to see all pages"
              : "Remove the filters to see all pages"}
          </p>
        </div>
      </div>
    );

  return (
    <div className="size-full overflow-y-scroll vertical-scrollbar scrollbar-sm">
      {pageIds?.map((pageId) => (
        <PageListBlock key={pageId} workspaceSlug={workspaceSlug.toString()} pageId={pageId} />
      ))}
    </div>
  );
});
