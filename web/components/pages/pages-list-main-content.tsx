import { observer } from "mobx-react";
import Image from "next/image";
// types
import { TPageNavigationTabs } from "@plane/types";
// components
import { EmptyState } from "@/components/empty-state";
import { PageLoader } from "@/components/pages";
// constants
import { EmptyStateType } from "@/constants/empty-state";
// hooks
import { useCommandPalette, useProjectPages } from "@/hooks/store";
// assets
import AllFiltersImage from "public/empty-state/pages/all-filters.svg";
import NameFilterImage from "public/empty-state/pages/name-filter.svg";

type Props = {
  children: React.ReactNode;
  pageType: TPageNavigationTabs;
  projectId: string;
};

export const PagesListMainContent: React.FC<Props> = observer((props) => {
  const { children, pageType, projectId } = props;
  // store hooks
  const { loader, getCurrentProjectFilteredPageIds, getCurrentProjectPageIds, filters } = useProjectPages(projectId);
  const { toggleCreatePageModal } = useCommandPalette();
  // derived values
  const pageIds = getCurrentProjectPageIds(pageType);
  const filteredPageIds = getCurrentProjectFilteredPageIds(pageType);

  if (loader === "init-loader") return <PageLoader />;
  // if no pages exist in the active page type
  if (pageIds?.length === 0) {
    if (pageType === "public")
      return (
        <EmptyState
          type={EmptyStateType.PROJECT_PAGE_PUBLIC}
          primaryButtonOnClick={() => {
            toggleCreatePageModal(true);
          }}
        />
      );
    if (pageType === "private")
      return (
        <EmptyState
          type={EmptyStateType.PROJECT_PAGE_PRIVATE}
          primaryButtonOnClick={() => {
            toggleCreatePageModal(true);
          }}
        />
      );
    if (pageType === "archived") return <EmptyState type={EmptyStateType.PROJECT_PAGE_ARCHIVED} />;
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

  return <div className="h-full w-full overflow-hidden">{children}</div>;
});
