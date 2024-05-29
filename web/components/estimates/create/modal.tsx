import { FC, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { ChevronLeft } from "lucide-react";
import { IEstimateFormData, TEstimateSystemKeys, TEstimatePointsObject } from "@plane/types";
import { Button, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { EModalPosition, EModalWidth, ModalCore } from "@/components/core";
import { EstimateCreateStageOne, EstimatePointCreateRoot } from "@/components/estimates";
// constants
import { EEstimateSystem, ESTIMATE_SYSTEMS } from "@/constants/estimates";
// hooks
import { useProjectEstimates } from "@/hooks/store";

type TCreateEstimateModal = {
  workspaceSlug: string;
  projectId: string;
  isOpen: boolean;
  handleClose: () => void;
};

export const CreateEstimateModal: FC<TCreateEstimateModal> = observer((props) => {
  // props
  const { workspaceSlug, projectId, isOpen, handleClose } = props;
  // hooks
  const { createEstimate } = useProjectEstimates();
  // states
  const [estimateSystem, setEstimateSystem] = useState<TEstimateSystemKeys>(EEstimateSystem.CATEGORIES);
  const [estimatePoints, setEstimatePoints] = useState<TEstimatePointsObject[] | undefined>(undefined);

  const handleUpdatePoints = (newPoints: TEstimatePointsObject[] | undefined) => setEstimatePoints(newPoints);

  useEffect(() => {
    if (!isOpen) {
      setEstimateSystem(EEstimateSystem.CATEGORIES);
      setEstimatePoints(undefined);
    }
  }, [isOpen]);

  const handleCreateEstimate = async () => {
    try {
      if (!workspaceSlug || !projectId) return;

      const validatedEstimatePoints: TEstimatePointsObject[] = [];
      if ([EEstimateSystem.POINTS, EEstimateSystem.TIME].includes(estimateSystem)) {
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
            name: ESTIMATE_SYSTEMS[estimateSystem]?.name,
            type: estimateSystem,
            last_used: true,
          },
          estimate_points: validatedEstimatePoints,
        };
        await createEstimate(workspaceSlug, projectId, payload);
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

  // derived values
  const renderEstimateStepsCount = useMemo(() => (estimatePoints ? "2" : "1"), [estimatePoints]);

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      <div className="relative space-y-6 py-5">
        {/* heading */}
        <div className="relative flex justify-between items-center gap-2 px-5">
          <div className="relative flex items-center gap-1">
            {estimatePoints && (
              <div
                onClick={() => {
                  setEstimateSystem(EEstimateSystem.POINTS);
                  handleUpdatePoints(undefined);
                }}
                className="flex-shrink-0 cursor-pointer w-5 h-5 flex justify-center items-center"
              >
                <ChevronLeft className="w-4 h-4" />
              </div>
            )}
            <div className="text-xl font-medium text-custom-text-100">New Estimate System</div>
          </div>
          <div className="text-xs text-gray-400">Step {renderEstimateStepsCount}/2</div>
        </div>

        {/* estimate steps */}
        <div className="px-5">
          {!estimatePoints && (
            <EstimateCreateStageOne
              estimateSystem={estimateSystem}
              handleEstimateSystem={setEstimateSystem}
              handleEstimatePoints={(templateType: string) =>
                handleUpdatePoints(ESTIMATE_SYSTEMS[estimateSystem].templates[templateType].values)
              }
            />
          )}
          {estimatePoints && (
            <EstimatePointCreateRoot
              estimateType={estimateSystem}
              estimatePoints={estimatePoints}
              setEstimatePoints={setEstimatePoints}
            />
          )}
        </div>

        <div className="relative flex justify-end items-center gap-3 px-5 pt-5 border-t border-custom-border-200">
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
