import { FC } from "react";
import { observer } from "mobx-react";
import { Pen } from "lucide-react";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useEstimate, useProjectEstimates } from "@/hooks/store";

type TEstimateListItem = {
  estimateId: string;
  isAdmin: boolean;
  isEstimateEnabled: boolean;
  isEditable: boolean;
  onEditClick?: (estimateId: string) => void;
};

export const EstimateListItem: FC<TEstimateListItem> = observer((props) => {
  const { estimateId, isAdmin, isEstimateEnabled, isEditable, onEditClick } = props;
  // hooks
  const { estimateById } = useProjectEstimates();
  const { estimatePointIds, estimatePointById } = useEstimate(estimateId);
  const currentEstimate = estimateById(estimateId);

  // derived values
  const estimatePointValues = estimatePointIds?.map((estimatePointId) => {
    const estimatePoint = estimatePointById(estimatePointId);
    if (estimatePoint) return estimatePoint.value;
  });

  if (!currentEstimate) return <></>;
  return (
    <div
      className={cn(
        "relative border-b border-custom-border-200 flex justify-between items-center gap-3 py-3.5",
        isAdmin && isEditable && isEstimateEnabled ? `text-custom-text-100` : `text-custom-text-200`
      )}
    >
      <div className="space-y-1">
        <h3 className="font-medium text-base">{currentEstimate?.name}</h3>
        <p className="text-xs">{(estimatePointValues || [])?.join(", ")}</p>
      </div>
      {isAdmin && isEditable && (
        <div
          className="relative flex-shrink-0 w-6 h-6 flex justify-center items-center rounded cursor-pointer transition-colors overflow-hidden hover:bg-custom-background-80"
          onClick={() => onEditClick && onEditClick(estimateId)}
        >
          <Pen size={12} />
        </div>
      )}
    </div>
  );
});
