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
import { CircleStop } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";
// local imports
import { WorkflowTree } from "./workflow-tree";

type Props = {
  parentStateId: string;
  className?: string;
};

export const WorkFlowDisabledMessage = observer(function WorkFlowDisabledMessage(props: Props) {
  const { parentStateId, className } = props;
  // router
  const { workspaceSlug } = useParams();
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getStateById, getIsWorkflowEnabled } = useProjectState();
  // derived values
  const parentState = getStateById(parentStateId);
  const isWorkflowEnabled = getIsWorkflowEnabled(workspaceSlug.toString(), parentState?.project_id);

  if (!parentState || !isWorkflowEnabled) return <></>;

  return (
    <div className={cn("relative w-72 flex flex-col p-3 gap-2 rounded-sm bg-surface-1", className)}>
      <div className="flex gap-1 items-center">
        <CircleStop className="size-3" color="#FA4D56" />
        <span className="text-11 font-medium">{t("workflows.workflow_disabled.title")}</span>
      </div>
      <div className="pl-4">
        <WorkflowTree parentStateId={parentStateId} />
      </div>
    </div>
  );
});
