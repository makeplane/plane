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
import { CycleIssuesHeader } from "components/headers";
import { CycleDetailsSidebar } from "components/cycles";
import { CycleLayoutRoot } from "components/issues/issue-layouts";
// ui
import { EmptyState } from "components/common";
// assets
import emptyCycle from "public/empty-state/cycle.svg";
// types
import { NextPageWithLayout } from "types/app";

const CycleDetailPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { workspaceSlug, projectId, cycleId } = router.query;

  const { cycle: cycleStore } = useMobxStore();

  const { setValue, storedValue } = useLocalStorage("cycle_sidebar_collapsed", "false");
  const isSidebarCollapsed = storedValue ? (storedValue === "true" ? true : false) : false;

  const { error } = useSWR(
    workspaceSlug && projectId && cycleId ? `CURRENT_CYCLE_DETAILS_${cycleId.toString()}` : null,
    workspaceSlug && projectId && cycleId
      ? () => cycleStore.fetchCycleWithId(workspaceSlug.toString(), projectId.toString(), cycleId.toString())
      : null
  );

  const toggleSidebar = () => {
    setValue(`${!isSidebarCollapsed}`);
  };

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
                className="flex flex-col gap-3.5 h-full w-[24rem] z-10 overflow-y-auto border-l border-custom-border-100 bg-custom-sidebar-background-100 px-6 py-3.5 duration-300 flex-shrink-0"
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
