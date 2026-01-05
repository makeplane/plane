import React, { useState } from "react";
import { xor } from "lodash-es";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
// hooks
// components
import { cn } from "@plane/utils";
import { ModuleDropdown } from "@/components/dropdowns/module/dropdown";
// ui
// helpers
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

export const IssueModuleSelect = observer(function IssueModuleSelect(props: TIssueModuleSelect) {
  const { className = "", workspaceSlug, projectId, issueId, issueOperations, disabled = false } = props;
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

    await issueOperations.changeModulesInIssue?.(workspaceSlug, projectId, issueId, modulesToAdd, modulesToRemove);

    setIsUpdating(false);
  };

  return (
    <div className={cn(`flex h-full items-center gap-1`, className)}>
      <ModuleDropdown
        projectId={projectId}
        value={issue?.module_ids ?? []}
        onChange={handleIssueModuleChange}
        placeholder={t("module.no_module")}
        disabled={disableSelect}
        className="group h-full w-full"
        buttonContainerClassName="w-full text-left rounded-sm"
        buttonClassName={`text-body-xs-medium justify-between ${issue?.module_ids?.length ? "" : "text-placeholder"}`}
        buttonVariant="transparent-with-text"
        hideIcon
        dropdownArrow
        dropdownArrowClassName="h-3.5 w-3.5 hidden group-hover:inline"
        multiple
        itemClassName="px-2"
      />
    </div>
  );
});
