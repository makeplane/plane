import { observer } from "mobx-react";
import { PROJECT_SETTINGS_TRACKER_ELEMENTS } from "@plane/constants";
import { TrashIcon } from "@plane/propel/icons";

type TEstimateListItem = {
  estimateId: string;
  isAdmin: boolean;
  isEstimateEnabled: boolean;
  isEditable: boolean;
  onEditClick?: (estimateId: string) => void;
  onDeleteClick?: (estimateId: string) => void;
};

export const EstimateListItemButtons = observer(function EstimateListItemButtons(props: TEstimateListItem) {
  const { estimateId, isAdmin, isEditable, onDeleteClick } = props;

  if (!isAdmin || !isEditable) return <></>;
  return (
    <div className="relative flex items-center gap-1">
      <button
        className="relative flex-shrink-0 w-6 h-6 flex justify-center items-center rounded-sm cursor-pointer transition-colors overflow-hidden hover:bg-layer-1"
        onClick={() => onDeleteClick && onDeleteClick(estimateId)}
        data-ph-element={PROJECT_SETTINGS_TRACKER_ELEMENTS.ESTIMATES_LIST_ITEM}
      >
        <TrashIcon width={12} height={12} />
      </button>
    </div>
  );
});
