/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
// components
import { CycleSelect } from "@/components/dropdowns/cycle/cycle-select";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// types
import type { TIssueOperations } from "./root";

type TIssueCycleSelect = {
  className?: string;
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueOperations: TIssueOperations;
  disabled?: boolean;
  /** Adds a "No cycle" row that clears the selection. Defaults to `true`. */
  clearable?: boolean;
  /** Label for the clear row. Defaults to `t("cycle.no_cycle")`. */
  clearLabel?: string;
};

export const IssueCycleSelect = observer(function IssueCycleSelect(props: TIssueCycleSelect) {
  const {
    className = "",
    workspaceSlug,
    projectId,
    issueId,
    issueOperations,
    disabled = false,
    clearable = true,
    clearLabel,
  } = props;
  const { t } = useTranslation();
  // states
  const [isUpdating, setIsUpdating] = useState(false);
  // store hooks
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  // derived values
  const issue = getIssueById(issueId);
  const disableSelect = disabled || isUpdating;

  const handleIssueCycleChange = useCallback(
    async (cycleId: string | null) => {
      if (!issue || issue.cycle_id === cycleId) return;
      setIsUpdating(true);
      if (cycleId) await issueOperations.addCycleToIssue?.(workspaceSlug, projectId, cycleId, issueId);
      else await issueOperations.removeIssueFromCycle?.(workspaceSlug, projectId, issue.cycle_id ?? "", issueId);
      setIsUpdating(false);
    },
    [issue, issueOperations, workspaceSlug, projectId, issueId]
  );

  return (
    <div className={cn("flex h-full w-full grow items-center gap-1", className)}>
      <CycleSelect
        projectId={projectId}
        value={issue?.cycle_id ?? null}
        onChange={handleIssueCycleChange}
        disabled={disableSelect}
        variant="select-ghost-md"
        placeholder={t("cycle.no_cycle")}
        tooltip
        clearable={clearable}
        clearLabel={clearLabel}
      />
    </div>
  );
});
