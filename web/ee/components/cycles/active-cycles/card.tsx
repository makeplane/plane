import { FC } from "react";
// types
import { IActiveCycle } from "@plane/types";
// plane web components
import {
  ActiveCyclesProjectTitle,
  ActiveCycleHeader,
  ActiveCycleProgress,
  ActiveCycleProductivity,
  ActiveCyclePriorityIssues,
} from "@/plane-web/components/cycles/active-cycles";

export type ActiveCycleInfoCardProps = {
  cycle: IActiveCycle;
  workspaceSlug: string;
  projectId: string;
};

export const ActiveCycleInfoCard: FC<ActiveCycleInfoCardProps> = (props) => {
  const { cycle, workspaceSlug, projectId } = props;

  return (
    <div
      key={cycle.id}
      className="flex flex-col gap-4 p-4 rounded-xl border border-custom-border-200 bg-custom-background-100"
    >
      <ActiveCyclesProjectTitle project={cycle.project_detail} />

      <ActiveCycleHeader cycle={cycle} workspaceSlug={workspaceSlug} projectId={projectId} />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
        <ActiveCycleProgress cycle={cycle} />
        <ActiveCycleProductivity cycle={cycle} />
        <ActiveCyclePriorityIssues cycle={cycle} workspaceSlug={workspaceSlug} projectId={projectId} />
      </div>
    </div>
  );
};
