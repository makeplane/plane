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

import { observer } from "mobx-react";
import { MoveRight } from "lucide-react";
import { InfoIcon } from "@plane/propel/icons";
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
import type { TEstimatePointsObject, TEstimateSystemKeys, TEstimateTypeErrorObject } from "@plane/types";
import { cn, convertMinutesToHoursMinutesString } from "@plane/utils";
import { EstimateInputRoot } from "@/components/estimates/inputs/root";
// helpers
// hooks
import { useEstimatePoint } from "@/hooks/store/estimates";
// plane web constants
import { EEstimateSystem, MAX_ESTIMATE_POINT_INPUT_LENGTH } from "@/constants/estimates";

type TEstimatePointItemSwitchPreview = {
  estimateId: string;
  estimateSystemSwitchType: TEstimateSystemKeys;
  estimatePointId: string | undefined;
  estimatePoint: TEstimatePointsObject;
  handleEstimatePoint: (value: string) => void;
  estimatePointError?: TEstimateTypeErrorObject | undefined;
  estimateType?: TEstimateSystemKeys;
};

export const EstimatePointItemSwitchPreview = observer(function EstimatePointItemSwitchPreview(
  props: TEstimatePointItemSwitchPreview
) {
  const {
    estimateId,
    estimateSystemSwitchType,
    estimatePointId,
    estimatePoint: currentEstimatePoint,
    handleEstimatePoint,
    estimatePointError,
    estimateType,
  } = props;
  // hooks
  const { asJson: estimatePoint } = useEstimatePoint(estimateId, estimatePointId);

  const handleEstimatePointUpdate = (value: string) => {
    if (value.length <= MAX_ESTIMATE_POINT_INPUT_LENGTH) {
      handleEstimatePoint(value);
    }
  };

  if (!estimatePoint) return <></>;
  return (
    <div className="relative flex items-center gap-2">
      <div className="w-full border border-subtle-1 rounded-sm px-3 py-2 bg-layer-1 text-13">
        {estimateType === EEstimateSystem.TIME
          ? convertMinutesToHoursMinutesString(Number(estimatePoint?.value))
          : estimatePoint?.value}
      </div>
      <div className="flex-shrink-0 w-4 h-4 relative flex justify-center items-center">
        <MoveRight size={12} />
      </div>
      <div
        className={cn(
          "relative w-full border rounded-sm flex items-center",
          estimatePointError?.message ? `border-danger-strong` : `border-subtle-1`
        )}
      >
        <EstimateInputRoot
          estimateType={estimateSystemSwitchType}
          handleEstimateInputValue={handleEstimatePointUpdate}
          value={currentEstimatePoint?.value}
        />
        {estimatePointError?.message && (
          <>
            <Tooltip tooltipContent={estimatePointError?.message} position="bottom">
              <div className="flex-shrink-0 w-3.5 h-3.5 overflow-hidden mr-3 relative flex justify-center items-center text-danger-primary">
                <InfoIcon height={14} width={14} />
              </div>
            </Tooltip>
          </>
        )}
      </div>
    </div>
  );
});
