"use client";

import { useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane types
import type { TIssue } from "@plane/types";
import { Spinner } from "@plane/ui";
// hooks
import { useLabel } from "@/hooks/store/use-label";
// local imports
import { PowerKLabelsMenu } from "../../../menus/labels";

type Props = {
  handleClose: () => void;
  handleUpdateWorkItem: (data: Partial<TIssue>) => void;
  workItemDetails: TIssue;
};

export const PowerKWorkItemLabelsMenu: React.FC<Props> = observer((props) => {
  const { workItemDetails } = props;
  // navigation
  const { workspaceSlug } = useParams();
  // store hooks
  const { getProjectLabelIds, getLabelById } = useLabel();
  // derived values
  const projectLabelIds = workItemDetails.project_id ? getProjectLabelIds(workItemDetails.project_id) : undefined;
  const labelsList = projectLabelIds ? projectLabelIds.map((labelId) => getLabelById(labelId)) : undefined;
  const filteredLabelsList = labelsList ? labelsList.filter((label) => !!label) : undefined;

  const handleUpdateLabels = useCallback(
    (labelId: string) => {
      if (!workspaceSlug || !workItemDetails || !workItemDetails.project_id) return;
      const updatedLabels = workItemDetails.label_ids ?? [];
      if (updatedLabels.includes(labelId)) updatedLabels.splice(updatedLabels.indexOf(labelId), 1);
      else updatedLabels.push(labelId);
    },
    [workItemDetails, workspaceSlug]
  );

  if (!filteredLabelsList) return <Spinner />;

  return <PowerKLabelsMenu labels={filteredLabelsList} onSelect={(label) => handleUpdateLabels(label.id)} />;
});
