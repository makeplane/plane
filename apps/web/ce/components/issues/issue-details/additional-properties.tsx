/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import type { TIssueOperations } from "@/components/issues/issue-detail/root";
import { WorkItemCustomFields } from "@/plane-web/components/issues/custom-fields/work-item-custom-fields";

export type TWorkItemAdditionalSidebarProperties = {
  workItemId: string;
  workItemTypeId: string | null;
  projectId: string;
  workspaceSlug: string;
  isEditable: boolean;
  isPeekView?: boolean;
  issueOperations?: TIssueOperations;
};

export const WorkItemAdditionalSidebarProperties = observer(function WorkItemAdditionalSidebarProperties(
  props: TWorkItemAdditionalSidebarProperties
) {
  const { workItemId, projectId, workspaceSlug, isEditable, issueOperations } = props;

  return (
    <WorkItemCustomFields
      workspaceSlug={workspaceSlug}
      projectId={projectId}
      issueId={workItemId}
      isEditable={isEditable}
      issueOperations={issueOperations}
    />
  );
});
