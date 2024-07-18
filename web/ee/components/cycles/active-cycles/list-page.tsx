import { FC, useEffect } from "react";
import useSWR from "swr";
// ui
import { Spinner } from "@plane/ui";
// components
import { WORKSPACE_ACTIVE_CYCLES_LIST } from "@/constants/fetch-keys";
// plane web components
import { WorkspaceActiveCyclesUpgrade } from "@/plane-web/components/active-cycles/";
import { ActiveCycleInfoCard } from "@/plane-web/components/cycles/active-cycles";
// constants
// services
import { CycleService } from "@/services/cycle.service";

const cycleService = new CycleService();

export type ActiveCyclesListPageProps = {
  workspaceSlug: string;
  cursor: string;
  perPage: number;
  updateTotalPages: (count: number) => void;
  updateResultsCount: (count: number) => void;
};

export const ActiveCyclesListPage: FC<ActiveCyclesListPageProps> = (props) => {
  const { workspaceSlug, cursor, perPage, updateTotalPages, updateResultsCount } = props;

  // fetching active cycles in workspace
  const { data: workspaceActiveCycles, error } = useSWR(
    workspaceSlug && cursor ? WORKSPACE_ACTIVE_CYCLES_LIST(workspaceSlug as string, cursor, `${perPage}`) : null,
    workspaceSlug && cursor ? () => cycleService.workspaceActiveCycles(workspaceSlug.toString(), cursor, perPage) : null
  );

  useEffect(() => {
    if (workspaceActiveCycles) {
      updateTotalPages(workspaceActiveCycles.total_pages);
      updateResultsCount(workspaceActiveCycles.results.length);
    }
  }, [updateTotalPages, updateResultsCount, workspaceActiveCycles]);

  if (error) {
    if (error.error_code === 1999) return <WorkspaceActiveCyclesUpgrade />;
    else throw Error(error.error);
  }

  if (!workspaceActiveCycles) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      {workspaceActiveCycles.results.map((cycle: any) => (
        <div key={cycle.id} className="px-5 pt-5 last:pb-5">
          <ActiveCycleInfoCard workspaceSlug={workspaceSlug?.toString()} projectId={cycle.project_id} cycle={cycle} />
        </div>
      ))}
    </>
  );
};
