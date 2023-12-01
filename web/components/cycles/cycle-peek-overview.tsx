import React, { useEffect } from "react";

import { useRouter } from "next/router";

// mobx
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { CycleDetailsSidebar } from "./sidebar";

type Props = {
  projectId: string;
  workspaceSlug: string;
};

export const CyclePeekOverview: React.FC<Props> = observer(({ projectId, workspaceSlug }) => {
  const router = useRouter();
  const { peekCycle } = router.query;

  const ref = React.useRef(null);

  const { cycle: cycleStore } = useMobxStore();

  const { fetchCycleWithId } = cycleStore;

  const handleClose = () => {
    delete router.query.peekCycle;
    router.push({
      pathname: router.pathname,
      query: { ...router.query },
    });
  };

  useEffect(() => {
    if (!peekCycle) return;
    fetchCycleWithId(workspaceSlug, projectId, peekCycle.toString());
  }, [fetchCycleWithId, peekCycle, projectId, workspaceSlug]);

  return (
    <>
      {peekCycle && (
        <div
          ref={ref}
          className="flex flex-col gap-3.5 h-full w-[24rem] overflow-y-auto border-l border-custom-border-100 bg-custom-sidebar-background-100 px-6 py-3.5 duration-300 flex-shrink-0"
          style={{
            boxShadow:
              "0px 1px 4px 0px rgba(0, 0, 0, 0.06), 0px 2px 4px 0px rgba(16, 24, 40, 0.06), 0px 1px 8px -1px rgba(16, 24, 40, 0.06)",
          }}
        >
          <CycleDetailsSidebar cycleId={peekCycle?.toString() ?? ""} handleClose={handleClose} />
        </div>
      )}
    </>
  );
});
