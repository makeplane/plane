import { Dispatch, FC, SetStateAction, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { ChevronLeft } from "lucide-react";
import {
  IEstimateFormData,
  TEstimatePointsObject,
  TEstimateSystemKeys,
  TEstimateTypeError,
  TEstimateUpdateStageKeys,
} from "@plane/types";
import { Button, TOAST_TYPE, setToast } from "@plane/ui";
// hooks
import { useEstimate } from "@/hooks/store";
// plane web components
import { EstimatePointItemSwitchPreview } from "@/plane-web/components/estimates";
// plane web constants
import { EEstimateSystem, EEstimateUpdateStages, ESTIMATE_SYSTEMS } from "@/plane-web/constants/estimates";

type TEstimatePointSwitchRoot = {
  setEstimateEditType?: Dispatch<SetStateAction<TEstimateUpdateStageKeys | undefined>>;
  estimateSystemSwitchType: TEstimateSystemKeys;
  workspaceSlug: string;
  projectId: string;
  estimateId: string;
  handleClose: () => void;
  mode?: EEstimateUpdateStages;
};

export const EstimatePointSwitchRoot: FC<TEstimatePointSwitchRoot> = observer((props) => {
  // props
  const { setEstimateEditType, estimateSystemSwitchType, workspaceSlug, projectId, estimateId, handleClose } = props;
  // hooks
  const { asJson: estimate, estimatePointIds, estimatePointById, updateEstimateSwitch } = useEstimate(estimateId);
  // states
  const [estimatePoints, setEstimatePoints] = useState<TEstimatePointsObject[] | undefined>(undefined);
  const [estimatePointError, setEstimatePointError] = useState<TEstimateTypeError>(undefined);
  const [switchLoader, setSwitchLoader] = useState(false);

  const handleEstimatePointError = (
    key: number,
    oldValue: string,
    newValue: string,
    message: string | undefined,
    mode: "add" | "delete" = "add"
  ) => {
    setEstimatePointError((prev) => {
      if (mode === "add") {
        return { ...prev, [key]: { oldValue, newValue, message } };
      } else {
        const newError = { ...prev };
        delete newError[key];
        return newError;
      }
    });
  };

  useEffect(() => {
    if (!estimatePointIds) return;
    setEstimatePoints(
      estimatePointIds.map((estimatePointId: string) => {
        const estimatePoint = estimatePointById(estimatePointId);
        if (estimatePoint) return { id: estimatePointId, key: estimatePoint.key, value: "" };
      }) as TEstimatePointsObject[]
    );
  }, [estimatePointById, estimatePointIds]);

  const handleEstimatePoints = (index: number, value: string) => {
    setEstimatePoints((prevValue) => {
      prevValue = prevValue ? [...prevValue] : [];
      prevValue[index].value = value;
      handleEstimatePointError(prevValue[index].key, "", "", undefined, "delete");
      return prevValue;
    });
  };

  const isValidEstimatePoints = (estimateSystemSwitchType: TEstimateSystemKeys) => {
    let isValid: boolean = false;

    // validate if the fields are empty
    const isNonEmptyPoints = [];
    estimatePoints?.map((estimatePoint) => {
      if (estimatePoint.value && estimatePoint.value != "" && estimatePoint.value.length > 0) {
        isNonEmptyPoints.push(estimatePoint.value);
      } else {
        handleEstimatePointError(estimatePoint.key, "", "", "Please fill this estimate point field");
      }
    });

    // validate if fields are repeated
    const repeatedValues: string[] = [];
    estimatePoints?.map((estimatePoint) => {
      if (estimatePoint.value && estimatePoint.value != "") {
        if (repeatedValues.includes(estimatePoint.value.trim())) {
          handleEstimatePointError(estimatePoint.key, "", "", "Estimate point value cannot be repeated");
        } else {
          repeatedValues.push(estimatePoint.value.trim());
        }
      }
    });

    // validate if fields are valid in points and time required number values and categories required string values
    const estimatePointArray: string[] = [];
    if ([(EEstimateSystem.TIME, EEstimateSystem.POINTS)].includes(estimateSystemSwitchType)) {
      estimatePoints?.map((estimatePoint) => {
        if (estimateSystemSwitchType && estimatePoint.value && estimatePoint.value != "") {
          if (!isNaN(Number(estimatePoint.value))) {
            if (Number(estimatePoint.value) <= 0) {
              handleEstimatePointError(estimatePoint.key, "", "", "Estimate point should be greater than 0.");
            } else {
              estimatePointArray.push(estimatePoint.value);
            }
          } else {
            handleEstimatePointError(estimatePoint.key, "", "", "Estimate point value should be a number.");
          }
        }
      });
    } else if (estimateSystemSwitchType === EEstimateSystem.CATEGORIES) {
      estimatePoints?.map((estimatePoint) => {
        if (estimatePoint.value && estimatePoint.value != "") {
          if (estimatePoint.value.length > 0 && isNaN(Number(estimatePoint.value))) {
            estimatePointArray.push(estimatePoint.value);
          } else {
            handleEstimatePointError(estimatePoint.key, "", "", "Estimate point value should be a string.");
          }
        }
      });
    }

    if (
      isNonEmptyPoints.length === estimatePoints?.length &&
      repeatedValues.length === estimatePoints?.length &&
      estimatePointArray.length === estimatePoints?.length
    ) {
      isValid = true;
    } else {
      isValid = false;
    }

    return isValid;
  };

  const handleSwitchEstimate = async () => {
    try {
      if (!workspaceSlug || !projectId) return;
      setSwitchLoader(true);

      const isEstimatesValid = estimateSystemSwitchType && isValidEstimatePoints(estimateSystemSwitchType);

      if (isEstimatesValid) {
        const validatedEstimatePoints: TEstimatePointsObject[] = [];
        estimatePoints?.map((estimatePoint) => {
          validatedEstimatePoints.push(estimatePoint);
        });

        const payload: IEstimateFormData = {
          estimate: {
            name: ESTIMATE_SYSTEMS[estimateSystemSwitchType]?.name,
            type: estimateSystemSwitchType,
          },
          estimate_points: validatedEstimatePoints,
        };
        await updateEstimateSwitch(workspaceSlug, projectId, payload);

        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Estimate system created",
          message: "Created and Enabled successfully",
        });
        handleClose();
        setSwitchLoader(false);
      }
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "something went wrong",
      });
      setSwitchLoader(false);
    }
  };

  if (!workspaceSlug || !projectId || !estimateId || !estimatePoints) return <></>;
  return (
    <>
      <div className="relative flex justify-between items-center gap-2 px-5">
        <div className="relative flex items-center gap-1">
          <div
            onClick={() => setEstimateEditType && setEstimateEditType(undefined)}
            className="flex-shrink-0 cursor-pointer w-5 h-5 flex justify-center items-center"
          >
            <ChevronLeft className="w-4 h-4" />
          </div>
          <div className="text-xl font-medium text-custom-text-200">Switch estimate system</div>
        </div>
      </div>

      <div className="space-y-3 px-5 pb-5">
        <div className="text-sm font-medium flex items-center gap-2">
          <div className="w-full">Current {estimate?.type}</div>
          <div className="flex-shrink-0 w-4 h-4" />
          <div className="w-full">New {estimateSystemSwitchType}</div>
        </div>

        {estimatePoints.map((estimateObject, index) => (
          <EstimatePointItemSwitchPreview
            key={estimateObject?.id}
            estimateId={estimateId}
            estimatePointId={estimateObject?.id}
            estimateSystemSwitchType={estimateSystemSwitchType}
            estimatePoint={estimateObject}
            handleEstimatePoint={(value: string) => handleEstimatePoints(index, value)}
            estimatePointError={estimatePointError?.[estimateObject.key] || undefined}
          />
        ))}
      </div>

      <div className="relative flex justify-end items-center gap-3 px-5 pt-5 border-t border-custom-border-200">
        <Button variant="neutral-primary" size="sm" onClick={handleClose}>
          Cancel
        </Button>

        <Button variant="primary" size="sm" onClick={handleSwitchEstimate} disabled={switchLoader}>
          {switchLoader ? "Updating..." : "Update"}
        </Button>
      </div>
    </>
  );
});
