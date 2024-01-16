import { useContext } from "react";
// mobx store
import { StoreContext } from "contexts/store-context";

export const usePage = (pageId: string) => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("usePage must be used within StoreProvider");
  const { projectPageMap, projectArchivedPageMap } = context.projectPages;
  const projectId = context.app.router.projectId;
  if (!projectId) throw new Error("usePage must be used within ProjectProvider");
  if (projectPageMap[projectId] && projectPageMap[projectId][pageId]) {
    console.log(`Page with id ${pageId} exists in project with id ${projectId}`);
    return projectPageMap[projectId][pageId];
  } else if (projectArchivedPageMap[projectId] && projectArchivedPageMap[projectId][pageId]) {
    console.log(`Page with id ${pageId} is archived in project with id ${projectId}`);
    return projectArchivedPageMap[projectId][pageId];
  } else {
    console.log(`Page with id ${pageId} does not exist in project with id ${projectId}`);
  }
};
