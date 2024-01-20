import { useEffect, useState } from "react";
import useSWR from "swr";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import isEqual from "lodash/isEqual";
// components
import { ActiveCycleInfo } from "components/cycles";
import { Button, ContrastIcon, Spinner } from "@plane/ui";
// services
import { CycleService } from "services/cycle.service";
const cycleService = new CycleService();
// constants
import { WORKSPACE_ACTIVE_CYCLES_LIST } from "constants/fetch-keys";
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
        <div className="grid h-full place-items-center text-center">
          <div className="space-y-2">
            <div className="mx-auto flex justify-center">
              <ContrastIcon className="h-40 w-40 text-custom-text-300" />
            </div>
            <h4 className="text-base text-custom-text-200">
              No ongoing cycles are currently active in any of the projects.
            </h4>
          </div>
        </div>
      )}
    </div>
  );
});
