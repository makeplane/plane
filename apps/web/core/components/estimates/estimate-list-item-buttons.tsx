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
import { Pen } from "lucide-react";

type TEstimateListItem = {
  canEdit: boolean;
  estimateId: string;
  isEditable: boolean;
  isEstimateEnabled: boolean;
  onEditClick?: (estimateId: string) => void;
};

export const EstimateListItemButtons = observer(function EstimateListItemButtons(props: TEstimateListItem) {
  const { canEdit, estimateId, isEditable, onEditClick } = props;

  if (!isEditable || !canEdit) return null;

  return (
    <div className="relative flex items-center gap-1">
      <button
        type="button"
        className="relative shrink-0 w-6 h-6 flex justify-center items-center rounded-sm cursor-pointer transition-colors overflow-hidden hover:bg-layer-1"
        onClick={() => onEditClick?.(estimateId)}
      >
        <Pen size={12} />
      </button>
    </div>
  );
});
