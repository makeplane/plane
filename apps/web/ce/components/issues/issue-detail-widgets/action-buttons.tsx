/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane types
import type { TIssueServiceType, TWorkItemWidgets } from "@plane/types";
import { LogTimeActionButton } from "@/plane-web/components/issues/worklog/log-time-action-button";

export type TWorkItemAdditionalWidgetActionButtonsProps = {
  disabled: boolean;
  hideWidgets: TWorkItemWidgets[];
  issueServiceType: TIssueServiceType;
  projectId: string;
  workItemId: string;
  workspaceSlug: string;
};

export function WorkItemAdditionalWidgetActionButtons(props: TWorkItemAdditionalWidgetActionButtonsProps) {
  const { disabled, projectId, workItemId, workspaceSlug } = props;
  return (
    <LogTimeActionButton workspaceSlug={workspaceSlug} projectId={projectId} issueId={workItemId} disabled={disabled} />
  );
}
