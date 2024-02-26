import { useContext } from "react";
// mobx store
import { StoreContext } from "contexts/store-context";

export const usePage = (pageId: string) => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("usePage must be used within StoreProvider");

  const { projectPageMap, projectArchivedPageMap } = context.projectPages;

  const { projectId, workspaceSlug } = context.app.router;
  if (!projectId || !workspaceSlug) throw new Error("usePage must be used within ProjectProvider");

  if (projectPageMap[projectId] && projectPageMap[projectId][pageId]) {
    return projectPageMap[projectId][pageId];
  } else if (projectArchivedPageMap[projectId] && projectArchivedPageMap[projectId][pageId]) {
    return projectArchivedPageMap[projectId][pageId];
  } else {
    return;
  }
};
