import { useContext } from "react";
import useSWR from "swr";
// context
import { StoreContext } from "contexts/store-context";
// mobx store
import { IProjectPageStore } from "store/pages/project-page.store";

export const usePage = (projectId: string | undefined): IProjectPageStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useProjectPublish must be used within StoreProvider");

  if (!projectId) throw new Error("projectId must be passed as a property");

  const projectPage = context.projectPage;
  const { fetch } = projectPage;

  useSWR(projectId ? `PROJECT_PAGES_${projectId}` : null, async () => {
    projectId && (await fetch());
  });

  return context.projectPage;
};
