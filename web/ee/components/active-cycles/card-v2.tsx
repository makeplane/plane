import { FC } from "react";
// types
import { observer } from "mobx-react";
import { IActiveCycle } from "@plane/types";
// plane web components
import { ActiveCyclesProjectTitle, ActiveCycleHeader } from "@/plane-web/components/active-cycles";
import ActiveCycleDetail from "../cycles/active-cycle/details";
import useCycleDetails from "../cycles/active-cycle/use-cycle-details";

export type ActiveCycleInfoCardProps = {
  cycle: IActiveCycle;
  workspaceSlug: string;
  projectId: string;
};

export const ActiveCycleInfoCard: FC<ActiveCycleInfoCardProps> = observer((props) => {
  const { cycle, workspaceSlug, projectId } = props;
  const cycleDetails = useCycleDetails({ workspaceSlug, projectId, cycleId: cycle.id, defaultCycle: cycle });
  return (
    <div
      key={cycle.id}
      className="flex flex-col gap-4 p-4 rounded-xl border border-custom-border-200 bg-custom-background-100"
    >
      <ActiveCyclesProjectTitle project={cycle.project_detail} />
      <ActiveCycleHeader cycle={cycle} workspaceSlug={workspaceSlug} projectId={projectId} />
      <ActiveCycleDetail {...cycleDetails} />
    </div>
  );
});
