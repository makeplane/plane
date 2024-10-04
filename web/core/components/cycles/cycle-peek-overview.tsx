import React, { useEffect } from "react";
import { observer } from "mobx-react";
import { usePathname, useSearchParams } from "next/navigation";
// hooks
import { generateQueryParams } from "@/helpers/router.helper";
import { useCycle } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
// components
import { CycleDetailsSidebar } from "./";

type Props = {
  projectId: string;
  workspaceSlug: string;
  isArchived?: boolean;
};

export const CyclePeekOverview: React.FC<Props> = observer(({ projectId, workspaceSlug, isArchived = false }) => {
  // router
  const router = useAppRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const peekCycle = searchParams.get("peekCycle");
  // refs
  const ref = React.useRef(null);
  // store hooks
  const { fetchCycleDetails, fetchArchivedCycleDetails } = useCycle();

  const handleClose = () => {
    const query = generateQueryParams(searchParams, ["peekCycle"]);
    router.push(`${pathname}?${query}`);
  };

  useEffect(() => {
    if (!peekCycle) return;
    if (isArchived) fetchArchivedCycleDetails(workspaceSlug, projectId, peekCycle.toString());
    else fetchCycleDetails(workspaceSlug, projectId, peekCycle.toString());
  }, [fetchArchivedCycleDetails, fetchCycleDetails, isArchived, peekCycle, projectId, workspaceSlug]);

  return (
    <>
      {peekCycle && (
        <div
          ref={ref}
          className="flex h-full w-full max-w-[21.5rem] flex-shrink-0 flex-col gap-3.5 overflow-y-auto border-l border-custom-border-100 bg-custom-sidebar-background-100 px-4 duration-300 fixed md:relative right-0 z-[9]"
          style={{
            boxShadow:
              "0px 1px 4px 0px rgba(0, 0, 0, 0.06), 0px 2px 4px 0px rgba(16, 24, 40, 0.06), 0px 1px 8px -1px rgba(16, 24, 40, 0.06)",
          }}
        >
          <CycleDetailsSidebar handleClose={handleClose} isArchived={isArchived} cycleId={peekCycle} />
        </div>
      )}
    </>
  );
});
