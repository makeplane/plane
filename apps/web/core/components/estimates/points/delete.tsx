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

import { useState } from "react";
import { observer } from "mobx-react";
import { MoveRight } from "lucide-react";
import { TrashIcon, CloseIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TEstimatePointsObject, TEstimateSystemKeys, TEstimateTypeErrorObject } from "@plane/types";
import { EEstimateSystem } from "@plane/types";
import { Spinner } from "@plane/ui";
// ce imports
import { convertMinutesToHoursMinutesString } from "@plane/utils";
// hooks
import { useEstimate, useEstimatePoint } from "@/hooks/store/estimates";
// plane web components
import { EstimatePointDropdown } from "./select-dropdown";
// plane web constants
import { estimateCount } from "@/constants/estimates";

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
    estimatePointError,
    handleEstimatePointError,
    estimateSystem,
  } = props;
  // hooks
  const { estimatePointIds, estimatePointById, deleteEstimatePoint } = useEstimate(estimateId);
  const { asJson: estimatePoint } = useEstimatePoint(estimateId, estimatePointId);
  // states
  const [loader, setLoader] = useState(false);
  const [estimateInputValue, setEstimateInputValue] = useState<string | undefined>(undefined);

  const handleClose = () => {
    setEstimateInputValue("");
    handleEstimatePointError?.(estimateId, undefined, "delete");
    callback();
  };

  const handleDelete = async () => {
    if (!workspaceSlug || !projectId || !projectId) return;

    if (estimatePoints.length <= estimateCount.min) {
      setToast({
        type: TOAST_TYPE.WARNING,
        title: "Estimate can't be deleted",
        message: `Estimate must have at least ${estimateCount.min} points.`,
      });
      return;
    }

    handleEstimatePointError?.(estimateId, undefined, "delete");

    if (estimateInputValue)
      try {
        setLoader(true);

        await deleteEstimatePoint(
          workspaceSlug,
          projectId,
          estimatePointId,
          estimateInputValue === "none" ? undefined : estimateInputValue
        );

        setLoader(false);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Estimate point updated",
          message: "The estimate point has been updated successfully.",
        });
        handleClose();
      } catch {
        setLoader(false);
        // handleEstimatePointError &&
        //   handleEstimatePointError(estimateId, "something went wrong. please try again later");
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Estimate point failed to updated",
          message: "We are unable to process your request, please try again.",
        });
      }
    else handleEstimatePointError?.(estimateId, "please select option");
  };

  // derived values
  const selectDropdownOptionIds = estimatePointIds?.filter((pointId) => pointId != estimatePointId) as string[];
  const selectDropdownOptions = (selectDropdownOptionIds || [])
    ?.map((pointId) => {
      const estimatePoint = estimatePointById(pointId);
      if (estimatePoint && estimatePoint?.id)
        return { id: estimatePoint.id, key: estimatePoint.key, value: estimatePoint.value };
    })
    .filter((estimatePoint) => estimatePoint != undefined) as TEstimatePointsObject[];

  return (
    <div className="relative flex items-center gap-2 text-14 pr-2.5">
      <div className="flex-grow relative flex items-center gap-3">
        <div className="w-full border border-subtle-1 rounded-sm px-3 py-2 bg-layer-1 text-13">
          {estimateSystem === EEstimateSystem.TIME
            ? convertMinutesToHoursMinutesString(Number(estimatePoint?.value))
            : estimatePoint?.value}
        </div>
        <div className="text-13 first-letter:relative flex justify-center items-center gap-2 whitespace-nowrap">
          Mark as <MoveRight size={14} />
        </div>
        <EstimatePointDropdown
          options={selectDropdownOptions}
          estimateSystem={estimateSystem}
          error={estimatePointError?.message ? "Continue or discard the estimate point delete operation." : undefined}
          callback={(estimateId: string) => {
            setEstimateInputValue(estimateId);
            handleEstimatePointError?.(estimateId, undefined);
          }}
        />
      </div>
      {loader ? (
        <div className="w-6 h-6 flex-shrink-0 relative flex justify-center items-center rota">
          <Spinner className="w-4 h-4" />
        </div>
      ) : (
        <div
          className="rounded-sm w-6 h-6 flex-shrink-0 relative flex justify-center items-center hover:bg-layer-1 transition-colors cursor-pointer text-danger-primary"
          onClick={handleDelete}
        >
          <TrashIcon width={14} height={14} />
        </div>
      )}
      <div
        className="rounded-sm w-6 h-6 flex-shrink-0 relative flex justify-center items-center hover:bg-layer-1 transition-colors cursor-pointer"
        onClick={handleClose}
      >
        <CloseIcon height={14} width={14} className="text-secondary" />
      </div>
    </div>
  );
});
