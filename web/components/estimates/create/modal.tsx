import { FC, useEffect, useMemo, useState } from "react";
import cloneDeep from "lodash/cloneDeep";
import { observer } from "mobx-react";
import { ChevronLeft } from "lucide-react";
import { IEstimate } from "@plane/types";
import { Button } from "@plane/ui";
// components
import { EModalPosition, EModalWidth, ModalCore } from "@/components/core";
import { EstimateCreateStageOne, EstimateCreateStageTwo } from "@/components/estimates";
import { TEstimateSystemKeys, EEstimateSystem, TEstimateSystemKeyObject } from "@/components/estimates/types";
// constants
import { ESTIMATE_SYSTEMS } from "@/constants/estimates";
// ee components

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  data?: IEstimate;
};

export const CreateEstimateModal: FC<Props> = observer((props) => {
  // props
  const { handleClose, isOpen } = props;
  // states
  const [estimateSystem, setEstimateSystem] = useState<TEstimateSystemKeys>(EEstimateSystem.POINTS);
  const [estimatePoints, setEstimatePoints] = useState<TEstimateSystemKeyObject[TEstimateSystemKeys] | undefined>(
    undefined
  );

  const handleUpdatePoints = (newPoints: TEstimateSystemKeyObject[TEstimateSystemKeys] | undefined) => {
    const points = cloneDeep(newPoints);
    setEstimatePoints(points);
  };

  useEffect(() => {
    if (!isOpen) {
      setEstimateSystem(EEstimateSystem.POINTS);
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
            <div className="text-xl font-medium text-custom-text-200 ">New Estimate System</div>
          </div>
          <div className="text-xs text-gray-400">Step {renderEstimateStepsCount}/2</div>
        </div>

        {/* estimate steps */}
        <div className="px-5">
          {!estimatePoints && (
            <EstimateCreateStageOne
              estimateSystem={estimateSystem}
              handleEstimateSystem={setEstimateSystem}
              handleEstimatePoints={(templateType) =>
                handleUpdatePoints(ESTIMATE_SYSTEMS[estimateSystem].templates[templateType].values)
              }
            />
          )}
          {estimatePoints && (
            <EstimateCreateStageTwo
              estimateSystem={estimateSystem}
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
            <Button variant="primary" size="sm" onClick={handleClose}>
              Create Estimate
            </Button>
          )}
        </div>
      </div>
    </ModalCore>
  );
});
