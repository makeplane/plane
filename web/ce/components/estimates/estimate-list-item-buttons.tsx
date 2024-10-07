import { FC } from "react";
import { observer } from "mobx-react";
import { Pen, Trash } from "lucide-react";
import { Tooltip } from "@plane/ui";
// components
import { ProIcon } from "@/components/common";

type TEstimateListItem = {
  estimateId: string;
  isAdmin: boolean;
  isEstimateEnabled: boolean;
  isEditable: boolean;
  onEditClick?: (estimateId: string) => void;
  onDeleteClick?: (estimateId: string) => void;
};

export const EstimateListItemButtons: FC<TEstimateListItem> = observer((props) => {
  const { estimateId, isAdmin, isEditable, onDeleteClick } = props;

  if (!isAdmin || !isEditable) return <></>;
  return (
    <div className="relative flex items-center gap-1">
      <Tooltip
        tooltipContent={
          <div className="relative flex items-center gap-2">
            <div>Upgrade</div>
            <ProIcon className="w-3 h-3" />
          </div>
        }
        position="top"
      >
        <button className="relative flex-shrink-0 w-6 h-6 flex justify-center items-center rounded cursor-pointer transition-colors overflow-hidden hover:bg-custom-background-80">
          <Pen size={12} />
        </button>
      </Tooltip>
      <button
        className="relative flex-shrink-0 w-6 h-6 flex justify-center items-center rounded cursor-pointer transition-colors overflow-hidden hover:bg-custom-background-80"
        onClick={() => onDeleteClick && onDeleteClick(estimateId)}
      >
        <Trash size={12} />
      </button>
    </div>
  );
});
