import React, { ReactNode, useState } from "react";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
// hooks
import { useModule, useIssueDetail } from "hooks/store";
// ui
import { CustomSearchSelect, DiceIcon, Spinner, Tooltip } from "@plane/ui";
// types
import type { TIssueOperations } from "./root";

type TIssueModuleSelect = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueOperations: TIssueOperations;
  disabled?: boolean;
};

export const IssueModuleSelect: React.FC<TIssueModuleSelect> = observer((props) => {
  const { workspaceSlug, projectId, issueId, issueOperations, disabled = false } = props;
  // hooks
  const { getModuleById, projectModuleIds, fetchModules } = useModule();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  // state
  const [isUpdating, setIsUpdating] = useState(false);

  useSWR(workspaceSlug && projectId ? `PROJECT_${projectId}_ISSUE_${issueId}_MODULES` : null, async () => {
    if (workspaceSlug && projectId) await fetchModules(workspaceSlug, projectId);
  });

  const issue = getIssueById(issueId);
  const issueModule = (issue && issue.module_id && getModuleById(issue.module_id)) || undefined;
  const disableSelect = disabled || isUpdating;

  const handleIssueModuleChange = async (moduleId: string) => {
    if (!moduleId) return;
    setIsUpdating(true);
    if (issue && issue.module_id === moduleId)
      await issueOperations.removeIssueFromModule(workspaceSlug, projectId, moduleId, issueId);
    else await issueOperations.addIssueToModule(workspaceSlug, projectId, moduleId, [issueId]);
    setIsUpdating(false);
  };

  type TDropdownOptions = { value: string; query: string; content: ReactNode }[];
  const options: TDropdownOptions | undefined = projectModuleIds
    ? (projectModuleIds
        .map((moduleId) => {
          const _module = getModuleById(moduleId);
          if (!_module) return undefined;

          return {
            value: _module.id,
            query: _module.name,
            content: (
              <div className="flex items-center gap-1.5 truncate">
                <span className="flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center">
                  <DiceIcon />
                </span>
                <span className="flex-grow truncate">{_module.name}</span>
              </div>
            ) as ReactNode,
          };
        })
        .filter((_module) => _module !== undefined) as TDropdownOptions)
    : undefined;

  return (
    <div className="flex items-center gap-1">
      <CustomSearchSelect
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
        width="max-w-[10rem]"
        noChevron
        disabled={disableSelect}
      />
      {isUpdating && <Spinner className="h-4 w-4" />}
    </div>
  );
});
