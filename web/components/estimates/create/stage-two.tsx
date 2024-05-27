import { FC } from "react";
import { observer } from "mobx-react";
import { Plus } from "lucide-react";
import { TEstimatePointsObject } from "@plane/types";
import { Button, Sortable } from "@plane/ui";
// components
import { EstimatePointItem } from "@/components/estimates";
// constants
import { EEstimateSystem, EEstimateUpdateStages, ESTIMATE_SYSTEMS, maxEstimatesCount } from "@/constants/estimates";

type TEstimateCreateStageTwo = {
  workspaceSlug: string;
  projectId: string;
  estimateSystem: EEstimateSystem;
  estimatePoints: TEstimatePointsObject[];
  handleEstimatePoints: (value: TEstimatePointsObject[]) => void;
};

export const EstimateCreateStageTwo: FC<TEstimateCreateStageTwo> = observer((props) => {
  const { workspaceSlug, projectId, estimateSystem, estimatePoints, handleEstimatePoints } = props;

  const currentEstimateSystem = ESTIMATE_SYSTEMS[estimateSystem] || undefined;

  const addNewEstimationPoint = () => {
    const currentEstimationPoints = estimatePoints;
    const newEstimationPoint: TEstimatePointsObject = {
      key: currentEstimationPoints.length + 1,
      value: "",
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

  return (
    <div className="space-y-1">
      <div className="text-sm font-medium text-custom-text-300">{estimateSystem}</div>
      <div className="space-y-3">
        <Sortable
          data={estimatePoints}
          render={(value: TEstimatePointsObject, index: number) => (
            <EstimatePointItem
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              estimateId={undefined}
              mode={EEstimateUpdateStages.CREATE}
              item={value}
              estimatePoints={estimatePoints}
              editItem={(value: string) => editEstimationPoint(index, value)}
              deleteItem={() => deleteEstimationPoint(index)}
              handleEstimatePoints={handleEstimatePoints}
            />
          )}
          onChange={(data: TEstimatePointsObject[]) => handleEstimatePoints(updatedSortedKeys(data))}
          keyExtractor={(item: TEstimatePointsObject) => item?.id?.toString() || item.value.toString()}
        />
        {estimatePoints && estimatePoints.length <= maxEstimatesCount && (
          <Button size="sm" prependIcon={<Plus />} onClick={addNewEstimationPoint}>
            Add {currentEstimateSystem?.name}
          </Button>
        )}
      </div>
    </div>
  );
});
