import { observer } from "mobx-react-lite";
import useSWR from "swr";
import { TPageNavigationTabs } from "@plane/types";
// components
import { PagesListHeaderRoot, PagesListMainContent } from "@/components/pages";
// hooks
import { useProjectPages } from "@/hooks/store";

type TPageView = {
  workspaceSlug: string;
  projectId: string;
  pageType: TPageNavigationTabs;
  children: React.ReactNode;
};

export const PagesListView: React.FC<TPageView> = observer((props) => {
  const { workspaceSlug, projectId, pageType, children } = props;
  // store hooks
  const { isAnyPageAvailable, getAllPages } = useProjectPages();
  // fetching pages list
  useSWR(projectId ? `PROJECT_PAGES_${projectId}` : null, projectId ? () => getAllPages(pageType) : null);

  // pages loader
  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col">
      {/* tab header */}
      {isAnyPageAvailable && (
        <PagesListHeaderRoot pageType={pageType} projectId={projectId} workspaceSlug={workspaceSlug} />
      )}
      <PagesListMainContent pageType={pageType}>{children}</PagesListMainContent>
    </div>
  );
});
