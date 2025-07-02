import { FC, useMemo } from "react";
import useSWR from "swr";
// types
import { IActiveCycle } from "@plane/types";
// plane web components
import { Card } from "@plane/ui";
import {
  ActiveCyclesProjectTitle,
  ActiveCycleHeader,
  ActiveCycleProgress,
  ActiveCycleProductivity,
} from "@/plane-web/components/active-cycles";
// services
import { CycleService } from "@/services/cycle.service";
import { ActiveCyclePriorityIssues } from "./priority-issues";

const cycleService = new CycleService();

export type ActiveCycleInfoCardProps = {
  cycle: IActiveCycle;
  workspaceSlug: string;
  projectId: string;
};

export const ActiveCycleInfoCard: FC<ActiveCycleInfoCardProps> = (props) => {
  const { cycle, workspaceSlug, projectId } = props;

  const { data: progress } = useSWR(
    `PROJECTS_${cycle.project_detail.id}_PROGRESS_${cycle.id}`,
    workspaceSlug && cycle?.project_detail?.id && cycle?.id
      ? () => cycleService.workspaceActiveCyclesProgress(workspaceSlug.toString(), cycle.project_detail.id, cycle.id)
      : null,
    {
      revalidateOnFocus: false,
    }
  );

  const cycleData = useMemo(() => {
    const cycleDetails = {
      ...cycle,
      ...progress,
    };
    return cycleDetails;
  }, [progress, cycle]);

  return (
    <Card key={cycle.id}>
      <ActiveCyclesProjectTitle project={cycle.project_detail} />

      <ActiveCycleHeader cycle={cycle} workspaceSlug={workspaceSlug} projectId={projectId} />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
        <ActiveCycleProgress cycle={cycleData} />
        <ActiveCycleProductivity cycle={cycleData} workspaceSlug={workspaceSlug} />
        <ActiveCyclePriorityIssues cycle={cycle} workspaceSlug={workspaceSlug} projectId={projectId} />
      </div>
    </Card>
  );
};
