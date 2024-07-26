import { FC } from "react";
import { observer } from "mobx-react";
// components
import { EstimateListItem } from "@/components/estimates";

type TEstimateList = {
  estimateIds: string[] | undefined;
  isAdmin: boolean;
  isEstimateEnabled?: boolean;
  isEditable?: boolean;
  onEditClick?: (estimateId: string) => void;
  onDeleteClick?: (estimateId: string) => void;
};

export const EstimateList: FC<TEstimateList> = observer((props) => {
  const { estimateIds, isAdmin, isEstimateEnabled = false, isEditable = false, onEditClick, onDeleteClick } = props;

  if (!estimateIds || estimateIds?.length <= 0) return <></>;
  return (
    <div>
      {estimateIds &&
        estimateIds.map((estimateId) => (
          <EstimateListItem
            key={estimateId}
            estimateId={estimateId}
            isAdmin={isAdmin}
            isEstimateEnabled={isEstimateEnabled}
            isEditable={isEditable}
            onEditClick={onEditClick}
            onDeleteClick={onDeleteClick}
          />
        ))}
    </div>
  );
});
