import { FC } from "react";
import { observer } from "mobx-react";
// types
import { TPageNavigationTabs } from "@plane/types";
// components
import { ListLayout } from "@/components/core/list";
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
  const { getCurrentProjectFilteredPageIds } = useProjectPages();
  // derived values
  const filteredPageIds = getCurrentProjectFilteredPageIds(pageType);

  if (!filteredPageIds) return <></>;
  return (
    <ListLayout>
      {filteredPageIds.map((pageId) => (
        <PageListBlock key={pageId} workspaceSlug={workspaceSlug} projectId={projectId} pageId={pageId} />
      ))}
    </ListLayout>
  );
});
