import { FC, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { IEstimate } from "@plane/types";
import { Button } from "@plane/ui";
// components
import { EModalPosition, EModalWidth, ModalCore } from "@/components/core";
// types
import { TEstimatePointsObject } from "@/components/estimates/types";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  data?: IEstimate;
};

export const UpdateEstimateModal: FC<Props> = observer((props) => {
  // props
  const { handleClose, isOpen } = props;
  // states
  const [estimatePoints, setEstimatePoints] = useState<TEstimatePointsObject[] | undefined>(undefined);

  useEffect(() => {
    if (!isOpen) {
      setEstimatePoints(undefined);
    }
  }, [isOpen]);

  // derived values

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      <div className="relative space-y-6 py-5">
        {/* heading */}
        <div className="relative flex justify-between items-center gap-2 px-5">Heading</div>

        {/* estimate steps */}
        <div className="px-5">Content</div>

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
