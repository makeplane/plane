import { FC } from "react";
import { observer } from "mobx-react";
// components
import { EstimateListItem } from "@/components/estimates";

type TEstimateList = {
  estimateIds: string[] | undefined;
  isAdmin: boolean;
  isEditable?: boolean;
  onEditClick?: (estimateId: string) => void;
};

export const EstimateList: FC<TEstimateList> = observer((props) => {
  const { estimateIds, isAdmin, isEditable = false, onEditClick } = props;

  if (!estimateIds || estimateIds?.length <= 0) return <></>;
  return (
    <div>
      {estimateIds &&
        estimateIds.map((estimateId) => (
          <EstimateListItem
            key={estimateId}
            estimateId={estimateId}
            isAdmin={isAdmin}
            isEditable={isEditable}
            onEditClick={onEditClick}
          />
        ))}
    </div>
  );
});
