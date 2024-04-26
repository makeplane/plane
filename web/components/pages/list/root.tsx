import { FC } from "react";
import { observer } from "mobx-react";
// types
import { TPageNavigationTabs } from "@plane/types";
// hooks
import { useProjectPages } from "@/hooks/store";
// components
import { PageListBlock } from "./";

type TPagesListRoot = {
  pageType: TPageNavigationTabs;
  projectId: string;
  workspaceSlug: string;
};

export const PagesListRoot: FC<TPagesListRoot> = observer((props) => {
  const { pageType, projectId, workspaceSlug } = props;
  // store hooks
  const { getCurrentProjectFilteredPageIds } = useProjectPages(projectId);
  // derived values
  const filteredPageIds = getCurrentProjectFilteredPageIds(pageType);

  if (!filteredPageIds) return <></>;
  return (
    <div className="relative w-full h-full overflow-hidden overflow-y-auto divide-y-[0.5px] divide-custom-border-200">
      {filteredPageIds.map((pageId) => (
        <PageListBlock key={pageId} workspaceSlug={workspaceSlug} projectId={projectId} pageId={pageId} />
      ))}
    </div>
  );
});
