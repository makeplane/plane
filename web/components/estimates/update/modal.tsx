import { FC, useEffect, useMemo, useState } from "react";
import orderBy from "lodash/orderBy";
import { observer } from "mobx-react";
import { ChevronLeft } from "lucide-react";
import { TEstimatePointsObject, TEstimateUpdateStageKeys } from "@plane/types";
import { Button } from "@plane/ui";
// components
import { EModalPosition, EModalWidth, ModalCore } from "@/components/core";
import { EstimateUpdateStageOne, EstimateUpdateStageTwo } from "@/components/estimates";
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
  const { asJson: currentEstimate } = useEstimate(estimateId);
  // states
  const [estimateEditType, setEstimateEditType] = useState<TEstimateUpdateStageKeys | undefined>(undefined);
  const [estimatePoints, setEstimatePoints] = useState<TEstimatePointsObject[] | undefined>(undefined);

  const handleEstimateEditType = (type: TEstimateUpdateStageKeys) => {
    if (currentEstimate?.points && currentEstimate?.points.length > 0) {
      let estimateValidatePoints: TEstimatePointsObject[] = [];
      currentEstimate?.points.map(
        (point) =>
          point.key && point.value && estimateValidatePoints.push({ id: point.id, key: point.key, value: point.value })
      );
      estimateValidatePoints = orderBy(estimateValidatePoints, ["key"], ["asc"]);
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
              workspaceSlug={workspaceSlug}
              projectId={projectId}
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
        </div>
      </div>
    </ModalCore>
  );
});
