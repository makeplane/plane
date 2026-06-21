/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import type { TIssue } from "@plane/types";
import { WorkspaceSprintDropdown } from "@/components/dropdowns/workspace-sprint";
import { useWorkspaceSprint } from "@/hooks/store/use-workspace-sprint";

type Props = {
  issue: TIssue;
  disabled: boolean;
};

export const SpreadsheetSprintColumn = observer(function SpreadsheetSprintColumn(props: Props) {
  const { issue, disabled } = props;
  const { workspaceSlug } = useParams();
  const { addIssueToSprint, removeIssueFromSprint } = useWorkspaceSprint();

  const handleSprint = useCallback(
    async (sprintId: string | null) => {
      if (!workspaceSlug || !issue || issue.global_sprint_id === sprintId) return;
      if (sprintId) await addIssueToSprint(workspaceSlug.toString(), sprintId, issue.id);
      else if (issue.global_sprint_id)
        await removeIssueFromSprint(workspaceSlug.toString(), issue.global_sprint_id, issue.id);
    },
    [workspaceSlug, issue, addIssueToSprint, removeIssueFromSprint]
  );

  return (
    <div className="flex h-11 items-center border-b-[0.5px] border-subtle px-page-x">
      <WorkspaceSprintDropdown
        value={issue.global_sprint_id}
        onChange={handleSprint}
        disabled={disabled}
        className="h-7 w-full max-w-full border-0 bg-transparent px-0 hover:bg-transparent"
        fallbackName={issue.global_sprint_name}
      />
    </div>
  );
});
