import { FC } from "react";
import { Plus } from "lucide-react";
import { IEstimate, TEstimatePointsObject, TEstimateUpdateStageKeys } from "@plane/types";
import { Button, Sortable } from "@plane/ui";
// components
import { EstimatePointItem } from "@/components/estimates";

type TEstimateUpdateStageTwo = {
  estimate: IEstimate;
  estimateEditType: TEstimateUpdateStageKeys | undefined;
  estimatePoints: TEstimatePointsObject[];
  handleEstimatePoints: (value: TEstimatePointsObject[]) => void;
};

export const EstimateUpdateStageTwo: FC<TEstimateUpdateStageTwo> = (props) => {
  const { estimate, estimateEditType, estimatePoints, handleEstimatePoints } = props;

  const currentEstimateSystem = estimate || undefined;

  const addNewEstimationPoint = () => {
    const currentEstimationPoints = estimatePoints;

    const newEstimationPoint: TEstimatePointsObject = {
      key: currentEstimationPoints.length + 1,
      value: "0",
    };
    handleEstimatePoints([...currentEstimationPoints, newEstimationPoint]);
  };

  const deleteEstimationPoint = (index: number) => {
    const newEstimationPoints = estimatePoints;
    newEstimationPoints.splice(index, 1);
    handleEstimatePoints(newEstimationPoints);
  };

  const updatedSortedKeys = (updatedEstimatePoints: TEstimatePointsObject[]) =>
    updatedEstimatePoints.map((item, index) => ({
      ...item,
      key: index + 1,
    })) as TEstimatePointsObject[];

  return (
    <div className="space-y-4">
      <Sortable
        data={estimatePoints}
        render={(value: TEstimatePointsObject, index: number) => (
          <EstimatePointItem item={value} deleteItem={() => deleteEstimationPoint(index)} />
        )}
        onChange={(data: TEstimatePointsObject[]) => handleEstimatePoints(updatedSortedKeys(data))}
        keyExtractor={(item: TEstimatePointsObject) => item?.id?.toString() || item.value.toString()}
      />

      <Button prependIcon={<Plus />} onClick={addNewEstimationPoint}>
        Add {currentEstimateSystem?.name}
      </Button>
    </div>
  );
};
