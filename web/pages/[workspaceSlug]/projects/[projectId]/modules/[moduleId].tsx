import React, { useState } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// hooks
import useLocalStorage from "hooks/use-local-storage";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { ExistingIssuesListModal } from "components/core";
import { ModuleDetailsSidebar } from "components/modules";
import { ModuleLayoutRoot } from "components/issues";
import { ModuleIssuesHeader } from "components/headers";
// ui
import { EmptyState } from "components/common";
// assets
import emptyModule from "public/empty-state/module.svg";
// types
import { NextPage } from "next";

const ModuleIssuesPage: NextPage = () => {
  const [moduleIssuesListModal, setModuleIssuesListModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId, moduleId } = router.query;

  const { module: moduleStore } = useMobxStore();

  const { setValue, storedValue } = useLocalStorage("module_sidebar_collapsed", "false");
  const isSidebarCollapsed = storedValue ? (storedValue === "true" ? true : false) : false;

  const { error } = useSWR(
    workspaceSlug && projectId && moduleId ? `CURRENT_MODULE_DETAILS_${moduleId.toString()}` : null,
    workspaceSlug && projectId && moduleId
      ? () => moduleStore.fetchModuleDetails(workspaceSlug.toString(), projectId.toString(), moduleId.toString())
      : null
  );

  // TODO: add this function to bulk add issues to cycle
  // const handleAddIssuesToModule = async (data: ISearchIssueResponse[]) => {
  //   if (!workspaceSlug || !projectId) return;

  //   const payload = {
  //     issues: data.map((i) => i.id),
  //   };

  //   await moduleService
  //     .addIssuesToModule(workspaceSlug as string, projectId as string, moduleId as string, payload, user)
  //     .catch(() =>
  //       setToastAlert({
  //         type: "error",
  //         title: "Error!",
  //         message: "Selected issues could not be added to the module. Please try again.",
  //       })
  //     );
  // };

  // const openIssuesListModal = () => {
  //   setModuleIssuesListModal(true);
  // };

  const toggleSidebar = () => {
    setValue(`${!isSidebarCollapsed}`);
  };

  return (
    <>
      <AppLayout header={<ModuleIssuesHeader />} withProjectWrapper>
        {/* TODO: Update logic to bulk add issues to a cycle */}
        <ExistingIssuesListModal
          isOpen={moduleIssuesListModal}
          handleClose={() => setModuleIssuesListModal(false)}
          searchParams={{ module: true }}
          handleOnSubmit={async () => {}}
        />
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
            <div className="h-full w-full">
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
      </AppLayout>
    </>
  );
};

export default ModuleIssuesPage;
