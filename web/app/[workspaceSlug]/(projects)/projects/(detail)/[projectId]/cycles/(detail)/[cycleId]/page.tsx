"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import { EmptyState } from "@/components/common";
import { PageHead } from "@/components/core";
import { CycleDetailsSidebar } from "@/components/cycles";
import useCyclesDetails from "@/components/cycles/active-cycle/use-cycles-details";
import { CycleLayoutRoot } from "@/components/issues/issue-layouts";
// constants
// import { EIssuesStoreType } from "@/constants/issue";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useCycle, useProject } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import useLocalStorage from "@/hooks/use-local-storage";
// assets
import emptyCycle from "@/public/empty-state/cycle.svg";

const CycleDetailPage = observer(() => {
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId, cycleId } = useParams();
  // store hooks
  const { getCycleById, loader } = useCycle();
  const { getProjectById } = useProject();
  // const { issuesFilter } = useIssues(EIssuesStoreType.CYCLE);
  // hooks
  const { setValue, storedValue } = useLocalStorage("cycle_sidebar_collapsed", "false");

  useCyclesDetails({
    workspaceSlug: workspaceSlug.toString(),
    projectId: projectId.toString(),
    cycleId: cycleId.toString(),
  });
  // derived values
  const isSidebarCollapsed = storedValue ? (storedValue === "true" ? true : false) : false;
  const cycle = cycleId ? getCycleById(cycleId.toString()) : undefined;
  const project = projectId ? getProjectById(projectId.toString()) : undefined;
  const pageTitle = project?.name && cycle?.name ? `${project?.name} - ${cycle?.name}` : undefined;

  /**
   * Toggles the sidebar
   */
  const toggleSidebar = () => setValue(`${!isSidebarCollapsed}`);

  // const activeLayout = issuesFilter?.issueFilters?.displayFilters?.layout;

  return (
    <>
      <PageHead title={pageTitle} />
      {!cycle && !loader ? (
        <EmptyState
          image={emptyCycle}
          title="Cycle does not exist"
          description="The cycle you are looking for does not exist or has been deleted."
          primaryButton={{
            text: "View other cycles",
            onClick: () => router.push(`/${workspaceSlug}/projects/${projectId}/cycles`),
          }}
        />
      ) : (
        <>
          <div className="flex h-full w-full">
            <div className="h-full w-full overflow-hidden">
              <CycleLayoutRoot />
            </div>
            {cycleId && !isSidebarCollapsed && (
              <div
                className={cn(
                  "flex h-full w-[21.5rem] flex-shrink-0 flex-col gap-3.5 overflow-y-auto border-l border-custom-border-100 bg-custom-sidebar-background-100 px-4 duration-300 vertical-scrollbar scrollbar-sm absolute right-0 z-[13]"
                )}
                style={{
                  boxShadow:
                    "0px 1px 4px 0px rgba(0, 0, 0, 0.06), 0px 2px 4px 0px rgba(16, 24, 40, 0.06), 0px 1px 8px -1px rgba(16, 24, 40, 0.06)",
                }}
              >
                <CycleDetailsSidebar handleClose={toggleSidebar} />
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
});

export default CycleDetailPage;
