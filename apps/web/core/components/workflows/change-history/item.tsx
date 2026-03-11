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
import type { TWorkflowChangeHistory } from "@plane/types";
import { getWorkflowChangeHistoryKey } from "@plane/utils";
import { ActivityBlockComponent } from "@/components/common/activity/activity-block";
import { WORKFLOW_CHANGE_HISTORY_HELPER_MAP } from "./helpers";

type Props = {
  changeHistory: TWorkflowChangeHistory;
  ends: "top" | "bottom" | undefined;
};

export const WorkflowChangeHistoryItem = observer(function WorkflowChangeHistoryItem(props: Props) {
  const { changeHistory, ends } = props;
  if (!changeHistory) return null;

  const key = getWorkflowChangeHistoryKey(changeHistory.field, changeHistory.verb);
  const getDetails = WORKFLOW_CHANGE_HISTORY_HELPER_MAP[key];
  if (!getDetails) return null;

  const { icon, message, customUserName } = getDetails(changeHistory);
  return (
    <ActivityBlockComponent icon={icon} activity={changeHistory} ends={ends} customUserName={customUserName}>
      <>{message}</>
    </ActivityBlockComponent>
  );
});
