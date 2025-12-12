import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { cn } from "@plane/utils";
// assets
import emptyModule from "@/app/assets/empty-state/module.svg?url";
// components
import { EmptyState } from "@/components/common/empty-state";
import { PageHead } from "@/components/core/page-title";
import { ModuleLayoutRoot } from "@/components/issues/issue-layouts/roots/module-layout-root";
import { ModuleAnalyticsSidebar } from "@/components/modules";
// hooks
import { useModule } from "@/hooks/store/use-module";
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";
import useLocalStorage from "@/hooks/use-local-storage";
import type { Route } from "./+types/page";

function ModuleIssuesPage({ params }: Route.ComponentProps) {
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId, moduleId } = params;
  // store hooks
  const { fetchModuleDetails, getModuleById } = useModule();
  const { getProjectById } = useProject();
  // const { issuesFilter } = useIssues(EIssuesStoreType.MODULE);
  // local storage
  const { setValue, storedValue } = useLocalStorage("module_sidebar_collapsed", "false");
  const isSidebarCollapsed = storedValue ? (storedValue === "true" ? true : false) : false;
  // fetching module details
  const { error } = useSWR(`CURRENT_MODULE_DETAILS_${moduleId}`, () =>
    fetchModuleDetails(workspaceSlug, projectId, moduleId)
  );
  // derived values
  const projectModule = getModuleById(moduleId);
  const project = getProjectById(projectId);
  const pageTitle = project?.name && projectModule?.name ? `${project?.name} - ${projectModule?.name}` : undefined;

  const toggleSidebar = () => {
    setValue(`${!isSidebarCollapsed}`);
  };

  // const activeLayout = issuesFilter?.issueFilters?.displayFilters?.layout;
  return (
    <>
      <PageHead title={pageTitle} />
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
          {!isSidebarCollapsed && (
            <div
              className={cn(
                "flex h-full w-[24rem] flex-shrink-0 flex-col gap-3.5 overflow-y-auto border-l border-subtle bg-surface-1 px-6 duration-300 vertical-scrollbar scrollbar-sm absolute right-0 z-13 shadow-raised-200"
              )}
            >
              <ModuleAnalyticsSidebar moduleId={moduleId} handleClose={toggleSidebar} />
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default observer(ModuleIssuesPage);
