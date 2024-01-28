import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import xor from "lodash/xor";
// hooks
import { useIssueDetail } from "hooks/store";
// components
import { ModuleSelectDropdown } from "components/dropdowns";
// ui
import { Spinner } from "@plane/ui";
// helpers
import { cn } from "helpers/common.helper";
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

  const handleIssueModuleChange = async (moduleIds: undefined | string | (string | undefined)[]) => {
    if (!issue) return;

    setIsUpdating(true);
    if (moduleIds === undefined && issue?.module_ids && issue?.module_ids.length > 0)
      await issueOperations.removeModulesFromIssue?.(workspaceSlug, projectId, issueId, issue?.module_ids);

    if (typeof moduleIds === "string" && moduleIds)
      await issueOperations.removeModulesFromIssue?.(workspaceSlug, projectId, issueId, [moduleIds]);

    if (Array.isArray(moduleIds)) {
      if (moduleIds.includes(undefined)) {
        await issueOperations.removeModulesFromIssue?.(
          workspaceSlug,
          projectId,
          issueId,
          moduleIds.filter((x) => x != undefined) as string[]
        );
      } else {
        const _moduleIds = xor(issue?.module_ids, moduleIds)[0];
        if (_moduleIds) {
          if (issue?.module_ids?.includes(_moduleIds))
            await issueOperations.removeModulesFromIssue?.(workspaceSlug, projectId, issueId, [_moduleIds]);
          else await issueOperations.addModulesToIssue?.(workspaceSlug, projectId, issueId, [_moduleIds]);
        }
      }
    }
    setIsUpdating(false);
  };

  return (
    <div className={cn(`flex items-center gap-1 h-full`, className)}>
      <ModuleSelectDropdown
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        value={issue?.module_ids?.length ? issue?.module_ids : undefined}
        onChange={handleIssueModuleChange}
        multiple={true}
        placeholder="No module"
        disabled={disableSelect}
        className={`w-full h-full group`}
        buttonContainerClassName="w-full"
        buttonClassName={`min-h-8 ${issue?.module_ids?.length ? `` : `text-custom-text-400`}`}
        buttonVariant="transparent-with-text"
        hideIcon={false}
        dropdownArrow={true}
        dropdownArrowClassName="h-3.5 w-3.5 hidden group-hover:inline"
        showTooltip={true}
      />

      {isUpdating && <Spinner className="h-4 w-4" />}
    </div>
  );
});
