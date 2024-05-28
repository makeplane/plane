import { FC, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { TEstimatePointsObject } from "@plane/types";
// components
import { EstimatePointItemSwitchPreview } from "@/components/estimates/points";
// constants
import { EEstimateSystem, EEstimateUpdateStages } from "@/constants/estimates";
// hooks
import { useEstimate } from "@/hooks/store";

type TEstimatePointSwitchRoot = {
  workspaceSlug: string;
  projectId: string;
  estimateId: string;
  mode?: EEstimateUpdateStages;
};

export const EstimatePointSwitchRoot: FC<TEstimatePointSwitchRoot> = observer((props) => {
  // props
  const { workspaceSlug, projectId, estimateId } = props;
  // hooks
  const { asJson: estimate, estimatePointIds, estimatePointById } = useEstimate(estimateId);
  // states
  const [estimatePoints, setEstimatePoints] = useState<TEstimatePointsObject[] | undefined>(undefined);

  useEffect(() => {
    if (!estimatePointIds) return;
    setEstimatePoints(
      estimatePointIds.map((estimatePointId: string) => {
        const estimatePoint = estimatePointById(estimatePointId);
        if (estimatePoint) return { id: estimatePointId, key: estimatePoint.key, value: "" };
      }) as TEstimatePointsObject[]
    );
  }, [estimatePointById, estimatePointIds]);

  const handleEstimatePoints = (index: number, value: string) => {
    setEstimatePoints((prevValue) => {
      prevValue = prevValue ? [...prevValue] : [];
      prevValue[index].value = value;
      return prevValue;
    });
  };

  if (!workspaceSlug || !projectId || !estimateId || !estimatePoints) return <></>;
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium flex items-center gap-2">
        <div className="w-full">Current {estimate?.type}</div>
        <div className="flex-shrink-0 w-4 h-4" />
        <div className="w-full">
          New {estimate?.type === EEstimateSystem?.POINTS ? EEstimateSystem?.CATEGORIES : EEstimateSystem?.POINTS}
        </div>
      </div>

      {estimatePoints.map((estimateObject, index) => (
        <EstimatePointItemSwitchPreview
          key={estimateObject?.id}
          estimateId={estimateId}
          estimatePointId={estimateObject.id}
          estimatePoint={estimateObject}
          handleEstimatePoint={(value: string) => handleEstimatePoints(index, value)}
        />
      ))}
    </div>
  );
});
