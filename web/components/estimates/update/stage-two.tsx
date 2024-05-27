import { FC } from "react";
import cloneDeep from "lodash/cloneDeep";
import { observer } from "mobx-react";
import { Plus } from "lucide-react";
import { IEstimate, TEstimatePointsObject, TEstimateUpdateStageKeys } from "@plane/types";
import { Button, Sortable } from "@plane/ui";
// components
import { EstimatePointItem } from "@/components/estimates";
// constants
import { EEstimateUpdateStages, maxEstimatesCount } from "@/constants/estimates";
import { useEstimate } from "@/hooks/store";

type TEstimateUpdateStageTwo = {
  workspaceSlug: string;
  projectId: string;
  estimate: IEstimate;
  estimateEditType: TEstimateUpdateStageKeys | undefined;
  estimatePoints: TEstimatePointsObject[];
  handleEstimatePoints: (value: TEstimatePointsObject[]) => void;
};

export const EstimateUpdateStageTwo: FC<TEstimateUpdateStageTwo> = observer((props) => {
  const { workspaceSlug, projectId, estimate, estimateEditType, estimatePoints, handleEstimatePoints } = props;
  // hooks
  const { updateEstimate: updateEstimateRequest } = useEstimate(estimate?.id);

  const currentEstimateSystem = estimate || undefined;

  const addNewEstimationPoint = () => {
    const currentEstimationPoints = cloneDeep(estimatePoints);
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
    let newEstimationPoints = cloneDeep(estimatePoints);
    newEstimationPoints.splice(index, 1);
    newEstimationPoints = newEstimationPoints.map((item, index) => ({
      ...item,
      key: index + 1,
    }));
    handleEstimatePoints(newEstimationPoints);
  };

  const replaceEstimateItem = (index: number, value: TEstimatePointsObject) => {
    const newEstimationPoints = cloneDeep(estimatePoints);
    newEstimationPoints[index].id = value.id;
    newEstimationPoints[index].key = value.key;
    newEstimationPoints[index].value = value.value;
    handleEstimatePoints(newEstimationPoints);
  };

  const updatedSortedKeys = (updatedEstimatePoints: TEstimatePointsObject[]) => {
    try {
      const sortedEstimatePoints = cloneDeep(updatedEstimatePoints).map((item, index) => ({
        ...item,
        key: index + 1,
      })) as TEstimatePointsObject[];
      handleEstimatePoints(sortedEstimatePoints);
      updateEstimateRequest(workspaceSlug, projectId, { estimate_points: sortedEstimatePoints });
    } catch (error) {
      console.log(error);
    }
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
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              estimateId={estimate?.id || undefined}
              mode={estimateEditType}
              item={value}
              editItem={(value: string) => editEstimationPoint(index, value)}
              replaceEstimateItem={(value: TEstimatePointsObject) => replaceEstimateItem(index, value)}
              deleteItem={() => deleteEstimationPoint(index)}
            />
          )}
          onChange={(data: TEstimatePointsObject[]) => updatedSortedKeys(data)}
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
});
