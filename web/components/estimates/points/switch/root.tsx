import { FC, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { IEstimateFormData, TEstimatePointsObject, TEstimateSystemKeys } from "@plane/types";
import { Button, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { EstimatePointItemSwitchPreview } from "@/components/estimates/points";
// constants
import { EEstimateSystem, EEstimateUpdateStages, ESTIMATE_SYSTEMS } from "@/constants/estimates";
// hooks
import { useEstimate } from "@/hooks/store";

type TEstimatePointSwitchRoot = {
  estimateSystemSwitchType: TEstimateSystemKeys;
  workspaceSlug: string;
  projectId: string;
  estimateId: string;
  handleClose: () => void;
  mode?: EEstimateUpdateStages;
};

export const EstimatePointSwitchRoot: FC<TEstimatePointSwitchRoot> = observer((props) => {
  // props
  const { estimateSystemSwitchType, workspaceSlug, projectId, estimateId, handleClose } = props;
  // hooks
  const { asJson: estimate, estimatePointIds, estimatePointById, updateEstimateSwitch } = useEstimate(estimateId);
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

  const handleSwitchEstimate = async () => {
    try {
      if (!workspaceSlug || !projectId) return;
      const validatedEstimatePoints: TEstimatePointsObject[] = [];
      if ([EEstimateSystem.POINTS, EEstimateSystem.TIME].includes(estimateSystemSwitchType)) {
        estimatePoints?.map((estimatePoint) => {
          if (
            estimatePoint.value &&
            ((estimatePoint.value != "0" && Number(estimatePoint.value)) || estimatePoint.value === "0")
          )
            validatedEstimatePoints.push(estimatePoint);
        });
      } else {
        estimatePoints?.map((estimatePoint) => {
          if (estimatePoint.value) validatedEstimatePoints.push(estimatePoint);
        });
      }
      if (validatedEstimatePoints.length === estimatePoints?.length) {
        const payload: IEstimateFormData = {
          estimate: {
            name: ESTIMATE_SYSTEMS[estimateSystemSwitchType]?.name,
            type: estimateSystemSwitchType,
          },
          estimate_points: validatedEstimatePoints,
        };
        await updateEstimateSwitch(workspaceSlug, projectId, payload);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Estimate system created",
          message: "Created and Enabled successfully",
        });
        handleClose();
      } else {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "something went wrong",
        });
      }
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "something went wrong",
      });
    }
  };

  if (!workspaceSlug || !projectId || !estimateId || !estimatePoints) return <></>;
  return (
    <>
      <div className="space-y-3">
        <div className="text-sm font-medium flex items-center gap-2">
          <div className="w-full">Current {estimate?.type}</div>
          <div className="flex-shrink-0 w-4 h-4" />
          <div className="w-full">New {estimateSystemSwitchType}</div>
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

      <div className="relative flex justify-end items-center gap-3 px-5 pt-5 border-t border-custom-border-100">
        <Button variant="neutral-primary" size="sm" onClick={handleClose}>
          Cancel
        </Button>

        <Button variant="primary" size="sm" onClick={handleSwitchEstimate}>
          Update
        </Button>
      </div>
    </>
  );
});
