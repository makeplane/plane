import { FC } from "react";
// components
import {
  ActiveCyclesProjectTitle,
  ActiveCycleHeader,
  ActiveCycleProgress,
  ActiveCycleProductivity,
  ActiveCyclePriorityIssues,
} from "components/cycles/active-cycles";
// types
import { ICycle } from "@plane/types";

export type ActiveCycleInfoCardProps = {
  cycle: ICycle;
  workspaceSlug: string;
  projectId: string;
};

export const ActiveCycleInfoCard: FC<ActiveCycleInfoCardProps> = (props) => {
  const { cycle, workspaceSlug, projectId } = props;

  return (
    <>
      <ActiveCyclesProjectTitle project={cycle.project_detail} />
      <div className="flex flex-col gap-2 rounded border border-custom-border-200">
        <ActiveCycleHeader cycle={cycle} workspaceSlug={workspaceSlug} projectId={projectId} />
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          <ActiveCycleProgress cycle={cycle} />
          <ActiveCycleProductivity cycle={cycle} />
          <ActiveCyclePriorityIssues cycle={cycle} workspaceSlug={workspaceSlug} projectId={projectId} />
        </div>
      </div>
    </>
  );
};
