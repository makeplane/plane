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
import { useParams } from "next/navigation";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";
// local imports
import type { TWorkItemStateOptionProps } from "./types";
import { WorkItemStateOptionWithoutWorkflow } from "./without-workflow";
import { WorkItemStateOptionWithWorkflow } from "./with-workflow";

export const WorkItemStateOption = observer(function WorkItemStateOption(props: TWorkItemStateOptionProps) {
  const { projectId, alwaysAllowStateChange = false } = props;
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { getIsWorkflowEnabled } = useProjectState();
  // derived values
  const isWorkflowEnabled = getIsWorkflowEnabled(workspaceSlug.toString(), projectId);

  if (!isWorkflowEnabled || alwaysAllowStateChange) {
    return <WorkItemStateOptionWithoutWorkflow {...props} />;
  }

  return <WorkItemStateOptionWithWorkflow {...props} />;
});
