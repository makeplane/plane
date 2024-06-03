import { Dispatch, FC, SetStateAction, useCallback, useState } from "react";
import { observer } from "mobx-react";
import { Plus } from "lucide-react";
import { TEstimatePointsObject, TEstimateSystemKeys } from "@plane/types";
import { Button, Draggable, Sortable } from "@plane/ui";
// components
import { EstimatePointItemPreview, EstimatePointCreate } from "@/components/estimates/points";
// constants
import { maxEstimatesCount } from "@/constants/estimates";
// hooks
import { useEstimate } from "@/hooks/store";

type TEstimatePointCreateRoot = {
  workspaceSlug: string;
  projectId: string;
  estimateId: string | undefined;
  estimateType: TEstimateSystemKeys;
  estimatePoints: TEstimatePointsObject[];
  setEstimatePoints: Dispatch<SetStateAction<TEstimatePointsObject[] | undefined>>;
};

export const EstimatePointCreateRoot: FC<TEstimatePointCreateRoot> = observer((props) => {
  // props
  const { workspaceSlug, projectId, estimateId, estimateType, estimatePoints, setEstimatePoints } = props;
  // hooks
  const { asJson: estimate, updateEstimateSortOrder } = useEstimate(estimateId);
  // states
  const [estimatePointCreate, setEstimatePointCreate] = useState<TEstimatePointsObject[] | undefined>(undefined);

  const handleEstimatePoint = useCallback(
    (mode: "add" | "remove" | "update", value: TEstimatePointsObject) => {
      switch (mode) {
        case "add":
          setEstimatePoints((prevValue) => {
            prevValue = prevValue ? [...prevValue] : [];
            return [...prevValue, value];
          });
          break;
        case "update":
          setEstimatePoints((prevValue) => {
            prevValue = prevValue ? [...prevValue] : [];
            return prevValue.map((item) => (item.key === value.key ? { ...item, value: value.value } : item));
          });
          break;
        case "remove":
          setEstimatePoints((prevValue) => {
            prevValue = prevValue ? [...prevValue] : [];
            return prevValue.filter((item) => item.key !== value.key);
          });
          break;
        default:
          break;
      }
    },
    [setEstimatePoints]
  );

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

  if (!workspaceSlug || !projectId) return <></>;
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-custom-text-200 capitalize">{estimate?.type}</div>
      <Sortable
        data={estimatePoints}
        render={(value: TEstimatePointsObject) => (
          <EstimatePointItemPreview
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            estimateId={estimateId}
            estimateType={estimateType}
            estimatePointId={value?.id}
            estimatePoints={estimatePoints}
            estimatePoint={value}
            handleEstimatePointValueUpdate={(estimatePointValue: string) =>
              handleEstimatePoint("update", { ...value, value: estimatePointValue })
            }
            handleEstimatePointValueRemove={() => handleEstimatePoint("remove", value)}
          />
        )}
        onChange={(data: TEstimatePointsObject[]) => handleDragEstimatePoints(data)}
        keyExtractor={(item: TEstimatePointsObject) => item?.id?.toString() || item.value.toString()}
      />

      {estimatePointCreate &&
        estimatePointCreate.map((estimatePoint) => (
          <EstimatePointCreate
            key={estimatePoint?.key}
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            estimateId={estimateId}
            estimateType={estimateType}
            estimatePoints={estimatePoints}
            handleEstimatePointValue={(estimatePointValue: string) =>
              handleEstimatePoint("add", { ...estimatePoint, value: estimatePointValue })
            }
            closeCallBack={() => handleEstimatePointCreate("remove", estimatePoint)}
          />
        ))}
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
