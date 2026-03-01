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
// plane imports
import { EEstimateSystem } from "@plane/constants";
import { convertMinutesToHoursMinutesString } from "@plane/utils";
// components
import { SettingsBoxedControlItem } from "@/components/settings/boxed-control-item";
// hooks
import { useProjectEstimates } from "@/hooks/store/estimates";
import { useEstimate } from "@/hooks/store/estimates/use-estimate";
// plane web imports
import { EstimateListItemButtons } from "./estimate-list-item-buttons";

type TEstimateListItem = {
  estimateId: string;
  isAdmin: boolean;
  isEstimateEnabled: boolean;
  isEditable: boolean;
  onEditClick?: (estimateId: string) => void;
  onDeleteClick?: (estimateId: string) => void;
};

export const EstimateListItem = observer(function EstimateListItem(props: TEstimateListItem) {
  const { estimateId } = props;
  // store hooks
  const { estimateById } = useProjectEstimates();
  const { estimatePointIds, estimatePointById } = useEstimate(estimateId);
  const currentEstimate = estimateById(estimateId);
  // derived values
  const estimatePointValues = estimatePointIds?.map((estimatePointId) => {
    const estimatePoint = estimatePointById(estimatePointId);
    if (estimatePoint) return estimatePoint.value;
  });

  if (!currentEstimate) return null;

  return (
    <SettingsBoxedControlItem
      title={currentEstimate.name}
      description={estimatePointValues
        ?.map((estimatePointValue) => {
          if (currentEstimate.type === EEstimateSystem.TIME) {
            return convertMinutesToHoursMinutesString(Number(estimatePointValue));
          }
          return estimatePointValue;
        })
        .join(", ")}
      control={<EstimateListItemButtons {...props} />}
    />
  );
});
