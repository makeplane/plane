import { FC } from "react";
import { Plus } from "lucide-react";
import { Button, Sortable } from "@plane/ui";
// components
import { EstimateItem } from "@/components/estimates";
import { EEstimateSystem, TEstimatePointsObject } from "@/components/estimates/types";
// constants
import { ESTIMATE_SYSTEMS } from "@/constants/estimates";

type TEstimateCreateStageTwo = {
  estimateSystem: EEstimateSystem;
  estimatePoints: TEstimatePointsObject[];
  handleEstimatePoints: (value: TEstimatePointsObject[]) => void;
};

export const EstimateCreateStageTwo: FC<TEstimateCreateStageTwo> = (props) => {
  const { estimateSystem, estimatePoints, handleEstimatePoints } = props;

  const currentEstimateSystem = ESTIMATE_SYSTEMS[estimateSystem] || undefined;

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
          <EstimateItem item={value} deleteItem={() => deleteEstimationPoint(index)} />
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
