import { FC, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Check, Info, X } from "lucide-react";
import { TEstimatePointsObject, TEstimateSystemKeys } from "@plane/types";
import { Tooltip } from "@plane/ui";
// constants
import { EEstimateSystem } from "@/constants/estimates";
// helpers
import { cn } from "@/helpers/common.helper";

type TEstimatePointItemCreateUpdate = {
  estimateType: TEstimateSystemKeys;
  estimatePoint: TEstimatePointsObject;
  updateEstimateValue: (value: string) => void;
  callback: () => void;
};

export const EstimatePointItemCreateUpdate: FC<TEstimatePointItemCreateUpdate> = observer((props) => {
  const { estimateType, estimatePoint, updateEstimateValue, callback } = props;
  // states
  const [estimateInputValue, setEstimateInputValue] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (estimateInputValue === undefined && estimatePoint) setEstimateInputValue(estimatePoint?.value || "");
  }, [estimateInputValue, estimatePoint]);

  const handleClose = () => {
    setEstimateInputValue("");
    callback();
  };

  const handleCreate = async () => {
    if (!estimatePoint) return;
    if (estimateInputValue)
      try {
        setError(undefined);

        const currentEstimateType: EEstimateSystem | undefined = estimateType;
        let isEstimateValid = false;

        if (currentEstimateType && [(EEstimateSystem.TIME, EEstimateSystem.POINTS)].includes(currentEstimateType)) {
          if (estimateInputValue && Number(estimateInputValue) && Number(estimateInputValue) >= 0) {
            isEstimateValid = true;
          }
        } else if (currentEstimateType && currentEstimateType === EEstimateSystem.CATEGORIES) {
          if (estimateInputValue && estimateInputValue.length > 0) {
            isEstimateValid = true;
          }
        }

        if (isEstimateValid) {
          updateEstimateValue(estimateInputValue);
          setError(undefined);
          handleClose();
        } else {
          setError("please enter a valid estimate value");
        }
      } catch {
        setError("something went wrong. please try again later");
      }
    else {
      setError("Please fill the input field");
    }
  };

  return (
    <div className="relative flex items-center gap-2 text-base">
      <div
        className={cn(
          "relative w-full border rounded flex items-center",
          error ? `border-red-500` : `border-custom-border-200`
        )}
      >
        <input
          type="text"
          value={estimateInputValue}
          onChange={(e) => setEstimateInputValue(e.target.value)}
          className="border-none focus:ring-0 focus:border-0 focus:outline-none p-2.5 w-full bg-transparent"
          placeholder="Enter estimate value"
          autoFocus
        />
        {error && (
          <>
            <Tooltip tooltipContent={error} position="bottom">
              <div className="flex-shrink-0 w-3.5 h-3.5 overflow-hidden mr-3 relative flex justify-center items-center text-red-500">
                <Info size={14} />
              </div>
            </Tooltip>
          </>
        )}
      </div>
      <div
        className="rounded-sm w-6 h-6 flex-shrink-0 relative flex justify-center items-center hover:bg-custom-background-80 transition-colors cursor-pointer text-green-500"
        onClick={handleCreate}
      >
        <Check size={14} />
      </div>
      <div
        className="rounded-sm w-6 h-6 flex-shrink-0 relative flex justify-center items-center hover:bg-custom-background-80 transition-colors cursor-pointer"
        onClick={handleClose}
      >
        <X size={14} className="text-custom-text-200" />
      </div>
    </div>
  );
});
