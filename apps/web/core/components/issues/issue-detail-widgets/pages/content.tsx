/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import type { TIssueServiceType } from "@plane/types";
// helper
import { usePageOperations } from "./helper";
// components
import { IssuePagesList } from "./list";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
  issueServiceType: TIssueServiceType;
};

export function IssuePagesCollapsibleContent(props: Props) {
  const { workspaceSlug, projectId, issueId, disabled, issueServiceType } = props;

  // helper
  const pageOperations = usePageOperations(workspaceSlug, projectId, issueId, issueServiceType);

  return (
    <IssuePagesList
      workspaceSlug={workspaceSlug}
      projectId={projectId}
      issueId={issueId}
      pageOperations={pageOperations}
      disabled={disabled}
      issueServiceType={issueServiceType}
    />
  );
}
