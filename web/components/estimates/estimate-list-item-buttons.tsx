import { observer } from "mobx-react";
import { Pen, Trash } from "lucide-react";

type TEstimateListItem = {
  estimateId: string;
  isAdmin: boolean;
  isEstimateEnabled: boolean;
  isEditable: boolean;
  onEditClick?: (estimateId: string) => void;
};

export const EstimateListItemButtons: FC<TEstimateListItem> = observer((props) => {
  const { estimateId, isAdmin, isEditable, onEditClick } = props;
  return isAdmin && isEditable ? (
    <div className="flex">
      <button
        className="relative flex-shrink-0 w-6 h-6 flex justify-center items-center rounded cursor-pointer transition-colors overflow-hidden hover:bg-custom-background-80"
        onClick={() => onEditClick && onEditClick(estimateId)}
      >
        <Pen size={12} />
      </button>
      <button
        className="relative flex-shrink-0 w-6 h-6 flex justify-center items-center rounded cursor-pointer transition-colors overflow-hidden hover:bg-custom-background-80"
        onClick={() => onEditClick && onEditClick(estimateId)}
      >
        <Trash size={12} />
      </button>
    </div>
  ) : null;
});
