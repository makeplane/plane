"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane types
import { EIssueServiceType, type TIssue } from "@plane/types";
import { setToast, Spinner, TOAST_TYPE } from "@plane/ui";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// local imports
import { PowerKCyclesMenu } from "../../../menus/cycles";

type Props = {
  handleClose: () => void;
  workItemDetails: TIssue;
};

export const PowerKWorkItemCyclesMenu: React.FC<Props> = observer((props) => {
  const { handleClose, workItemDetails } = props;
  // navigation
  const { workspaceSlug } = useParams();
  // store hooks
  const { getProjectCycleIds, getCycleById } = useCycle();
  const {
    issue: { addCycleToIssue, removeIssueFromCycle },
  } = useIssueDetail(EIssueServiceType.ISSUES);
  const {
    issue: { addCycleToIssue: addCycleToEpic, removeIssueFromCycle: removeEpicFromCycle },
  } = useIssueDetail(EIssueServiceType.EPICS);
  // derived values
  const projectCycleIds = workItemDetails.project_id ? getProjectCycleIds(workItemDetails.project_id) : undefined;
  const cyclesList = projectCycleIds ? projectCycleIds.map((cycleId) => getCycleById(cycleId)) : undefined;
  const filteredCyclesList = cyclesList ? cyclesList.filter((cycle) => !!cycle) : undefined;
  // handlers
  const addCycleToEntity = workItemDetails.is_epic ? addCycleToEpic : addCycleToIssue;
  const removeCycleFromEntity = workItemDetails.is_epic ? removeEpicFromCycle : removeIssueFromCycle;

  const handleCycleUpdate = (cycleId: string | null) => {
    if (!workspaceSlug || !workItemDetails || !workItemDetails.project_id) return;
    if (workItemDetails.cycle_id === cycleId) return;
    try {
      if (cycleId) {
        addCycleToEntity(workspaceSlug.toString(), workItemDetails.project_id, cycleId, workItemDetails.id);
      } else {
        removeCycleFromEntity(
          workspaceSlug.toString(),
          workItemDetails.project_id,
          workItemDetails.cycle_id ?? "",
          workItemDetails.id
        );
      }
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: `${workItemDetails.is_epic ? "Epic" : "Work item"} could not be updated. Please try again.`,
      });
    }
    handleClose();
  };

  if (!filteredCyclesList) return <Spinner />;

  return <PowerKCyclesMenu cycles={filteredCyclesList} onSelect={(cycle) => handleCycleUpdate(cycle.id)} />;
});
