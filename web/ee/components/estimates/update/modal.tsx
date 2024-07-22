import { FC, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { TEstimateSystemKeys, TEstimateUpdateStageKeys } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// hooks
import { useEstimate } from "@/hooks/store";
// plane web components
import {
  EstimateUpdateStageOne,
  EstimatePointEditRoot,
  EstimatePointSwitchRoot,
} from "@/plane-web/components/estimates";
// plane web constants
import { EEstimateSystem, EEstimateUpdateStages } from "@/plane-web/constants/estimates";

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
        {!estimateEditType && (
          <EstimateUpdateStageOne
            estimateEditType={estimateEditType}
            handleEstimateEditType={handleEstimateEditType}
            handleClose={handleClose}
          />
        )}

        {estimateEditType && estimateId && (
          <>
            {estimateEditType === EEstimateUpdateStages.EDIT && (
              <EstimatePointEditRoot
                setEstimateEditType={setEstimateEditType}
                handleClose={handleClose}
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                estimateId={estimateId}
              />
            )}
            {estimateEditType === EEstimateUpdateStages.SWITCH && estimateSystemSwitchType && (
              <EstimatePointSwitchRoot
                setEstimateEditType={setEstimateEditType}
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
    </ModalCore>
  );
});
