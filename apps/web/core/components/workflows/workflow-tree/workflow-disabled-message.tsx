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
import { useWorkflows } from "@/hooks/store/use-workflows";
// local imports
import { WorkflowTree } from "./workflow-tree";

type Props = {
  parentStateId: string;
  destinationStateId?: string;
  typeId?: string | null;
  className?: string;
  compact?: boolean;
  isForWorkItemCreation?: boolean;
  showWorkflowTree?: boolean;
};

export const WorkFlowDisabledMessage = observer(function WorkFlowDisabledMessage(props: Props) {
  const {
    parentStateId,
    destinationStateId,
    typeId,
    className,
    compact = false,
    isForWorkItemCreation = false,
    showWorkflowTree = true,
  } = props;
  // router
  const { workspaceSlug } = useParams();
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getStateById } = useProjectState();
  const { isWorkflowsEnabled } = useWorkflows();
  // derived values
  const parentState = getStateById(parentStateId);
  const destinationState = destinationStateId ? getStateById(destinationStateId) : undefined;
  const projectId = parentState?.project_id;
  if (!workspaceSlug || !projectId) return <></>;
  const isWorkflowEnabled = isWorkflowsEnabled(workspaceSlug.toString(), projectId);

  if (!parentState || !isWorkflowEnabled) return <></>;

  const cannotMoveMessage: React.ReactNode =
    !isForWorkItemCreation && parentState.name && destinationState?.name ? (
      <span className="text-caption-sm-regular">
        This work item cannot be moved from <span className="font-semibold">{parentState.name}</span> to{" "}
        <span className="font-semibold">{destinationState.name}</span>.
      </span>
    ) : (
      <span className="text-caption-sm-medium">{t("workflows.workflow_disabled.title")}</span>
    );

  return (
    <div
      className={cn(
        "relative flex max-w-[320px] flex-col rounded-lg bg-surface-1",
        compact ? "max-h-[240px]" : "max-h-[400px]",
        className
      )}
    >
      <div className="flex items-center gap-1 p-3">
        <CircleStop className="size-3 text-danger-secondary" />
        {isForWorkItemCreation ? (
          <span className="text-11 font-medium">New work items cannot be created in this state.</span>
        ) : !showWorkflowTree ? (
          cannotMoveMessage
        ) : (
          <span className="text-11 font-medium">{t("workflows.workflow_disabled.title")}</span>
        )}
      </div>
      {showWorkflowTree && (
        <div className="w-full min-h-0 overflow-y-auto pb-3 vertical-scrollbar scrollbar-sm">
          <WorkflowTree parentStateId={parentStateId} typeId={typeId} />
        </div>
      )}
    </div>
  );
});
