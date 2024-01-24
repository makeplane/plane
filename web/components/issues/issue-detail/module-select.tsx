import React, { useState } from "react";
import { observer } from "mobx-react-lite";
// hooks
import { useIssueDetail } from "hooks/store";
// components
import { ModuleDropdown } from "components/dropdowns";
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

  const handleIssueModuleChange = async (moduleId: string | null) => {
    if (!issue || issue.module_id === moduleId) return;
    setIsUpdating(true);
    if (moduleId) await issueOperations.addIssueToModule(workspaceSlug, projectId, moduleId, [issueId]);
    else await issueOperations.removeIssueFromModule(workspaceSlug, projectId, issue.module_id ?? "", issueId);
    setIsUpdating(false);
  };

  return (
    <div className={cn("flex items-center gap-1 h-full", className)}>
      <ModuleDropdown
        value={issue?.module_id ?? null}
        onChange={handleIssueModuleChange}
        buttonVariant="transparent-with-text"
        projectId={projectId}
        disabled={disableSelect}
        className="w-full group"
        buttonContainerClassName="w-full text-left"
        buttonClassName={`text-sm ${issue?.module_id ? "" : "text-custom-text-400"}`}
        placeholder="No module"
        hideIcon
        dropdownArrow
        dropdownArrowClassName="h-3.5 w-3.5 hidden group-hover:inline"
      />
      {/* <CustomSearchSelect
        value={issue?.module_id}
        onChange={(value: any) => handleIssueModuleChange(value)}
        options={options}
        customButton={
          <div>
            <Tooltip position="left" tooltipContent={`${issueModule?.name ?? "No module"}`}>
              <button
                type="button"
                className={`flex w-full items-center rounded bg-custom-background-80 px-2.5 py-0.5 text-xs ${
                  disableSelect ? "cursor-not-allowed" : ""
                } max-w-[10rem]`}
              >
                <span
                  className={`flex items-center gap-1.5 truncate ${
                    issueModule ? "text-custom-text-100" : "text-custom-text-200"
                  }`}
                >
                  <span className="flex-shrink-0">{issueModule && <DiceIcon className="h-3.5 w-3.5" />}</span>
                  <span className="truncate">{issueModule?.name ?? "No module"}</span>
                </span>
              </button>
            </Tooltip>
          </div>
        }
        noChevron
        disabled={disableSelect}
      /> */}
      {isUpdating && <Spinner className="h-4 w-4" />}
    </div>
  );
});
