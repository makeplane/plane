import { observer } from "mobx-react";
// plane types
import type { ICycle, TIssue } from "@plane/types";
import { Spinner } from "@plane/ui";
// components
import { PowerKCyclesMenu } from "@/components/power-k/menus/cycles";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";

type Props = {
  handleSelect: (cycle: ICycle) => void;
  workItemDetails: TIssue;
};

export const PowerKWorkItemCyclesMenu = observer(function PowerKWorkItemCyclesMenu(props: Props) {
  const { handleSelect, workItemDetails } = props;
  // store hooks
  const { getProjectCycleIds, getCycleById } = useCycle();
  // derived values
  const projectCycleIds = workItemDetails.project_id ? getProjectCycleIds(workItemDetails.project_id) : undefined;
  const cyclesList = projectCycleIds ? projectCycleIds.map((cycleId) => getCycleById(cycleId)) : undefined;
  const filteredCyclesList = cyclesList ? cyclesList.filter((cycle) => !!cycle) : undefined;

  if (!filteredCyclesList) return <Spinner />;

  return <PowerKCyclesMenu cycles={filteredCyclesList} onSelect={handleSelect} value={workItemDetails.cycle_id} />;
});
