"use client";

import { FC, useState, FormEvent, useEffect } from "react";
import { observer } from "mobx-react";
import { Check, Info, X } from "lucide-react";
import { TEstimatePointsObject, TEstimateSystemKeys } from "@plane/types";
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
  estimateId: string | undefined;
  estimateType: TEstimateSystemKeys;
  estimatePoints: TEstimatePointsObject[];
  handleEstimatePointValue?: (estimateValue: string) => void;
  closeCallBack: () => void;
  handleCreateCallback: () => void;
  isError: boolean;
};

export const EstimatePointCreate: FC<TEstimatePointCreate> = observer((props) => {
  const {
    workspaceSlug,
    projectId,
    estimateId,
    estimateType,
    estimatePoints,
    handleEstimatePointValue,
    closeCallBack,
    handleCreateCallback,
    isError,
  } = props;
  // hooks
  const { creteEstimatePoint } = useEstimate(estimateId);
  // states
  const [estimateInputValue, setEstimateInputValue] = useState("");
  const [loader, setLoader] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (isError && error === undefined && estimateInputValue.length > 0) {
      setError("Confirm this value first or discard it.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isError]);

  const handleSuccess = (value: string) => {
    handleEstimatePointValue && handleEstimatePointValue(value);
    setEstimateInputValue("");
    closeCallBack();
  };

  const handleClose = () => {
    setEstimateInputValue("");
    closeCallBack();
  };

  const handleEstimateInputValue = (value: string) => {
    setError(undefined);
    setEstimateInputValue(value);
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!workspaceSlug || !projectId) return;

    setError(undefined);

    if (estimateInputValue) {
      const currentEstimateType: EEstimateSystem | undefined = estimateType;
      let isEstimateValid = false;

      const currentEstimatePointValues = estimatePoints
        .map((point) => point?.value || undefined)
        .filter((value) => value != undefined) as string[];
      const isRepeated =
        (estimateType && isEstimatePointValuesRepeated(currentEstimatePointValues, estimateType, estimateInputValue)) ||
        false;

      if (!isRepeated) {
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
          if (estimateId != undefined) {
            try {
              setLoader(true);

              const payload = {
                key: estimatePoints?.length + 1,
                value: estimateInputValue,
              };
              await creteEstimatePoint(workspaceSlug, projectId, payload);

              setLoader(false);
              setError(undefined);
              setToast({
                type: TOAST_TYPE.SUCCESS,
                title: "Estimate point created",
                message: "The estimate point has been created successfully.",
              });
              handleClose();
            } catch {
              setLoader(false);
              setError("We are unable to process your request, please try again.");
              setToast({
                type: TOAST_TYPE.ERROR,
                title: "Estimate point creation failed",
                message: "We were unable to create the new estimate point, please try again.",
              });
            }
          } else {
            handleSuccess(estimateInputValue);
            if (handleCreateCallback) {
              handleCreateCallback();
            }
          }
        } else {
          setLoader(false);
          setError(
            [EEstimateSystem.POINTS, EEstimateSystem.TIME].includes(estimateType)
              ? "Estimate point needs to be a numeric value."
              : "Estimate point needs to be a character value."
          );
        }
      } else setError("Estimate value already exists.");
    } else setError("Estimate value cannot be empty.");
  };

  return (
    <form onSubmit={handleCreate} className="relative flex items-center gap-2 text-base">
      <div
        className={cn(
          "relative w-full border rounded flex items-center my-1",
          error ? `border-red-500` : `border-custom-border-200`
        )}
      >
        <input
          type="text"
          value={estimateInputValue}
          onChange={(e) => handleEstimateInputValue(e.target.value)}
          className="border-none focus:ring-0 focus:border-0 focus:outline-none p-2.5 w-full bg-transparent"
          placeholder="Enter estimate point"
          autoFocus
        />
        {error && (
          <Tooltip tooltipContent={error} position="bottom">
            <div className="flex-shrink-0 w-3.5 h-3.5 overflow-hidden mr-3 relative flex justify-center items-center text-red-500">
              <Info size={14} />
            </div>
          </Tooltip>
        )}
      </div>

      {estimateInputValue && estimateInputValue.length > 0 && (
        <button
          type="submit"
          className="rounded-sm w-6 h-6 flex-shrink-0 relative flex justify-center items-center hover:bg-custom-background-80 transition-colors cursor-pointer text-green-500"
          disabled={loader}
        >
          {loader ? <Spinner className="w-4 h-4" /> : <Check size={14} />}
        </button>
      )}
      <button
        type="button"
        className="rounded-sm w-6 h-6 flex-shrink-0 relative flex justify-center items-center hover:bg-custom-background-80 transition-colors cursor-pointer"
        onClick={handleClose}
        disabled={loader}
      >
        <X size={14} className="text-custom-text-200" />
      </button>
    </form>
  );
});
