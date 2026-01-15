import { observer } from "mobx-react";
// plane types
import type { ICycle } from "@plane/types";
import { Spinner } from "@plane/ui";
// components
import type { TPowerKContext } from "@/components/power-k/core/types";
import { PowerKCyclesMenu } from "@/components/power-k/menus/cycles";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";

type Props = {
  context: TPowerKContext;
  handleSelect: (cycle: ICycle) => void;
};

export const PowerKOpenProjectCyclesMenu = observer(function PowerKOpenProjectCyclesMenu(props: Props) {
  const { context, handleSelect } = props;
  // store hooks
  const { fetchedMap, getProjectCycleIds, getCycleById } = useCycle();
  // derived values
  const projectId = context.params.projectId?.toString();
  const isFetched = projectId ? fetchedMap[projectId] : false;
  const projectCycleIds = projectId ? getProjectCycleIds(projectId) : undefined;
  const cyclesList = projectCycleIds
    ? projectCycleIds.map((cycleId) => getCycleById(cycleId)).filter((cycle) => !!cycle)
    : [];

  if (!isFetched) return <Spinner />;

  return <PowerKCyclesMenu cycles={cyclesList} onSelect={handleSelect} />;
});
