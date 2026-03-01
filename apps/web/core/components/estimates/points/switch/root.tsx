/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";
import { capitalize } from "lodash-es";
import { observer } from "mobx-react";
import { MoveRight } from "lucide-react";
import { useTranslation } from "@plane/i18n";
// plane imports
import { Button } from "@plane/propel/button";
import { ChevronLeftIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type {
  IEstimateFormData,
  TEstimatePointsObject,
  TEstimateSystemKeys,
  TEstimateTypeError,
  TEstimateUpdateStageKeys,
} from "@plane/types";
// constants
import type { EEstimateUpdateStages } from "@/constants/estimates";
import { EEstimateSystem, ESTIMATE_SYSTEMS } from "@/constants/estimates";
// hooks
import { useEstimate } from "@/hooks/store/estimates";
// local imports
import { EstimatePointItemSwitchPreview } from "./preview";
import { EstimateSwitchDropdown } from "./estimate-dropdown";

type TEstimatePointSwitchRoot = {
  setEstimateEditType?: Dispatch<SetStateAction<TEstimateUpdateStageKeys | undefined>>;
  estimateSystemSwitchType?: TEstimateSystemKeys;
  workspaceSlug: string;
  projectId: string;
  estimateId: string;
  handleClose: () => void;
  mode?: EEstimateUpdateStages;
  setEstimateSystemSwitchType?: Dispatch<SetStateAction<TEstimateSystemKeys | undefined>>;
};

export const EstimatePointSwitchRoot = observer(function EstimatePointSwitchRoot(props: TEstimatePointSwitchRoot) {
  // props
  const {
    setEstimateEditType,
    estimateSystemSwitchType,
    workspaceSlug,
    projectId,
    estimateId,
    handleClose,
    setEstimateSystemSwitchType,
  } = props;
  // hooks
  const { asJson: estimate, estimatePointIds, estimatePointById, updateEstimateSwitch } = useEstimate(estimateId);
  const { t } = useTranslation();
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
    setSwitchLoader(false);
  };

  const isValidEstimatePoints = (estimateSystemSwitchType: TEstimateSystemKeys) => {
    let isValid: boolean = false;

    // validate if the fields are empty
    const isNonEmptyPoints = [];
    estimatePoints?.map((estimatePoint) => {
      if (estimatePoint.value && estimatePoint.value != "" && estimatePoint.value.length > 0) {
        isNonEmptyPoints.push(estimatePoint.value);
      } else {
        handleEstimatePointError(estimatePoint.key, "", "", t("project_settings.estimates.validation.fill"));
      }
    });

    // validate if fields are repeated
    const repeatedValues: string[] = [];
    estimatePoints?.map((estimatePoint) => {
      if (estimatePoint.value && estimatePoint.value != "") {
        if (repeatedValues.includes(estimatePoint.value.trim())) {
          handleEstimatePointError(estimatePoint.key, "", "", t("project_settings.estimates.validation.repeat"));
        } else {
          repeatedValues.push(estimatePoint.value.trim());
        }
      }
    });

    // validate if fields are valid in points and time required number values and categories required string values
    const estimatePointArray: string[] = [];
    if ([EEstimateSystem.TIME, EEstimateSystem.POINTS].includes(estimateSystemSwitchType)) {
      estimatePoints?.map((estimatePoint) => {
        if (estimateSystemSwitchType && estimatePoint.value && estimatePoint.value != "") {
          if (!isNaN(Number(estimatePoint.value))) {
            if (Number(estimatePoint.value) <= 0) {
              handleEstimatePointError(
                estimatePoint.key,
                "",
                "",
                t("project_settings.estimates.validation.min_length")
              );
            } else {
              estimatePointArray.push(estimatePoint.value);
            }
          } else {
            handleEstimatePointError(estimatePoint.key, "", "", t("project_settings.estimates.validation.numeric"));
          }
        }
      });
    } else if (estimateSystemSwitchType === EEstimateSystem.CATEGORIES) {
      estimatePoints?.map((estimatePoint) => {
        if (estimatePoint.value && estimatePoint.value != "") {
          if (estimatePoint.value.length > 0 && isNaN(Number(estimatePoint.value))) {
            estimatePointArray.push(estimatePoint.value);
          } else {
            handleEstimatePointError(estimatePoint.key, "", "", t("project_settings.estimates.validation.character"));
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
          title: t("project_settings.estimates.toasts.switch.success.title"),
          message: t("project_settings.estimates.toasts.switch.success.message"),
        });
        handleClose();
        setSwitchLoader(false);
      } else {
        setSwitchLoader(false);
      }
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("project_settings.estimates.toasts.switch.error.title"),
        message: t("project_settings.estimates.toasts.switch.error.message"),
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
            <ChevronLeftIcon className="w-4 h-4" />
          </div>
          <div className="text-18 font-medium text-secondary">{t("project_settings.estimates.switch")}</div>
        </div>
      </div>

      <div className="space-y-3 px-5 pb-5">
        <div className="text-13 font-medium flex items-center gap-4">
          <div className="w-full text-placeholder">{t("project_settings.estimates.current")}</div>
          <div className="flex-shrink-0 w-4" />
          <div className="w-full text-placeholder">{t("project_settings.estimates.new")}</div>
        </div>

        <div className="font-medium flex items-center gap-2">
          <div className="w-full border border-subtle-1 rounded-sm px-3 py-2 bg-layer-1 text-13">
            {capitalize(estimate?.type)}
          </div>
          <div className="flex-shrink-0 w-4 h-4 relative flex justify-center items-center">
            <MoveRight size={12} />
          </div>
          <div className="w-full text-13">
            <EstimateSwitchDropdown
              estimateType={estimateSystemSwitchType}
              onChange={(value) => setEstimateSystemSwitchType && setEstimateSystemSwitchType(value)}
              currentEstimateType={estimate?.type}
            />
          </div>
        </div>
        {estimateSystemSwitchType && (
          <>
            <div className="border-t-[0.5px] border-subtle-1" />
            <div className="space-y-6">
              {estimatePoints.map((estimateObject, index) => (
                <div key={estimateObject?.id}>
                  <EstimatePointItemSwitchPreview
                    key={estimateObject?.id}
                    estimateId={estimateId}
                    estimatePointId={estimateObject?.id}
                    estimateSystemSwitchType={estimateSystemSwitchType}
                    estimatePoint={estimateObject}
                    estimateType={estimate?.type}
                    handleEstimatePoint={(value: string) => handleEstimatePoints(index, value)}
                    estimatePointError={estimatePointError?.[estimateObject.key] || undefined}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="relative flex justify-end items-center gap-3 px-5 pt-5 border-t border-subtle-1">
        <Button variant="secondary" onClick={handleClose}>
          {t("common.cancel")}
        </Button>

        <Button variant="primary" onClick={handleSwitchEstimate} disabled={switchLoader || !estimateSystemSwitchType}>
          {switchLoader ? t("common.updating") : t("common.update")}
        </Button>
      </div>
    </>
  );
});
