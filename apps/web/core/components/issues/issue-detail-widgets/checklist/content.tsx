/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import type { TIssueServiceType } from "@plane/types";
// components
import { ChecklistList } from "../../issue-detail/checklist";
// helper
import { useChecklistOperations } from "./helper";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
  issueServiceType: TIssueServiceType;
};

export function ChecklistCollapsibleContent(props: Props) {
  const { workspaceSlug, projectId, issueId, disabled, issueServiceType } = props;

  // helper
  const checklistOperations = useChecklistOperations(workspaceSlug, projectId, issueId, issueServiceType);

  return (
    <ChecklistList
      issueId={issueId}
      checklistOperations={checklistOperations}
      disabled={disabled}
      issueServiceType={issueServiceType}
    />
  );
}
