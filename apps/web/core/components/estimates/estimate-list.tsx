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
// local imports
import { EstimateListItem } from "./estimate-list-item";

type TEstimateList = {
  estimateIds: string[] | undefined;
  isEstimateEnabled?: boolean;
  isEditable?: boolean;
  onEditClick?: (estimateId: string) => void;
  onDeleteClick?: (estimateId: string) => void;
};

export const EstimateList = observer(function EstimateList(props: TEstimateList) {
  const { estimateIds, isEstimateEnabled = false, isEditable = false, onEditClick, onDeleteClick } = props;

  if (!estimateIds || estimateIds?.length <= 0) return <></>;
  return (
    <div>
      {estimateIds.map((estimateId) => (
        <EstimateListItem
          key={estimateId}
          estimateId={estimateId}
          isEstimateEnabled={isEstimateEnabled}
          isEditable={isEditable}
          onEditClick={onEditClick}
          onDeleteClick={onDeleteClick}
        />
      ))}
    </div>
  );
});
