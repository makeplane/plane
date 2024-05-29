import { FC, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { ChevronLeft } from "lucide-react";
import { TEstimateSystemKeys, TEstimateUpdateStageKeys } from "@plane/types";
import { Button } from "@plane/ui";
// components
import { EModalPosition, EModalWidth, ModalCore } from "@/components/core";
import { EstimateUpdateStageOne, EstimatePointEditRoot, EstimatePointSwitchRoot } from "@/components/estimates";
// constants
import { EEstimateSystem, EEstimateUpdateStages } from "@/constants/estimates";
// hooks
import { useEstimate } from "@/hooks/store";

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
  const { asJson: estimate } = useEstimate(estimateId);
  // states
  const [estimateEditType, setEstimateEditType] = useState<TEstimateUpdateStageKeys | undefined>(undefined);
  const [estimateSystemSwitchType, setEstimateSystemSwitchType] = useState<TEstimateSystemKeys | undefined>(undefined);

  useEffect(() => {
    if (isOpen) {
      setEstimateEditType(undefined);
      setEstimateSystemSwitchType(undefined);
    }
  }, [isOpen]);

  const handleEstimateEditType = (type: TEstimateUpdateStageKeys) => {
    if (type === EEstimateUpdateStages.SWITCH && estimate?.type)
      setEstimateSystemSwitchType(
        estimate?.type === EEstimateSystem.CATEGORIES ? EEstimateSystem.POINTS : EEstimateSystem.CATEGORIES
      );
    setEstimateEditType(type);
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      <div className="relative space-y-6 py-5">
        {/* heading */}
        <div className="relative flex justify-between items-center gap-2 px-5">
          <div className="relative flex items-center gap-1">
            {estimateEditType && (
              <div
                onClick={() => setEstimateEditType(undefined)}
                className="flex-shrink-0 cursor-pointer w-5 h-5 flex justify-center items-center"
              >
                <ChevronLeft className="w-4 h-4" />
              </div>
            )}
            <div className="text-xl font-medium text-custom-text-200">Edit estimate system</div>
          </div>

          {estimateEditType === EEstimateUpdateStages.EDIT && (
            <Button variant="primary" size="sm" onClick={handleClose}>
              Done
            </Button>
          )}
        </div>

        <div className="px-5">
          {!estimateEditType && <EstimateUpdateStageOne handleEstimateEditType={handleEstimateEditType} />}
          {estimateEditType && estimateId && (
            <>
              {estimateEditType === EEstimateUpdateStages.EDIT && (
                <EstimatePointEditRoot workspaceSlug={workspaceSlug} projectId={projectId} estimateId={estimateId} />
              )}
              {estimateEditType === EEstimateUpdateStages.SWITCH && estimateSystemSwitchType && (
                <EstimatePointSwitchRoot
                  estimateSystemSwitchType={estimateSystemSwitchType}
                  workspaceSlug={workspaceSlug}
                  projectId={projectId}
                  estimateId={estimateId}
                  handleClose={handleClose}
                />
              )}
            </>
          )}
        </div>

        {estimateEditType === undefined && (
          <div className="relative flex justify-end items-center gap-3 px-5 pt-5 border-t border-custom-border-200">
            <Button variant="neutral-primary" size="sm" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    </ModalCore>
  );
});
