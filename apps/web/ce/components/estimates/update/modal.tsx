/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { EEstimateSystem, estimateCount } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { PlusIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TEstimatePointsObject, TEstimateTypeError } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore, Sortable } from "@plane/ui";
// components
import { EstimatePointCreate } from "@/components/estimates/points/create";
import { EstimatePointItemPreview } from "@/components/estimates/points/preview";
// hooks
import { useEstimate } from "@/hooks/store/estimates/use-estimate";

type TUpdateEstimateModal = {
  workspaceSlug: string;
  projectId: string;
  estimateId: string | undefined;
  isOpen: boolean;
  handleClose: () => void;
};

export const UpdateEstimateModal = observer(function UpdateEstimateModal(props: TUpdateEstimateModal) {
  // props
  const { workspaceSlug, projectId, estimateId, isOpen, handleClose } = props;
  // hooks
  const { asJson: estimate, estimatePointIds, estimatePointById, updateEstimateSortOrder } = useEstimate(estimateId);
  const { t } = useTranslation();
  // states
  const [estimatePointCreate, setEstimatePointCreate] = useState<TEstimatePointsObject[] | undefined>(undefined);
  const [estimatePointError, setEstimatePointError] = useState<TEstimateTypeError>(undefined);

  useEffect(() => {
    if (isOpen) {
      setEstimatePointCreate(undefined);
      setEstimatePointError(undefined);
    }
  }, [isOpen]);

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

  if (!estimateId) return <></>;

  // derived values
  const estimateType = estimate?.type ?? EEstimateSystem.POINTS;
  const estimatePoints: TEstimatePointsObject[] = (estimatePointIds ?? [])
    .map((currentEstimatePointId): TEstimatePointsObject | undefined => {
      const estimatePoint = estimatePointById(currentEstimatePointId);
      if (estimatePoint && estimatePoint.id)
        return { id: estimatePoint.id, key: estimatePoint.key ?? 0, value: estimatePoint.value ?? "" };
      return undefined;
    })
    .filter((estimatePoint): estimatePoint is TEstimatePointsObject => estimatePoint != undefined);

  const handleDragEstimatePoints = async (updatedEstimatedOrder: TEstimatePointsObject[]) => {
    const updatedEstimateKeysOrder = updatedEstimatedOrder.map((item, index) => ({ ...item, key: index + 1 }));
    try {
      await updateEstimateSortOrder(workspaceSlug, projectId, updatedEstimateKeysOrder);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("project_settings.estimates.toasts.reorder.success.title"),
        message: t("project_settings.estimates.toasts.reorder.success.message"),
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("project_settings.estimates.toasts.reorder.error.title"),
        message: t("project_settings.estimates.toasts.reorder.error.message"),
      });
    }
  };

  const handleCreate = () => {
    if (estimatePoints.length + (estimatePointCreate?.length || 0) <= estimateCount.max - 1) {
      const currentKey = estimatePoints.length + (estimatePointCreate?.length || 0) + 1;
      handleEstimatePointCreate("add", {
        id: undefined,
        key: currentKey,
        value: "",
      });
      handleEstimatePointError(currentKey, "", "", undefined, "add");
    }
  };

  return (
    <ModalCore isOpen={isOpen} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      <div className="relative space-y-6 py-5">
        {/* heading */}
        <div className="relative flex items-center justify-between gap-2 px-5">
          <div className="text-18 font-medium text-primary">{t("project_settings.estimates.edit.title")}</div>
        </div>

        {/* estimate points */}
        <div className="px-5">
          <div className="space-y-1">
            <div className="text-13 font-medium text-secondary capitalize">{estimateType}</div>

            <div>
              <Sortable
                data={estimatePoints}
                render={(value: TEstimatePointsObject) => (
                  <EstimatePointItemPreview
                    workspaceSlug={workspaceSlug}
                    projectId={projectId}
                    estimateId={estimateId}
                    estimateType={estimateType}
                    estimatePointId={value?.id}
                    estimatePoints={estimatePoints}
                    estimatePoint={value}
                    estimatePointError={estimatePointError?.[value.key] || undefined}
                    handleEstimatePointError={(
                      newValue: string,
                      message: string | undefined,
                      mode: "add" | "delete" = "add"
                    ) => handleEstimatePointError(value.key, value.value, newValue, message, mode)}
                  />
                )}
                onChange={(data: TEstimatePointsObject[]) => handleDragEstimatePoints(data)}
                keyExtractor={(item: TEstimatePointsObject) => item?.id?.toString() || item.value.toString()}
              />
            </div>

            {estimatePointCreate &&
              estimatePointCreate.map((estimatePoint) => (
                <EstimatePointCreate
                  key={estimatePoint?.key}
                  workspaceSlug={workspaceSlug}
                  projectId={projectId}
                  estimateId={estimateId}
                  estimateType={estimateType}
                  estimatePoints={estimatePoints}
                  closeCallBack={() => handleEstimatePointCreate("remove", estimatePoint)}
                  handleCreateCallback={() => {}}
                  estimatePointError={estimatePointError?.[estimatePoint.key] || undefined}
                  handleEstimatePointError={(
                    newValue: string,
                    message: string | undefined,
                    mode: "add" | "delete" = "add"
                  ) => handleEstimatePointError(estimatePoint.key, estimatePoint.value, newValue, message, mode)}
                />
              ))}
            {estimatePoints.length + (estimatePointCreate?.length || 0) <= estimateCount.max - 1 && (
              <Button variant="link" prependIcon={<PlusIcon />} onClick={handleCreate}>
                Add {estimateType}
              </Button>
            )}
          </div>
        </div>

        <div className="relative flex items-center justify-end gap-3 border-t border-subtle px-5 pt-5">
          <Button variant="primary" size="lg" onClick={handleClose}>
            {t("common.done")}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
