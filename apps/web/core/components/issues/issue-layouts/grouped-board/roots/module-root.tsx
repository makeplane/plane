/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EIssuesStoreType } from "@plane/types";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
// local imports
import { ModuleIssueQuickActions } from "../../quick-action-dropdowns";
import { BaseGroupedBoardRoot } from "../base-grouped-board-root";

export const ModuleGroupedBoardLayout = observer(function ModuleGroupedBoardLayout() {
  const { workspaceSlug, projectId, moduleId } = useParams();

  // store
  const { issues } = useIssues(EIssuesStoreType.MODULE);

  return (
    <BaseGroupedBoardRoot
      QuickActions={ModuleIssueQuickActions}
      addIssuesToView={(issueIds: string[]) => {
        if (!workspaceSlug || !projectId || !moduleId) throw new Error();
        return issues.addIssuesToModule(workspaceSlug.toString(), projectId.toString(), moduleId.toString(), issueIds);
      }}
      viewId={moduleId?.toString()}
    />
  );
});
