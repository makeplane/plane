/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { FC } from "react";
import { observer } from "mobx-react";
// local imports
import { EstimateListItem } from "./estimate-list-item";

type TEstimateList = {
  estimateIds: string[] | undefined;
  isAdmin: boolean;
  isEstimateEnabled?: boolean;
  isEditable?: boolean;
  onEditClick?: (estimateId: string) => void;
  onDeleteClick?: (estimateId: string) => void;
};

export const EstimateList = observer(function EstimateList(props: TEstimateList) {
  const { estimateIds, isAdmin, isEstimateEnabled = false, isEditable = false, onEditClick, onDeleteClick } = props;

  if (!estimateIds || estimateIds?.length <= 0) return <></>;
  return (
    <div>
      {estimateIds &&
        estimateIds.map((estimateId) => (
          <EstimateListItem
            key={estimateId}
            estimateId={estimateId}
            isAdmin={isAdmin}
            isEstimateEnabled={isEstimateEnabled}
            isEditable={isEditable}
            onEditClick={onEditClick}
            onDeleteClick={onDeleteClick}
          />
        ))}
    </div>
  );
});
