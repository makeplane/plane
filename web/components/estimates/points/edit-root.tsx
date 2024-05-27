import { FC, useState } from "react";
import { observer } from "mobx-react";
import { Draggable } from "@plane/ui";
// constants
import { EEstimateUpdateStages } from "@/constants/estimates";

type TEstimatePointEditRoot = {
  workspaceSlug: string;
  projectId: string;
  estimateId: string;
  mode: EEstimateUpdateStages;
};

type TEstimatePointEditingState = "update" | "delete";

export const EstimatePointEditRoot: FC<TEstimatePointEditRoot> = observer((props) => {
  // props
  const { workspaceSlug, projectId, estimateId, mode } = props;
  // hooks
  // states
  const [editingState, setEditingState] = useState<TEstimatePointEditingState | undefined>(undefined);

  const [estimateEditLoader, setEstimateEditLoader] = useState(false);
  const [deletedEstimateValue, setDeletedEstimateValue] = useState<string | undefined>(undefined);
  const [isEstimateEditing, setIsEstimateEditing] = useState(false);
  const [isEstimateDeleting, setIsEstimateDeleting] = useState(false);

  return <Draggable data={item}></Draggable>;
});
