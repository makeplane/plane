"use client";

import { observer } from "mobx-react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
// components
import { EmptyState } from "@/components/common";
import { PageHead } from "@/components/core";
import { ModuleLayoutRoot } from "@/components/issues";
import { ModuleDetailsSidebar } from "@/components/modules";
// hooks
import { useModule, useProject } from "@/hooks/store";
import useLocalStorage from "@/hooks/use-local-storage";
// assets
import emptyModule from "@/public/empty-state/module.svg";

const ModuleIssuesPage = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, moduleId } = useParams();
  // store hooks
  const { fetchModuleDetails, getModuleById } = useModule();
  const { getProjectById } = useProject();
  // local storage
  const { setValue, storedValue } = useLocalStorage("module_sidebar_collapsed", "false");
  const isSidebarCollapsed = storedValue ? (storedValue === "true" ? true : false) : false;
  // fetching module details
  const { error } = useSWR(
    workspaceSlug && projectId && moduleId ? `CURRENT_MODULE_DETAILS_${moduleId.toString()}` : null,
    workspaceSlug && projectId && moduleId
      ? () => fetchModuleDetails(workspaceSlug.toString(), projectId.toString(), moduleId.toString())
      : null
  );
  // derived values
  const projectModule = moduleId ? getModuleById(moduleId.toString()) : undefined;
  const project = projectId ? getProjectById(projectId.toString()) : undefined;
  const pageTitle = project?.name && projectModule?.name ? `${project?.name} - ${projectModule?.name}` : undefined;

  const toggleSidebar = () => {
    setValue(`${!isSidebarCollapsed}`);
  };

  if (!workspaceSlug || !projectId || !moduleId) return <></>;

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
          {moduleId && !isSidebarCollapsed && (
            <div
              className="flex h-full w-[24rem] flex-shrink-0 flex-col gap-3.5 overflow-y-auto border-l border-custom-border-100 bg-custom-sidebar-background-100 px-6 duration-300 vertical-scrollbar scrollbar-sm"
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
});

export default ModuleIssuesPage;
