/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
// components
import { ModuleSelect } from "@/components/dropdowns/module/module-select";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// types
import type { TIssueOperations } from "./root";

type TIssueModuleSelect = {
  className?: string;
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueOperations: TIssueOperations;
  disabled?: boolean;
};

/**
 * Issue-detail sidebar binding — diffs the selection into add/remove ops and serializes them so a
 * second toggle waits for the first to finish (the multi-select stays open across picks).
 */
export const IssueModuleSelect = observer(function IssueModuleSelect(props: TIssueModuleSelect) {
  const { className = "", workspaceSlug, projectId, issueId, issueOperations, disabled = false } = props;
  const { t } = useTranslation();
  // states
  const [isUpdating, setIsUpdating] = useState(false);
  // refs — serialize operations so a second call waits for the first to finish
  const pendingOp = useRef<Promise<void>>(Promise.resolve());
  // store hooks
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  // derived values
  const issue = getIssueById(issueId);
  const moduleIds = issue?.module_ids ?? [];
  const disableSelect = disabled || isUpdating;

  const handleChange = useCallback(
    (newModuleIds: string[]) => {
      setIsUpdating(true);
      pendingOp.current = pendingOp.current
        .then(async () => {
          const current = getIssueById(issueId)?.module_ids ?? [];
          const modulesToAdd = newModuleIds.filter((id) => !current.includes(id));
          const modulesToRemove = current.filter((id) => !newModuleIds.includes(id));
          if (modulesToAdd.length === 0 && modulesToRemove.length === 0) return;
          return await issueOperations.changeModulesInIssue?.(
            workspaceSlug,
            projectId,
            issueId,
            modulesToAdd,
            modulesToRemove
          );
        })
        .finally(() => setIsUpdating(false));
    },
    [getIssueById, issueId, issueOperations, workspaceSlug, projectId]
  );

  return (
    <div className={cn("flex h-full w-full grow items-center gap-1", className)}>
      <ModuleSelect
        multiple
        projectId={projectId}
        value={moduleIds}
        onChange={handleChange}
        disabled={disableSelect}
        variant="select-ghost-md"
        placeholder={t("module.no_module")}
        tooltip
      />
    </div>
  );
});
