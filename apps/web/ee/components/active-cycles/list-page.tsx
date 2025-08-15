import { FC, useEffect } from "react";
import useSWR from "swr";
// components
import { WorkspaceActiveCycleLoader } from "@/components/ui/loader/workspace-active-cycle";
// constants
import { WORKSPACE_ACTIVE_CYCLES_LIST } from "@/constants/fetch-keys";
// plane web components
// services
import { CycleService } from "@/services/cycle.service";
import { ActiveCycleInfoCard } from "./card-v2";
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
  const { data: workspaceActiveCycles, isLoading } = useSWR(
    workspaceSlug && cursor ? WORKSPACE_ACTIVE_CYCLES_LIST(workspaceSlug as string, cursor, `${perPage}`) : null,
    workspaceSlug && cursor ? () => cycleService.workspaceActiveCycles(workspaceSlug.toString(), cursor, perPage) : null
  );

  useEffect(() => {
    if (workspaceActiveCycles) {
      updateTotalPages(workspaceActiveCycles.total_pages);
      updateResultsCount(workspaceActiveCycles.results.length);
    }
  }, [updateTotalPages, updateResultsCount, workspaceActiveCycles]);

  if (!workspaceActiveCycles || isLoading) {
    return <WorkspaceActiveCycleLoader />;
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
