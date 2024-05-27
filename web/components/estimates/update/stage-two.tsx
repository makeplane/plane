import { FC } from "react";
import { Plus } from "lucide-react";
import { IEstimate, TEstimatePointsObject, TEstimateUpdateStageKeys } from "@plane/types";
import { Button, Sortable } from "@plane/ui";
// components
import { EstimatePointItem } from "@/components/estimates";
// constants
import { EEstimateUpdateStages, maxEstimatesCount } from "@/constants/estimates";

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

  const editEstimationPoint = (index: number, value: string) => {
    const newEstimationPoints = estimatePoints;
    newEstimationPoints[index].value = value;
    handleEstimatePoints(newEstimationPoints);
  };

  const deleteEstimationPoint = (index: number) => {
    let newEstimationPoints = estimatePoints;
    newEstimationPoints.splice(index, 1);
    newEstimationPoints = newEstimationPoints.map((item, index) => ({
      ...item,
      key: index + 1,
    }));
    handleEstimatePoints(newEstimationPoints);
  };

  const updatedSortedKeys = (updatedEstimatePoints: TEstimatePointsObject[]) => {
    const sortedEstimatePoints = updatedEstimatePoints.map((item, index) => ({
      ...item,
      key: index + 1,
    })) as TEstimatePointsObject[];
    return sortedEstimatePoints;
  };

  if (!estimateEditType) return <></>;
  return (
    <div className="space-y-1">
      <div className="text-sm font-medium text-custom-text-300">
        {estimateEditType === EEstimateUpdateStages.SWITCH ? "Estimate type switching" : currentEstimateSystem?.type}
      </div>
      <div className="space-y-3">
        <Sortable
          data={estimatePoints}
          render={(value: TEstimatePointsObject, index: number) => (
            <EstimatePointItem
              estimateId={estimate?.id || undefined}
              mode={estimateEditType}
              item={value}
              editItem={(value: string) => editEstimationPoint(index, value)}
              deleteItem={() => deleteEstimationPoint(index)}
            />
          )}
          onChange={(data: TEstimatePointsObject[]) => handleEstimatePoints(updatedSortedKeys(data))}
          keyExtractor={(item: TEstimatePointsObject) => item?.id?.toString() || item.value.toString()}
        />
        {estimateEditType === EEstimateUpdateStages.EDIT && (
          <>
            {estimatePoints && estimatePoints.length <= maxEstimatesCount && (
              <Button size="sm" prependIcon={<Plus />} onClick={addNewEstimationPoint}>
                Add {currentEstimateSystem?.type}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
