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
  const [estimatePointCreate, setEstimatePointCreate] = useState<TEstimatePointsObject[] | undefined>(undefined);

  const estimatePoints: TEstimatePointsObject[] =
    estimatePointIds && estimatePointIds.length > 0
      ? (estimatePointIds.map((estimatePointId: string) => {
          const estimatePoint = estimatePointById(estimatePointId);
          if (estimatePoint) return { id: estimatePointId, key: estimatePoint.key, value: estimatePoint.value };
        }) as TEstimatePointsObject[])
      : ([] as TEstimatePointsObject[]);

  const handleEstimatePointCreate = (mode: "add" | "remove", value: TEstimatePointsObject) => {
    switch (mode) {
      case "add":
        setEstimatePointCreate((prevValue) => {
          prevValue = prevValue ? [...prevValue] : [];
          return [...prevValue, value];
        });
        break;
      case "remove":
        setEstimatePointCreate((prevValue) => {
          prevValue = prevValue ? [...prevValue] : [];
          return prevValue.filter((item) => item.key !== value.key);
        });
        break;
      default:
        break;
    }
  };

  const handleDragEstimatePoints = (updatedEstimatedOrder: TEstimatePointsObject[]) => {
    const updatedEstimateKeysOrder = updatedEstimatedOrder.map((item, index) => ({ ...item, key: index + 1 }));
    updateEstimateSortOrder(workspaceSlug, projectId, updatedEstimateKeysOrder);
  };

  if (!workspaceSlug || !projectId || !estimateId) return <></>;
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-custom-text-200 capitalize">{estimate?.type}</div>
      <Sortable
        data={estimatePoints}
        render={(value: TEstimatePointsObject) => (
          <Draggable data={value}>
            {value?.id && estimate?.type && (
              <EstimatePointItemPreview
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                estimateId={estimateId}
                estimatePointId={value?.id}
                estimateType={estimate?.type}
                estimatePoint={value}
                estimatePoints={estimatePoints}
              />
            )}
          </Draggable>
        )}
        onChange={(data: TEstimatePointsObject[]) => handleDragEstimatePoints(data)}
        keyExtractor={(item: TEstimatePointsObject) => item?.id?.toString() || item.value.toString()}
      />

      {estimatePointCreate &&
        estimatePointCreate.map(
          (estimatePoint) =>
            estimate?.type && (
              <EstimatePointCreate
                key={estimatePoint?.key}
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                estimateId={estimateId}
                estimateType={estimate?.type}
                closeCallBack={() => handleEstimatePointCreate("remove", estimatePoint)}
                estimatePoints={estimatePoints}
              />
            )
        )}
      {estimatePoints && estimatePoints.length + (estimatePointCreate?.length || 0) <= maxEstimatesCount && (
        <Button
          variant="link-primary"
          size="sm"
          prependIcon={<Plus />}
          onClick={() =>
            handleEstimatePointCreate("add", {
              id: undefined,
              key: estimatePoints.length + (estimatePointCreate?.length || 0) + 1,
              value: "",
            })
          }
        >
          Add {estimate?.type}
        </Button>
      )}
    </div>
  );
});
