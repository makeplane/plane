"use client";

import { FC, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { ChevronLeft } from "lucide-react";
// types
import { IEstimateFormData, TEstimateSystemKeys, TEstimatePointsObject, TEstimateTypeError } from "@plane/types";
// ui
import { Button, EModalPosition, EModalWidth, ModalCore, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { EstimateCreateStageOne, EstimatePointCreateRoot } from "@/components/estimates";
// hooks
import { useProjectEstimates } from "@/hooks/store";
// plane web constants
import { EEstimateSystem, ESTIMATE_SYSTEMS } from "@/plane-web/constants/estimates";

type TCreateEstimateModal = {
  workspaceSlug: string;
  projectId: string;
  isOpen: boolean;
  handleClose: () => void;
};

export const CreateEstimateModal: FC<TCreateEstimateModal> = observer((props) => {
  // props
  const { workspaceSlug, projectId, isOpen, handleClose } = props;
  // hooks
  const { createEstimate } = useProjectEstimates();
  // states
  const [estimateSystem, setEstimateSystem] = useState<TEstimateSystemKeys>(EEstimateSystem.POINTS);
  const [estimatePoints, setEstimatePoints] = useState<TEstimatePointsObject[] | undefined>(undefined);
  const [estimatePointError, setEstimatePointError] = useState<TEstimateTypeError>(undefined);
  const [buttonLoader, setButtonLoader] = useState(false);

  const handleUpdatePoints = (newPoints: TEstimatePointsObject[] | undefined) => setEstimatePoints(newPoints);

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
    if (isOpen) {
      setEstimateSystem(EEstimateSystem.POINTS);
      setEstimatePoints(undefined);
      setEstimatePointError([]);
    }
  }, [isOpen]);

  const validateEstimatePointError = () => {
    let estimateError = false;
    if (!estimatePointError) return estimateError;

    Object.keys(estimatePointError || {}).forEach((key) => {
      const currentKey = key as unknown as number;
      if (
        estimatePointError[currentKey]?.oldValue != estimatePointError[currentKey]?.newValue ||
        estimatePointError[currentKey]?.newValue === "" ||
        estimatePointError[currentKey]?.message
      ) {
        estimateError = true;
      }
    });

    return estimateError;
  };

  const handleCreateEstimate = async () => {
    if (!validateEstimatePointError()) {
      try {
        if (!workspaceSlug || !projectId || !estimatePoints) return;
        setButtonLoader(true);
        const payload: IEstimateFormData = {
          estimate: {
            name: ESTIMATE_SYSTEMS[estimateSystem]?.name,
            type: estimateSystem,
            last_used: true,
          },
          estimate_points: estimatePoints,
        };
        await createEstimate(workspaceSlug, projectId, payload);
        setButtonLoader(false);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Estimate created",
          message: "A new estimate has been added in your project.",
        });
        handleClose();
      } catch (error) {
        setButtonLoader(false);
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Estimate creation failed",
          message: "We were unable to create the new estimate, please try again.",
        });
      }
    } else {
      setEstimatePointError((prev) => {
        const newError = { ...prev };
        Object.keys(newError || {}).forEach((key) => {
          const currentKey = key as unknown as number;
          if (
            newError[currentKey]?.newValue != "" &&
            newError[currentKey]?.oldValue === newError[currentKey]?.newValue
          ) {
            delete newError[currentKey];
          } else {
            newError[currentKey].message =
              newError[currentKey].message ||
              "Estimate point can't be empty. Enter a value in each field or remove those you don't have values for.";
          }
        });
        return newError;
      });
    }
  };

  // derived values
  const renderEstimateStepsCount = useMemo(() => (estimatePoints ? "2" : "1"), [estimatePoints]);
  // const isEstimatePointError = useMemo(() => {
  //   if (!estimatePointError) return false;
  //   return Object.keys(estimatePointError).length > 0;
  // }, [estimatePointError]);

  return (
    <ModalCore isOpen={isOpen} position={EModalPosition.TOP} width={EModalWidth.XXL}>
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
            <div className="text-xl font-medium text-custom-text-100">New estimate system</div>
          </div>
          <div className="text-xs text-gray-400">Step {renderEstimateStepsCount} of 2</div>
        </div>

        {/* estimate steps */}
        <div className="px-5">
          {!estimatePoints && (
            <EstimateCreateStageOne
              estimateSystem={estimateSystem}
              handleEstimateSystem={setEstimateSystem}
              handleEstimatePoints={(templateType: string) =>
                handleUpdatePoints(ESTIMATE_SYSTEMS[estimateSystem].templates[templateType].values)
              }
            />
          )}
          {estimatePoints && (
            <EstimatePointCreateRoot
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              estimateId={undefined}
              estimateType={estimateSystem}
              estimatePoints={estimatePoints}
              setEstimatePoints={setEstimatePoints}
              estimatePointError={estimatePointError}
              handleEstimatePointError={handleEstimatePointError}
            />
          )}
          {/* {isEstimatePointError && (
            <div className="pt-5 text-sm text-red-500">
              Estimate points can&apos;t be empty. Enter a value in each field or remove those you don&apos;t have
              values for.
            </div>
          )} */}
        </div>

        <div className="relative flex justify-end items-center gap-3 px-5 pt-5 border-t border-custom-border-200">
          <Button variant="neutral-primary" size="sm" onClick={handleClose} disabled={buttonLoader}>
            Cancel
          </Button>
          {estimatePoints && (
            <Button variant="primary" size="sm" onClick={handleCreateEstimate} disabled={buttonLoader}>
              {buttonLoader ? `Creating` : `Create Estimate`}
            </Button>
          )}
        </div>
      </div>
    </ModalCore>
  );
});
