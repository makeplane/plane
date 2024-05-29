import { Dispatch, FC, SetStateAction, useCallback } from "react";
import { observer } from "mobx-react";
import { Plus } from "lucide-react";
import { TEstimatePointsObject, TEstimateSystemKeys } from "@plane/types";
import { Button, Draggable, Sortable } from "@plane/ui";
// components
import { EstimatePointItemCreatePreview } from "@/components/estimates/points";
// constants
import { maxEstimatesCount } from "@/constants/estimates";

type TEstimatePointCreateRoot = {
  estimateType: TEstimateSystemKeys;
  estimatePoints: TEstimatePointsObject[];
  setEstimatePoints: Dispatch<SetStateAction<TEstimatePointsObject[] | undefined>>;
};

export const EstimatePointCreateRoot: FC<TEstimatePointCreateRoot> = observer((props) => {
  // props
  const { estimateType, estimatePoints, setEstimatePoints } = props;

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

  const handleDragEstimatePoints = (updatedEstimatedOrder: TEstimatePointsObject[]) => {
    const updatedEstimateKeysOrder = updatedEstimatedOrder.map((item, index) => ({ ...item, key: index + 1 }));
    setEstimatePoints(updatedEstimateKeysOrder);
  };

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-custom-text-200">{estimateType}</div>
      <Sortable
        data={estimatePoints}
        render={(value: TEstimatePointsObject) => (
          <Draggable data={value}>
            <EstimatePointItemCreatePreview
              estimateType={estimateType}
              estimatePoint={value}
              handleEstimatePoint={handleEstimatePoint}
            />
          </Draggable>
        )}
        onChange={(data: TEstimatePointsObject[]) => handleDragEstimatePoints(data)}
        keyExtractor={(item: TEstimatePointsObject) => item?.id?.toString() || item.value.toString()}
      />

      {estimatePoints && estimatePoints.length <= maxEstimatesCount && (
        <Button
          variant="link-primary"
          size="sm"
          prependIcon={<Plus />}
          onClick={() =>
            handleEstimatePoint("add", {
              id: undefined,
              key: estimatePoints.length + 1,
              value: "",
            })
          }
        >
          Add {estimateType}
        </Button>
      )}
    </div>
  );
});
