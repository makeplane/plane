import { useEffect, useState } from "react";
import useSWR from "swr";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import isEqual from "lodash/isEqual";
// hooks
import { useUser } from "hooks/store";
// components
import { ActiveCycleInfo } from "components/cycles";
import { Button, Spinner } from "@plane/ui";
import { EmptyState, getEmptyStateImagePath } from "components/empty-state";
// services
import { CycleService } from "services/cycle.service";
const cycleService = new CycleService();
// constants
import { WORKSPACE_ACTIVE_CYCLES_LIST } from "constants/fetch-keys";
import { EUserWorkspaceRoles } from "constants/workspace";
// types
import { ICycle } from "@plane/types";

const per_page = 3;

export const WorkspaceActiveCyclesList = observer(() => {
  // state
  const [cursor, setCursor] = useState<string | undefined>(`3:0:0`);
  const [allCyclesData, setAllCyclesData] = useState<ICycle[]>([]);
  const [hasMoreResults, setHasMoreResults] = useState(true);
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const {
    membership: { currentWorkspaceRole },
    currentUser,
  } = useUser();

  // fetching active cycles in workspace
  const { data: workspaceActiveCycles, isLoading } = useSWR(
    workspaceSlug && cursor ? WORKSPACE_ACTIVE_CYCLES_LIST(workspaceSlug as string, cursor, `${per_page}`) : null,
    workspaceSlug && cursor
      ? () => cycleService.workspaceActiveCycles(workspaceSlug.toString(), cursor, per_page)
      : null
  );

  useEffect(() => {
    if (workspaceActiveCycles && !isEqual(workspaceActiveCycles.results, allCyclesData)) {
      setAllCyclesData((prevData) => [...prevData, ...workspaceActiveCycles.results]);
      setHasMoreResults(workspaceActiveCycles.next_page_results);
    }
  }, [workspaceActiveCycles]);

  const handleLoadMore = () => {
    if (hasMoreResults) {
      setCursor(workspaceActiveCycles?.next_cursor);
    }
  };

  if (allCyclesData.length === 0 && !workspaceActiveCycles) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Spinner />
      </div>
    );
  }

  const EmptyStateImagePath = getEmptyStateImagePath(
    "onboarding",
    "workspace-active-cycles",
    currentUser?.theme.theme === "light"
  );
  const isEditingAllowed = !!currentWorkspaceRole && currentWorkspaceRole >= EUserWorkspaceRoles.MEMBER;

  return (
    <div className="h-full w-full">
      {allCyclesData.length > 0 ? (
        <>
          {workspaceSlug &&
            allCyclesData.map((cycle) => (
              <div key={cycle.id} className="px-5 py-5">
                <ActiveCycleInfo workspaceSlug={workspaceSlug?.toString()} projectId={cycle.project} cycle={cycle} />
              </div>
            ))}

          {hasMoreResults && (
            <div className="flex items-center justify-center gap-4 text-xs w-full py-5">
              <Button variant="outline-primary" size="sm" onClick={handleLoadMore}>
                {isLoading ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          image={EmptyStateImagePath}
          title="No active cycles"
          description="Cycles of your projects that includes any period that encompasses today's date within its range. Find the progress and details of all your active cycle here."
          size="lg"
          disabled={!isEditingAllowed}
        />
      )}
    </div>
  );
});
