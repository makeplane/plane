import { useContext } from "react";
// mobx store
import { StoreContext } from "contexts/store-context";

export const usePage = (pageId: string) => {
  const context = useContext(StoreContext);
  // TODO: Handle fetching of Pages when they are not in the store
  if (context === undefined) throw new Error("usePage must be used within StoreProvider");

  const { projectPageMap, projectArchivedPageMap } = context.projectPages;

  const projectId = context.app.router.projectId;
  if (!projectId) throw new Error("usePage must be used within ProjectProvider");
  if (projectPageMap[projectId] && projectPageMap[projectId][pageId]) {
    return projectPageMap[projectId][pageId];
  } else if (projectArchivedPageMap[projectId] && projectArchivedPageMap[projectId][pageId]) {
    return projectArchivedPageMap[projectId][pageId];
  } else {
    //TODO: handle this error
    throw new Error(`Page with id ${pageId} does not exist in project with id ${projectId}`);
  }
};
