/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Info, MoveRight } from "lucide-react";
// plane imports
import { EEstimateSystem } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { CloseIcon, TrashIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import type { TEstimatePointsObject, TEstimateSystemKeys, TEstimateTypeErrorObject } from "@plane/types";
import { CustomSelect, Spinner } from "@plane/ui";
import { cn, convertMinutesToHoursMinutesString } from "@plane/utils";
// hooks
import { useEstimate } from "@/hooks/store/estimates/use-estimate";
import { useEstimatePoint } from "@/hooks/store/estimates/use-estimate-point";

export type TEstimatePointDelete = {
  workspaceSlug: string;
  projectId: string;
  estimateId: string;
  estimatePointId: string;
  estimatePoints: TEstimatePointsObject[];
  callback: () => void;
  estimatePointError?: TEstimateTypeErrorObject | undefined;
  handleEstimatePointError?: (newValue: string, message: string | undefined, mode?: "add" | "delete") => void;
  estimateSystem: TEstimateSystemKeys;
};

export const EstimatePointDelete = observer(function EstimatePointDelete(props: TEstimatePointDelete) {
  const {
    workspaceSlug,
    projectId,
    estimateId,
    estimatePointId,
    estimatePoints,
    callback,
    handleEstimatePointError,
    estimateSystem,
  } = props;
  // hooks
  const { deleteEstimatePoint } = useEstimate(estimateId);
  const { asJson: estimatePoint } = useEstimatePoint(estimateId, estimatePointId);
  // i18n
  const { t } = useTranslation();
  // states
  const [loader, setLoader] = useState(false);
  const [selectedEstimatePointId, setSelectedEstimatePointId] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  // derived values
  const replacementOptions = estimatePoints.filter((point) => point?.id && point.id !== estimatePointId);
  const displayValue = (value: string | undefined) =>
    estimateSystem === EEstimateSystem.TIME ? convertMinutesToHoursMinutesString(Number(value || 0)) : value;
  const selectedOptionValue = selectedEstimatePointId
    ? selectedEstimatePointId === "none"
      ? t("project_settings.estimates.no_estimate")
      : displayValue(replacementOptions.find((option) => option.id === selectedEstimatePointId)?.value)
    : undefined;

  const handleClose = () => {
    setSelectedEstimatePointId(undefined);
    setError(undefined);
    callback();
  };

  const handleDelete = async () => {
    if (!workspaceSlug || !projectId || !estimateId || !estimatePointId) return;

    if (!selectedEstimatePointId) {
      setError("Please select an estimate point");
      return;
    }

    try {
      setLoader(true);
      setError(undefined);

      await deleteEstimatePoint(
        workspaceSlug,
        projectId,
        estimatePointId,
        selectedEstimatePointId === "none" ? undefined : selectedEstimatePointId
      );

      setLoader(false);
      handleEstimatePointError?.("", undefined, "delete");
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("project_settings.estimates.toasts.updated.success.title"),
        message: t("project_settings.estimates.toasts.updated.success.message"),
      });
      handleClose();
    } catch {
      setLoader(false);
      setError(t("project_settings.estimates.validation.unable_to_process"));
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("project_settings.estimates.toasts.updated.error.title"),
        message: t("project_settings.estimates.toasts.updated.error.message"),
      });
    }
  };

  return (
    <div className="relative flex items-center gap-2 pr-2.5 text-14">
      <div className="relative my-1 flex w-full items-center gap-3">
        <div className="w-full rounded-sm border border-subtle bg-layer-1 px-3 py-2 text-13">
          {displayValue(estimatePoint?.value)}
        </div>
        <div className="relative flex flex-shrink-0 items-center justify-center gap-2 text-13 whitespace-nowrap text-secondary">
          Mark as <MoveRight size={14} />
        </div>
        <CustomSelect
          value={selectedEstimatePointId}
          onChange={(value: string) => {
            setSelectedEstimatePointId(value);
            setError(undefined);
          }}
          label={selectedOptionValue || <span className="text-placeholder">Select an estimate point</span>}
          className="w-full"
          buttonClassName={cn("rounded-sm", error ? "border-danger-strong" : "border-subtle")}
          input
        >
          <CustomSelect.Option value="none">{t("project_settings.estimates.no_estimate")}</CustomSelect.Option>
          {replacementOptions.map((option) => (
            <CustomSelect.Option key={option.id} value={option.id}>
              {displayValue(option.value)}
            </CustomSelect.Option>
          ))}
        </CustomSelect>
        {error && (
          <Tooltip tooltipContent={error} position="bottom">
            <div className="relative flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center overflow-hidden text-danger-primary">
              <Info size={14} />
            </div>
          </Tooltip>
        )}
      </div>

      <button
        type="button"
        className="relative flex h-6 w-6 flex-shrink-0 cursor-pointer items-center justify-center rounded-xs text-danger-primary transition-colors hover:bg-layer-1"
        onClick={handleDelete}
        disabled={loader}
      >
        {loader ? <Spinner className="h-4 w-4" /> : <TrashIcon width={14} height={14} />}
      </button>
      <button
        type="button"
        className="relative flex h-6 w-6 flex-shrink-0 cursor-pointer items-center justify-center rounded-xs transition-colors hover:bg-layer-1"
        onClick={handleClose}
        disabled={loader}
      >
        <CloseIcon height={14} width={14} className="text-secondary" />
      </button>
    </div>
  );
});
