import { FC, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { ChevronLeft } from "lucide-react";
import { IEstimateFormData, TEstimatePointsObject, TEstimateUpdateStageKeys, TEstimateSystemKeys } from "@plane/types";
import { Button, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { EModalPosition, EModalWidth, ModalCore } from "@/components/core";
import { EstimateUpdateStageOne, EstimateUpdateStageTwo } from "@/components/estimates";
// constants
import { EEstimateSystem } from "@/constants/estimates";
// hooks
import {
  useEstimate,
  // useProjectEstimates
} from "@/hooks/store";

type TUpdateEstimateModal = {
  workspaceSlug: string;
  projectId: string;
  estimateId: string | undefined;
  isOpen: boolean;
  handleClose: () => void;
};

export const UpdateEstimateModal: FC<TUpdateEstimateModal> = observer((props) => {
  // props
  const { workspaceSlug, projectId, estimateId, isOpen, handleClose } = props;
  // hooks
  const { asJson: currentEstimate, updateEstimate } = useEstimate(estimateId);
  // states
  const [estimateEditType, setEstimateEditType] = useState<TEstimateUpdateStageKeys | undefined>(undefined);
  const [estimatePoints, setEstimatePoints] = useState<TEstimatePointsObject[] | undefined>(undefined);

  const handleEstimateEditType = (type: TEstimateUpdateStageKeys) => {
    if (currentEstimate?.points && currentEstimate?.points.length > 0) {
      const estimateValidatePoints: TEstimatePointsObject[] = [];
      currentEstimate?.points.map(
        (point) =>
          point.key && point.value && estimateValidatePoints.push({ id: point.id, key: point.key, value: point.value })
      );
      if (estimateValidatePoints.length > 0) {
        setEstimateEditType(type);
        setEstimatePoints(estimateValidatePoints);
      }
    }
  };

  const handleUpdatePoints = (newPoints: TEstimatePointsObject[] | undefined) => setEstimatePoints(newPoints);

  useEffect(() => {
    if (!isOpen) {
      setEstimateEditType(undefined);
      setEstimatePoints(undefined);
    }
  }, [isOpen]);

  // derived values
  const renderEstimateStepsCount = useMemo(() => (estimatePoints ? "2" : "1"), [estimatePoints]);

  const handleCreateEstimate = async () => {
    try {
      if (!workspaceSlug || !projectId || !estimateId || currentEstimate?.type === undefined) return;
      const currentEstimationType: TEstimateSystemKeys = currentEstimate?.type;
      const validatedEstimatePoints: TEstimatePointsObject[] = [];
      if ([EEstimateSystem.POINTS, EEstimateSystem.TIME].includes(currentEstimationType)) {
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
            type: "points",
          },
          estimate_points: validatedEstimatePoints,
        };
        await updateEstimate(payload);
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

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      <div className="relative space-y-6 py-5">
        {/* heading */}
        <div className="relative flex justify-between items-center gap-2 px-5">
          <div className="relative flex items-center gap-1">
            {estimateEditType && (
              <div
                onClick={() => {
                  setEstimateEditType(undefined);
                  handleUpdatePoints(undefined);
                }}
                className="flex-shrink-0 cursor-pointer w-5 h-5 flex justify-center items-center"
              >
                <ChevronLeft className="w-4 h-4" />
              </div>
            )}
            <div className="text-xl font-medium text-custom-text-200">Edit estimate system</div>
          </div>
          <div className="text-xs text-gray-400">Step {renderEstimateStepsCount}/2</div>
        </div>

        {/* estimate steps */}
        <div className="px-5">
          {!estimateEditType && <EstimateUpdateStageOne handleEstimateEditType={handleEstimateEditType} />}
          {estimateEditType && estimatePoints && (
            <EstimateUpdateStageTwo
              estimate={currentEstimate}
              estimateEditType={estimateEditType}
              estimatePoints={estimatePoints}
              handleEstimatePoints={handleUpdatePoints}
            />
          )}
        </div>

        <div className="relative flex justify-end items-center gap-3 px-5 pt-5 border-t border-custom-border-100">
          <Button variant="neutral-primary" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          {estimatePoints && (
            <Button variant="primary" size="sm" onClick={handleCreateEstimate}>
              Create Estimate
            </Button>
          )}
        </div>
      </div>
    </ModalCore>
  );
});
