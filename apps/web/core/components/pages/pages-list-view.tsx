import { observer } from "mobx-react";
import useSWR from "swr";
import { TPageNavigationTabs } from "@plane/types";
// components
import { ProjectPagesListHeaderRoot } from "@/components/pages/header";
import { ProjectPagesListMainContent } from "@/components/pages/pages-list-main-content";
// plane web hooks
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";

const storeType = EPageStoreType.PROJECT;

type TPageView = {
  children: React.ReactNode;
  pageType: TPageNavigationTabs;
  projectId: string;
  storeType: EPageStoreType;
  workspaceSlug: string;
};

export const ProjectPagesListView: React.FC<TPageView> = observer((props) => {
  const { children, pageType, projectId, workspaceSlug } = props;
  // store hooks
  const { isAnyPageAvailable, fetchPagesList } = usePageStore(storeType);
  // fetching pages list
  useSWR(
    workspaceSlug && projectId && pageType ? `PROJECT_PAGES_${projectId}_${pageType}` : null,
    workspaceSlug && projectId && pageType ? () => fetchPagesList(workspaceSlug, projectId, pageType) : null
  );

  // pages loader
  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col">
      {/* tab header */}
      {isAnyPageAvailable && (
        <ProjectPagesListHeaderRoot pageType={pageType} projectId={projectId} workspaceSlug={workspaceSlug} />
      )}
      <ProjectPagesListMainContent pageType={pageType}>{children}</ProjectPagesListMainContent>
    </div>
  );
});
