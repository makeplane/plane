import { FC } from "react";
import { observer } from "mobx-react";
import { Info, MoveRight } from "lucide-react";
import { TEstimatePointsObject } from "@plane/types";
import { Tooltip } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useEstimatePoint } from "@/hooks/store";

type TEstimatePointItemSwitchPreview = {
  estimateId: string;
  estimatePointId: string | undefined;
  estimatePoint: TEstimatePointsObject;
  handleEstimatePoint: (value: string) => void;
  errorType?: string;
  isError?: boolean;
};

export const EstimatePointItemSwitchPreview: FC<TEstimatePointItemSwitchPreview> = observer((props) => {
  const {
    estimateId,
    estimatePointId,
    estimatePoint: currentEstimatePoint,
    handleEstimatePoint,
    errorType = "",
    isError = false,
  } = props;
  // hooks
  const { asJson: estimatePoint } = useEstimatePoint(estimateId, estimatePointId);

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
          isError ? `border-red-500` : `border-custom-border-200`
        )}
      >
        <input
          type="text"
          value={currentEstimatePoint?.value}
          onChange={(e) => handleEstimatePoint(e.target.value)}
          className="border-none focus:ring-0 focus:border-0 focus:outline-none p-2.5 w-full bg-transparent"
          autoFocus
          placeholder="Enter estimate point value"
        />
        {isError && (
          <>
            <Tooltip
              tooltipContent={
                errorType === "empty-fields" ? "please fill this estimate point." : `Repeating estimate point`
              }
              position="bottom"
            >
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
