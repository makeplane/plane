import React, { useState } from "react";
import xor from "lodash/xor";
import { observer } from "mobx-react";
// hooks
// components
import { ModuleDropdown } from "@/components/dropdowns";
// ui
// helpers
import { cn } from "@/helpers/common.helper";
import { useIssueDetail } from "@/hooks/store";
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

export const IssueModuleSelect: React.FC<TIssueModuleSelect> = observer((props) => {
  const { className = "", workspaceSlug, projectId, issueId, issueOperations, disabled = false } = props;
  // states
  const [isUpdating, setIsUpdating] = useState(false);
  // store hooks
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  // derived values
  const issue = getIssueById(issueId);
  const disableSelect = disabled || isUpdating;

  const handleIssueModuleChange = async (moduleIds: string[]) => {
    if (!issue || !issue.module_ids) return;

    setIsUpdating(true);
    const updatedModuleIds = xor(issue.module_ids, moduleIds);
    const modulesToAdd: string[] = [];
    const modulesToRemove: string[] = [];

    for (const moduleId of updatedModuleIds) {
      if (issue.module_ids.includes(moduleId)) {
        modulesToRemove.push(moduleId);
      } else {
        modulesToAdd.push(moduleId);
      }
    }
    if (modulesToRemove.length > 0)
      await issueOperations.removeModulesFromIssue?.(workspaceSlug, projectId, issueId, modulesToRemove);

    if (modulesToAdd.length > 0)
      await issueOperations.addModulesToIssue?.(workspaceSlug, projectId, issueId, modulesToAdd);

    setIsUpdating(false);
  };

  return (
    <div className={cn(`flex h-full items-center gap-1`, className)}>
      <ModuleDropdown
        projectId={projectId}
        value={issue?.module_ids ?? []}
        onChange={handleIssueModuleChange}
        placeholder="No module"
        disabled={disableSelect}
        className="group h-full w-full"
        buttonContainerClassName="w-full"
        buttonClassName={`min-h-8 text-sm justify-between ${issue?.module_ids?.length ? "" : "text-custom-text-400"}`}
        buttonVariant="transparent-with-text"
        hideIcon
        dropdownArrow
        dropdownArrowClassName="h-3.5 w-3.5 hidden group-hover:inline"
        multiple
      />
    </div>
  );
});
