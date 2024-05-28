import { FC, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { ChevronLeft } from "lucide-react";
import { TEstimateUpdateStageKeys } from "@plane/types";
import { Button } from "@plane/ui";
// components
import { EModalPosition, EModalWidth, ModalCore } from "@/components/core";
import { EstimatePointEditRoot, EstimateUpdateStageOne } from "@/components/estimates";

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
  // states
  const [estimateEditType, setEstimateEditType] = useState<TEstimateUpdateStageKeys | undefined>(undefined);

  const handleEstimateEditType = (type: TEstimateUpdateStageKeys) => setEstimateEditType(type);

  useEffect(() => {
    if (!isOpen) setEstimateEditType(undefined);
  }, [isOpen]);

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
          <Button variant="primary" size="sm" onClick={handleClose}>
            Done
          </Button>
        </div>

        <div className="px-5 pb-1">
          {!estimateEditType && <EstimateUpdateStageOne handleEstimateEditType={handleEstimateEditType} />}
          {estimateEditType && estimateId && (
            <EstimatePointEditRoot workspaceSlug={workspaceSlug} projectId={projectId} estimateId={estimateId} />
          )}
        </div>
      </div>
    </ModalCore>
  );
});
