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
import { Fragment, useState } from "react";
import { observer } from "mobx-react";
import { PlusIcon, ChevronLeftIcon } from "@plane/propel/icons";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TEstimatePointsObject, TEstimateTypeError, TEstimateUpdateStageKeys } from "@plane/types";
import { Sortable } from "@plane/ui";
// components
import { EstimatePointCreate } from "@/components/estimates/points/create";
import { EstimatePointItemPreview } from "@/components/estimates/points/preview";
// hooks
import { useEstimate } from "@/hooks/store/estimates";
// plane web constants
import type { EEstimateUpdateStages } from "@/constants/estimates";
import { estimateCount } from "@/constants/estimates";

type TEstimatePointEditRoot = {
  workspaceSlug: string;
  projectId: string;
  estimateId: string;
  mode?: EEstimateUpdateStages;
  setEstimateEditType?: Dispatch<SetStateAction<TEstimateUpdateStageKeys | undefined>>;
  handleClose: () => void;
};

export const EstimatePointEditRoot = observer(function EstimatePointEditRoot(props: TEstimatePointEditRoot) {
  // props
  const { workspaceSlug, projectId, estimateId, setEstimateEditType, handleClose } = props;
  // hooks
  const { asJson: estimate, estimatePointIds, estimatePointById, updateEstimateSortOrder } = useEstimate(estimateId);
  const { t } = useTranslation();
  // states
  const [estimatePointCreate, setEstimatePointCreate] = useState<TEstimatePointsObject[] | undefined>(undefined);
  const [estimatePointError, setEstimatePointError] = useState<TEstimateTypeError>(undefined);

  const estimatePoints: TEstimatePointsObject[] =
    estimatePointIds && estimatePointIds.length > 0
      ? (estimatePointIds.map((estimatePointId: string) => {
          const estimatePoint = estimatePointById(estimatePointId);
          if (estimatePoint) return { id: estimatePointId, key: estimatePoint.key, value: estimatePoint.value };
        }) as TEstimatePointsObject[])
      : ([] as TEstimatePointsObject[]);

  const handleEstimatePointCreate = (mode: "add" | "remove", value: TEstimatePointsObject) => {
    switch (mode) {
      case "add":
        setEstimatePointCreate((prevValue) => {
          prevValue = prevValue ? [...prevValue] : [];
          return [...prevValue, value];
        });
        break;
      case "remove":
        setEstimatePointCreate((prevValue) => {
          prevValue = prevValue ? [...prevValue] : [];
          return prevValue.filter((item) => item.key !== value.key);
        });
        break;
      default:
        break;
    }
  };

  const handleDragEstimatePoints = async (updatedEstimatedOrder: TEstimatePointsObject[]) => {
    try {
      const updatedEstimateKeysOrder = updatedEstimatedOrder.map((item, index) => ({ ...item, key: index + 1 }));
      await updateEstimateSortOrder(workspaceSlug, projectId, updatedEstimateKeysOrder);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("estimates.toasts.reorder.success.title"),
        message: t("estimates.toasts.reorder.success.message"),
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("estimates.toasts.reorder.error.title"),
        message: t("estimates.toasts.reorder.error.message"),
      });
    }
  };

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

  const handleCreate = () => {
    if (estimatePoints && estimatePoints.length + (estimatePointCreate?.length || 0) <= estimateCount.max - 1) {
      const currentKey = estimatePoints.length + (estimatePointCreate?.length || 0) + 1;
      handleEstimatePointCreate("add", {
        id: undefined,
        key: currentKey,
        value: "",
      });
      handleEstimatePointError?.(currentKey, "", "", undefined, "add");
    }
  };

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

  const handleEstimateDone = async () => {
    if (!validateEstimatePointError()) {
      handleClose();
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
            // NOTE: validate the estimate type
            newError[currentKey].message =
              newError[currentKey].message || t("project_settings.estimates.validation.remove_empty");
          }
        });
        return newError;
      });
    }
  };

  if (!workspaceSlug || !projectId || !estimateId) return <></>;
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
          <div className="text-18 font-medium text-secondary">{t("project_settings.estimates.edit.title")}</div>
        </div>

        <Button variant="primary" onClick={handleEstimateDone}>
          {t("common.done")}
        </Button>
      </div>

      <div className="space-y-3 px-5">
        <div className="text-13 font-medium text-secondary capitalize">{estimate?.type}</div>
        <div>
          <Sortable
            data={estimatePoints}
            render={(value: TEstimatePointsObject) => (
              <Fragment>
                {value?.id && estimate?.type ? (
                  <EstimatePointItemPreview
                    workspaceSlug={workspaceSlug}
                    projectId={projectId}
                    estimateId={estimateId}
                    estimatePointId={value?.id}
                    estimateType={estimate?.type}
                    estimatePoint={value}
                    estimatePoints={estimatePoints}
                    estimatePointError={estimatePointError?.[value.key] || undefined}
                    handleEstimatePointError={(
                      newValue: string,
                      message: string | undefined,
                      mode: "add" | "delete" = "add"
                    ) =>
                      handleEstimatePointError &&
                      handleEstimatePointError(value.key, value.value, newValue, message, mode)
                    }
                  />
                ) : null}
              </Fragment>
            )}
            onChange={(data: TEstimatePointsObject[]) => handleDragEstimatePoints(data)}
            keyExtractor={(item: TEstimatePointsObject) => item?.id?.toString() || item.value.toString()}
          />
        </div>

        {estimatePointCreate &&
          estimatePointCreate.map(
            (estimatePoint) =>
              estimate?.type && (
                <EstimatePointCreate
                  key={estimatePoint?.key}
                  workspaceSlug={workspaceSlug}
                  projectId={projectId}
                  estimateId={estimateId}
                  estimateType={estimate?.type}
                  closeCallBack={() => handleEstimatePointCreate("remove", estimatePoint)}
                  estimatePoints={estimatePoints}
                  handleCreateCallback={() => estimatePointCreate.length === 1 && handleCreate()}
                  estimatePointError={estimatePointError?.[estimatePoint.key] || undefined}
                  handleEstimatePointError={(
                    newValue: string,
                    message: string | undefined,
                    mode: "add" | "delete" = "add"
                  ) =>
                    handleEstimatePointError &&
                    handleEstimatePointError(estimatePoint.key, estimatePoint.value, newValue, message, mode)
                  }
                />
              )
          )}

        {estimatePoints && estimatePoints.length + (estimatePointCreate?.length || 0) <= estimateCount.max - 1 && (
          <Button variant="link" prependIcon={<PlusIcon />} onClick={handleCreate}>
            Add {estimate?.type}
          </Button>
        )}
      </div>
    </>
  );
});
