/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback } from "react";
import { xor } from "lodash-es";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// types
import { useTranslation } from "@plane/i18n";
import type { TIssue } from "@plane/types";
// components
import { ModuleSelect } from "@/components/dropdowns/module/module-select";
// hooks
import { useIssuesStore } from "@/hooks/use-issue-layout-store";

type Props = {
  issue: TIssue;
  onClose: () => void;
  disabled: boolean;
};

export const SpreadsheetModuleColumn = observer(function SpreadsheetModuleColumn(props: Props) {
  const { issue, disabled, onClose } = props;
  // plane hooks
  const { t } = useTranslation();
  // router
  const { workspaceSlug } = useParams();
  // hooks
  const {
    issues: { changeModulesInIssue },
  } = useIssuesStore();

  const handleModule = useCallback(
    async (moduleIds: string[] | null) => {
      if (!workspaceSlug || !issue || !issue.project_id || !issue.module_ids || !moduleIds) return;

      const updatedModuleIds = xor(issue.module_ids, moduleIds);
      const modulesToAdd: string[] = [];
      const modulesToRemove: string[] = [];
      for (const moduleId of updatedModuleIds) {
        if (issue.module_ids.includes(moduleId)) modulesToRemove.push(moduleId);
        else modulesToAdd.push(moduleId);
      }
      changeModulesInIssue(workspaceSlug.toString(), issue.project_id, issue.id, modulesToAdd, modulesToRemove);
    },
    [workspaceSlug, issue, changeModulesInIssue]
  );

  return (
    <div className="h-11 border-b-[0.5px] border-subtle">
      <ModuleSelect
        multiple
        projectId={issue?.project_id ?? undefined}
        value={issue?.module_ids ?? []}
        onChange={handleModule}
        disabled={disabled}
        placeholder={t("issue.property_placeholders.modules")}
        // `.clickable` is what the table's keyboard navigation clicks on Enter / Space in a focused cell.
        className="clickable"
        variant="table-cell"
        onClose={onClose}
        tooltip
      />
    </div>
  );
});
