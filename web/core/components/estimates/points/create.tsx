"use client";

import { FC, useState, FormEvent } from "react";
import { observer } from "mobx-react";
import { Check, Info, X } from "lucide-react";
import { TEstimatePointsObject, TEstimateSystemKeys, TEstimateTypeErrorObject } from "@plane/types";
import { Spinner, TOAST_TYPE, Tooltip, setToast } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
import { isEstimatePointValuesRepeated } from "@/helpers/estimates";
// hooks
import { useEstimate } from "@/hooks/store";
// plane web constants
import { EEstimateSystem, MAX_ESTIMATE_POINT_INPUT_LENGTH } from "@/plane-web/constants/estimates";

type TEstimatePointCreate = {
  workspaceSlug: string;
  projectId: string;
  estimateId: string | undefined;
  estimateType: TEstimateSystemKeys;
  estimatePoints: TEstimatePointsObject[];
  handleEstimatePointValue?: (estimateValue: string) => void;
  closeCallBack: () => void;
  handleCreateCallback: () => void;
  estimatePointError?: TEstimateTypeErrorObject | undefined;
  handleEstimatePointError?: (newValue: string, message: string | undefined, mode?: "add" | "delete") => void;
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
    estimatePointError,
    handleEstimatePointError,
  } = props;
  // hooks
  const { creteEstimatePoint } = useEstimate(estimateId);
  // states
  const [estimateInputValue, setEstimateInputValue] = useState("");
  const [loader, setLoader] = useState(false);

  const handleSuccess = (value: string) => {
    handleEstimatePointValue && handleEstimatePointValue(value);
    setEstimateInputValue("");
    closeCallBack();
  };

  const handleClose = () => {
    handleEstimatePointError && handleEstimatePointError(estimateInputValue, undefined, "delete");
    setEstimateInputValue("");
    closeCallBack();
  };

  const handleEstimateInputValue = (value: string) => {
    if (value.length <= MAX_ESTIMATE_POINT_INPUT_LENGTH) {
      setEstimateInputValue(value);
      handleEstimatePointError && handleEstimatePointError(value, undefined);
    }
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!workspaceSlug || !projectId) return;

    handleEstimatePointError && handleEstimatePointError(estimateInputValue, undefined, "delete");

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
          if (estimateInputValue && !isNaN(Number(estimateInputValue))) {
            if (Number(estimateInputValue) <= 0) {
              handleEstimatePointError &&
                handleEstimatePointError(estimateInputValue, "Estimate point should be greater than 0.");
              return;
            } else {
              isEstimateValid = true;
            }
          }
        } else if (currentEstimateType && currentEstimateType === EEstimateSystem.CATEGORIES) {
          if (estimateInputValue && estimateInputValue.length > 0 && isNaN(Number(estimateInputValue))) {
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
              handleEstimatePointError && handleEstimatePointError(estimateInputValue, undefined, "delete");
              setToast({
                type: TOAST_TYPE.SUCCESS,
                title: "Estimate point created",
                message: "The estimate point has been created successfully.",
              });
              handleClose();
            } catch {
              setLoader(false);
              handleEstimatePointError &&
                handleEstimatePointError(
                  estimateInputValue,
                  "We are unable to process your request, please try again."
                );
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
          handleEstimatePointError &&
            handleEstimatePointError(
              estimateInputValue,
              [EEstimateSystem.POINTS, EEstimateSystem.TIME].includes(estimateType)
                ? "Estimate point needs to be a numeric value."
                : "Estimate point needs to be a character value."
            );
        }
      } else handleEstimatePointError && handleEstimatePointError(estimateInputValue, "Estimate value already exists.");
    } else handleEstimatePointError && handleEstimatePointError(estimateInputValue, "Estimate value cannot be empty.");
  };

  // derived values
  const inputFieldType =
    estimateType && [(EEstimateSystem.TIME, EEstimateSystem.POINTS)].includes(estimateType) ? "number" : "text";
  const inputProps = {
    type: inputFieldType,
    pattern: inputFieldType === "number" ? "[0-9]*" : undefined,
    maxlength: MAX_ESTIMATE_POINT_INPUT_LENGTH,
  };

  return (
    <form onSubmit={handleCreate} className="relative flex items-center gap-2 text-base pr-2.5">
      <div
        className={cn(
          "relative w-full border rounded flex items-center my-1",
          estimatePointError?.message ? `border-red-500` : `border-custom-border-200`
        )}
      >
        <input
          value={estimateInputValue}
          onChange={(e) => handleEstimateInputValue(e.target.value)}
          className="border-none focus:ring-0 focus:border-0 focus:outline-none p-2.5 w-full bg-transparent"
          placeholder="Enter estimate point"
          autoFocus
          {...inputProps}
        />
        {estimatePointError?.message && (
          <Tooltip
            tooltipContent={
              (estimateInputValue || "")?.length >= 1
                ? `You have some unsaved changes, Please save them before clicking on done`
                : estimatePointError?.message
            }
            position="bottom"
          >
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
