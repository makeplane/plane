import { ReactElement } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
// hooks
import { useCycle } from "hooks/store";
import useLocalStorage from "hooks/use-local-storage";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { CycleIssuesHeader } from "components/headers";
import { CycleDetailsSidebar } from "components/cycles";
import { CycleLayoutRoot } from "components/issues/issue-layouts";
// ui
import { EmptyState } from "components/common";
// assets
import emptyCycle from "public/empty-state/cycle.svg";
// types
import { NextPageWithLayout } from "lib/types";

const CycleDetailPage: NextPageWithLayout = () => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, cycleId } = router.query;
  // store hooks
  const { fetchCycleDetails } = useCycle();

  const { setValue, storedValue } = useLocalStorage("cycle_sidebar_collapsed", "false");
  const isSidebarCollapsed = storedValue ? (storedValue === "true" ? true : false) : false;

  const { error } = useSWR(
    workspaceSlug && projectId && cycleId ? `CYCLE_DETAILS_${cycleId.toString()}` : null,
    workspaceSlug && projectId && cycleId
      ? () => fetchCycleDetails(workspaceSlug.toString(), projectId.toString(), cycleId.toString())
      : null
  );

  const toggleSidebar = () => setValue(`${!isSidebarCollapsed}`);

  return (
    <>
      {error ? (
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
                className="flex h-full w-[24rem] flex-shrink-0 flex-col gap-3.5 overflow-y-auto border-l border-custom-border-100 bg-custom-sidebar-background-100 px-6 py-3.5 duration-300"
                style={{
                  boxShadow:
                    "0px 1px 4px 0px rgba(0, 0, 0, 0.06), 0px 2px 4px 0px rgba(16, 24, 40, 0.06), 0px 1px 8px -1px rgba(16, 24, 40, 0.06)",
                }}
              >
                <CycleDetailsSidebar cycleId={cycleId.toString()} handleClose={toggleSidebar} />
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
};

CycleDetailPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<CycleIssuesHeader />} withProjectWrapper>
      {page}
    </AppLayout>
  );
};

export default CycleDetailPage;
