import { observer } from "mobx-react";
// plane imports
import { cn } from "@plane/utils";
// assets
import emptyCycle from "@/app/assets/empty-state/cycle.svg?url";
// components
import { EmptyState } from "@/components/common/empty-state";
import { PageHead } from "@/components/core/page-title";
import useCyclesDetails from "@/components/cycles/active-cycle/use-cycles-details";
import { CycleDetailsSidebar } from "@/components/cycles/analytics-sidebar";
import { CycleLayoutRoot } from "@/components/issues/issue-layouts/roots/cycle-layout-root";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";
import useLocalStorage from "@/hooks/use-local-storage";
import type { Route } from "./+types/page";

function CycleDetailPage({ params }: Route.ComponentProps) {
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId, cycleId } = params;
  // store hooks
  const { getCycleById, loader } = useCycle();
  const { getProjectById } = useProject();
  // const { issuesFilter } = useIssues(EIssuesStoreType.CYCLE);
  // hooks
  const { setValue, storedValue } = useLocalStorage("cycle_sidebar_collapsed", false);

  useCyclesDetails({
    workspaceSlug,
    projectId,
    cycleId,
  });
  // derived values
  const isSidebarCollapsed = storedValue ? (storedValue === true ? true : false) : false;
  const cycle = getCycleById(cycleId);
  const project = getProjectById(projectId);
  const pageTitle = project?.name && cycle?.name ? `${project?.name} - ${cycle?.name}` : undefined;

  /**
   * Toggles the sidebar
   */
  const toggleSidebar = () => setValue(!isSidebarCollapsed);

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
            {!isSidebarCollapsed && (
              <div
                className={cn(
                  "flex h-full w-[21.5rem] flex-shrink-0 flex-col gap-3.5 overflow-y-auto border-l border-subtle bg-surface-1 px-4 duration-300 vertical-scrollbar scrollbar-sm absolute right-0 z-13 shadow-raised-200"
                )}
              >
                <CycleDetailsSidebar
                  handleClose={toggleSidebar}
                  cycleId={cycleId}
                  projectId={projectId}
                  workspaceSlug={workspaceSlug}
                />
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

export default observer(CycleDetailPage);
