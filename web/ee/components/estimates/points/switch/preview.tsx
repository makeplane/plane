import { FC } from "react";
import { observer } from "mobx-react";
import { Info, MoveRight } from "lucide-react";
import { TEstimatePointsObject, TEstimateSystemKeys, TEstimateTypeErrorObject } from "@plane/types";
import { Tooltip } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useEstimatePoint } from "@/hooks/store";
// plane web constants
import { MAX_ESTIMATE_POINT_INPUT_LENGTH, EEstimateSystem } from "@/plane-web/constants/estimates";

type TEstimatePointItemSwitchPreview = {
  estimateId: string;
  estimateSystemSwitchType: TEstimateSystemKeys;
  estimatePointId: string | undefined;
  estimatePoint: TEstimatePointsObject;
  handleEstimatePoint: (value: string) => void;
  estimatePointError?: TEstimateTypeErrorObject | undefined;
};

export const EstimatePointItemSwitchPreview: FC<TEstimatePointItemSwitchPreview> = observer((props) => {
  const {
    estimateId,
    estimateSystemSwitchType,
    estimatePointId,
    estimatePoint: currentEstimatePoint,
    handleEstimatePoint,
    estimatePointError,
  } = props;
  // hooks
  const { asJson: estimatePoint } = useEstimatePoint(estimateId, estimatePointId);

  const handleEstimatePointUpdate = (value: string) => {
    if (value.length <= MAX_ESTIMATE_POINT_INPUT_LENGTH) {
      handleEstimatePoint(value);
    }
  };

  // derived values
  const inputFieldType =
    estimateSystemSwitchType && [(EEstimateSystem.TIME, EEstimateSystem.POINTS)].includes(estimateSystemSwitchType)
      ? "number"
      : "text";
  const inputProps = {
    type: inputFieldType,
    pattern: inputFieldType === "number" ? "[0-9]*" : undefined,
    maxlength: MAX_ESTIMATE_POINT_INPUT_LENGTH,
  };

  if (!estimatePoint) return <></>;
  return (
    <div className="relative flex items-center gap-2">
      <div className="w-full border border-custom-border-200 rounded p-2.5 bg-custom-background-90">
        {estimatePoint?.value}
      </div>
      <div className="flex-shrink-0 w-4 h-4 relative flex justify-center items-center">
        <MoveRight size={12} />
      </div>
      <div
        className={cn(
          "relative w-full border rounded flex items-center",
          estimatePointError?.message ? `border-red-500` : `border-custom-border-200`
        )}
      >
        <input
          value={currentEstimatePoint?.value}
          onChange={(e) => handleEstimatePointUpdate(e.target.value)}
          className="border-none focus:ring-0 focus:border-0 focus:outline-none p-2.5 w-full bg-transparent"
          autoFocus
          placeholder="Enter estimate point value"
          {...inputProps}
        />
        {estimatePointError?.message && (
          <>
            <Tooltip tooltipContent={estimatePointError?.message} position="bottom">
              <div className="flex-shrink-0 w-3.5 h-3.5 overflow-hidden mr-3 relative flex justify-center items-center text-red-500">
                <Info size={14} />
              </div>
            </Tooltip>
          </>
        )}
      </div>
    </div>
  );
});
