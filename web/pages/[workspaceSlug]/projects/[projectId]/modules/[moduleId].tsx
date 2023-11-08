import { ReactElement } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// hooks
import useLocalStorage from "hooks/use-local-storage";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { ModuleDetailsSidebar } from "components/modules";
import { ModuleLayoutRoot } from "components/issues";
import { ModuleIssuesHeader } from "components/headers";
// ui
import { EmptyState } from "components/common";
// assets
import emptyModule from "public/empty-state/module.svg";
// types
import { NextPageWithLayout } from "types/app";

const ModuleIssuesPage: NextPageWithLayout = () => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, moduleId } = router.query;
  // store
  const { module: moduleStore } = useMobxStore();
  // local storage
  const { setValue, storedValue } = useLocalStorage("module_sidebar_collapsed", "false");
  const isSidebarCollapsed = storedValue ? (storedValue === "true" ? true : false) : false;

  const { error } = useSWR(
    workspaceSlug && projectId && moduleId ? `CURRENT_MODULE_DETAILS_${moduleId.toString()}` : null,
    workspaceSlug && projectId && moduleId
      ? () => moduleStore.fetchModuleDetails(workspaceSlug.toString(), projectId.toString(), moduleId.toString())
      : null
  );

  const toggleSidebar = () => {
    setValue(`${!isSidebarCollapsed}`);
  };

  return (
    <>
      {error ? (
        <EmptyState
          image={emptyModule}
          title="Module does not exist"
          description="The module you are looking for does not exist or has been deleted."
          primaryButton={{
            text: "View other modules",
            onClick: () => router.push(`/${workspaceSlug}/projects/${projectId}/modules`),
          }}
        />
      ) : (
        <div className="flex h-full w-full">
          <div className="h-full w-full overflow-hidden">
            <ModuleLayoutRoot />
          </div>
          {moduleId && !isSidebarCollapsed && (
            <div
              className="flex flex-col gap-3.5 h-full w-[24rem] z-10 overflow-y-auto border-l border-custom-border-100 bg-custom-sidebar-background-100 px-6 py-3.5 duration-300 flex-shrink-0"
              style={{
                boxShadow:
                  "0px 1px 4px 0px rgba(0, 0, 0, 0.06), 0px 2px 4px 0px rgba(16, 24, 40, 0.06), 0px 1px 8px -1px rgba(16, 24, 40, 0.06)",
              }}
            >
              <ModuleDetailsSidebar moduleId={moduleId.toString()} handleClose={toggleSidebar} />
            </div>
          )}
        </div>
      )}
    </>
  );
};

ModuleIssuesPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<ModuleIssuesHeader />} withProjectWrapper>
      {page}
    </AppLayout>
  );
};

export default ModuleIssuesPage;
