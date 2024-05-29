import { FC, useState } from "react";
import { observer } from "mobx-react";
import { Check, Info, X } from "lucide-react";
import { Spinner, TOAST_TYPE, Tooltip, setToast } from "@plane/ui";
// constants
import { EEstimateSystem } from "@/constants/estimates";
// helpers
import { cn } from "@/helpers/common.helper";
import { isEstimatePointValuesRepeated } from "@/helpers/estimates";
// hooks
import { useEstimate } from "@/hooks/store";

type TEstimatePointCreate = {
  workspaceSlug: string;
  projectId: string;
  estimateId: string;
  callback: () => void;
};

export const EstimatePointCreate: FC<TEstimatePointCreate> = observer((props) => {
  const { workspaceSlug, projectId, estimateId, callback } = props;
  // hooks
  const { asJson: estimate, estimatePointIds, estimatePointById, creteEstimatePoint } = useEstimate(estimateId);
  // states
  const [loader, setLoader] = useState(false);
  const [estimateInputValue, setEstimateInputValue] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);

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

        const currentEstimatePointValues = estimatePointIds
          .map((estimatePointId) => estimatePointById(estimatePointId)?.value || undefined)
          .filter((estimateValue) => estimateValue != undefined) as string[];
        const isRepeated =
          (estimateType &&
            isEstimatePointValuesRepeated(currentEstimatePointValues, estimateType, estimateInputValue)) ||
          false;

        if (!isRepeated) {
          if (isEstimateValid) {
            const payload = {
              key: estimatePointIds?.length + 1,
              value: estimateInputValue,
            };
            await creteEstimatePoint(workspaceSlug, projectId, payload);
            setLoader(false);
            setError(undefined);
            handleClose();
          } else {
            setLoader(false);
            setError("please enter a valid estimate value");
          }
        } else {
          setLoader(false);
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Estimate point values cannot be repeated",
          });
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
