import { FC, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Check, Info, X } from "lucide-react";
import { Spinner, Tooltip } from "@plane/ui";
// constants
import { EEstimateSystem } from "@/constants/estimates";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useEstimate, useEstimatePoint } from "@/hooks/store";

type TEstimatePointUpdate = {
  workspaceSlug: string;
  projectId: string;
  estimateId: string;
  estimatePointId: string;
  callback: () => void;
};

export const EstimatePointUpdate: FC<TEstimatePointUpdate> = observer((props) => {
  const { workspaceSlug, projectId, estimateId, estimatePointId, callback } = props;
  // hooks
  const { asJson: estimate, estimatePointIds } = useEstimate(estimateId);
  const { asJson: estimatePoint, updateEstimatePoint } = useEstimatePoint(estimateId, estimatePointId);
  // states
  const [loader, setLoader] = useState(false);
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
    if (!workspaceSlug || !projectId || !projectId || !estimatePointIds) return;
    if (estimateInputValue)
      try {
        setLoader(true);
        setError(undefined);

        const estimateType: EEstimateSystem | undefined = estimate?.type;
        let isEstimateValid = false;

        if (estimateType && [(EEstimateSystem.TIME, EEstimateSystem.POINTS)].includes(estimateType)) {
          if (estimateInputValue && Number(estimateInputValue) && Number(estimateInputValue) >= 0) {
            isEstimateValid = true;
          }
        } else if (estimateType && estimateType === EEstimateSystem.CATEGORIES) {
          if (estimateInputValue && estimateInputValue.length > 0) {
            isEstimateValid = true;
          }
        }

        if (isEstimateValid) {
          const payload = {
            value: estimateInputValue,
          };
          await updateEstimatePoint(workspaceSlug, projectId, payload);
          setLoader(false);
          setError(undefined);
          handleClose();
        } else {
          setLoader(false);
          setError("please enter a valid estimate value");
        }
      } catch {
        setLoader(false);
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
          placeholder="Enter estimate point"
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
      {loader ? (
        <div className="w-6 h-6 flex-shrink-0 relative flex justify-center items-center rota">
          <Spinner className="w-4 h-4" />
        </div>
      ) : (
        <div
          className="rounded-sm w-6 h-6 flex-shrink-0 relative flex justify-center items-center hover:bg-custom-background-80 transition-colors cursor-pointer text-green-500"
          onClick={handleCreate}
        >
          <Check size={14} />
        </div>
      )}
      <div
        className="rounded-sm w-6 h-6 flex-shrink-0 relative flex justify-center items-center hover:bg-custom-background-80 transition-colors cursor-pointer"
        onClick={handleClose}
      >
        <X size={14} className="text-custom-text-200" />
      </div>
    </div>
  );
});
