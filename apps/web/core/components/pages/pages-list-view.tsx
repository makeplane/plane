import { observer } from "mobx-react";
import useSWR from "swr";
// types
import { TPageNavigationTabs } from "@plane/types";
// components
import { ProjectPagesListHeaderRoot } from "@/components/pages/header";
// plane web hooks
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";
import { ProjectPagesListRoot } from "./list";

const storeType = EPageStoreType.PROJECT;

type TPageView = {
  pageType: TPageNavigationTabs;
  projectId: string;
  workspaceSlug: string;
};

export const ProjectPagesListView: React.FC<TPageView> = observer((props) => {
  const { pageType, workspaceSlug, projectId } = props;
  // store hooks
  const { isAnyPageAvailable } = usePageStore(storeType);

  // pages loader
  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col">
      {/* tab header */}
      {isAnyPageAvailable && (
        <ProjectPagesListHeaderRoot pageType={pageType} projectId={projectId} workspaceSlug={workspaceSlug} />
      )}
      <ProjectPagesListRoot pageType={pageType} workspaceSlug={workspaceSlug} projectId={projectId} />
    </div>
  );
});
