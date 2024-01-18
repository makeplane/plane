import { useContext } from "react";
import useSWR from "swr";
// mobx store
import { StoreContext } from "contexts/store-context";

export const usePage = (pageId: string) => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("usePage must be used within StoreProvider");

  const { projectPageMap, projectArchivedPageMap, fetchProjectPages, fetchArchivedProjectPages } = context.projectPages;

  const { projectId, workspaceSlug } = context.app.router;
  if (!projectId || !workspaceSlug) throw new Error("usePage must be used within ProjectProvider");

  // const { isLoading: projectPagesLoading } = useSWR(
  //   workspaceSlug && projectId ? `ALL_PAGES_LIST_${projectId}` : null,
  //   workspaceSlug && projectId && !projectPageMap[projectId] && !projectArchivedPageMap[projectId]
  //     ? () => fetchProjectPages(workspaceSlug.toString(), projectId.toString())
  //     : null
  // );
  // // fetching archived pages from API
  // const { isLoading: archivePageLoading } = useSWR(
  //   workspaceSlug && projectId ? `ALL_ARCHIVED_PAGES_LIST_${projectId}` : null,
  //   workspaceSlug && projectId && !projectArchivedPageMap[projectId] && !projectPageMap[projectId]
  //     ? () => fetchArchivedProjectPages(workspaceSlug.toString(), projectId.toString())
  //     : null
  // );

  if (projectPageMap[projectId] && projectPageMap[projectId][pageId]) {
    return projectPageMap[projectId][pageId];
  } else if (projectArchivedPageMap[projectId] && projectArchivedPageMap[projectId][pageId]) {
    return projectArchivedPageMap[projectId][pageId];
  } else {
    //TODO: handle this error
    // throw new Error(`Page with id ${pageId} does not exist in project with id ${projectId}`);
  }
};
