import { FC, useState } from "react";
import { observer } from "mobx-react";
import { Plus } from "lucide-react";
import { TEstimatePointsObject } from "@plane/types";
import { Button, Draggable, Sortable } from "@plane/ui";
// components
import { EstimatePointItemPreview, EstimatePointCreate } from "@/components/estimates/points";
// constants
import { EEstimateUpdateStages, maxEstimatesCount } from "@/constants/estimates";
// hooks
import { useEstimate } from "@/hooks/store";

type TEstimatePointEditRoot = {
  workspaceSlug: string;
  projectId: string;
  estimateId: string;
  mode?: EEstimateUpdateStages;
};

export const EstimatePointEditRoot: FC<TEstimatePointEditRoot> = observer((props) => {
  // props
  const { workspaceSlug, projectId, estimateId } = props;
  // hooks
  const { asJson: estimate, estimatePointIds, estimatePointById, updateEstimateSortOrder } = useEstimate(estimateId);
  // states
  const [estimatePointCreateToggle, setEstimatePointCreateToggle] = useState(false);

  const estimatePoints: TEstimatePointsObject[] =
    estimatePointIds && estimatePointIds.length > 0
      ? (estimatePointIds.map((estimatePointId: string) => {
          const estimatePoint = estimatePointById(estimatePointId);
          if (estimatePoint) return { id: estimatePointId, key: estimatePoint.key, value: estimatePoint.value };
        }) as TEstimatePointsObject[])
      : ([] as TEstimatePointsObject[]);

  const handleDragEstimatePoints = (updatedEstimatedOrder: TEstimatePointsObject[]) => {
    const updatedEstimateKeysOrder = updatedEstimatedOrder.map((item, index) => ({ ...item, key: index + 1 }));
    updateEstimateSortOrder(workspaceSlug, projectId, updatedEstimateKeysOrder);
  };

  if (!workspaceSlug || !projectId || !estimateId) return <></>;
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-custom-text-200">{estimate?.type}</div>
      <Sortable
        data={estimatePoints}
        render={(value: TEstimatePointsObject) => (
          <Draggable data={value}>
            {value?.id && (
              <EstimatePointItemPreview
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                estimateId={estimateId}
                estimatePointId={value?.id}
              />
            )}
          </Draggable>
        )}
        onChange={(data: TEstimatePointsObject[]) => handleDragEstimatePoints(data)}
        keyExtractor={(item: TEstimatePointsObject) => item?.id?.toString() || item.value.toString()}
      />

      {estimatePointCreateToggle && (
        <EstimatePointCreate
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          estimateId={estimateId}
          callback={() => setEstimatePointCreateToggle(false)}
        />
      )}
      {estimatePoints && estimatePoints.length <= maxEstimatesCount && (
        <Button
          variant="link-primary"
          size="sm"
          prependIcon={<Plus />}
          onClick={() => setEstimatePointCreateToggle(true)}
          disabled={estimatePointCreateToggle}
        >
          Add {estimate?.type}
        </Button>
      )}
    </div>
  );
});
