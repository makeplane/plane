import React, { useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { mutate } from "swr";
// hooks
import { useIssues, useModule } from "hooks/store";
// ui
import { CustomSearchSelect, DiceIcon, Spinner, Tooltip } from "@plane/ui";
// types
import { TIssue } from "@plane/types";
// fetch-keys
import { ISSUE_DETAILS, MODULE_ISSUES } from "constants/fetch-keys";
import { EIssuesStoreType } from "constants/issue";

type Props = {
  issueDetail: TIssue | undefined;
  handleModuleChange?: (moduleId: string) => void;
  disabled?: boolean;
  handleIssueUpdate?: () => void;
};

export const SidebarModuleSelect: React.FC<Props> = observer((props) => {
  const { issueDetail, disabled = false, handleIssueUpdate, handleModuleChange } = props;
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // mobx store
  const {
    issues: { removeIssueFromModule, addIssueToModule },
  } = useIssues(EIssuesStoreType.MODULE);
  const { projectModuleIds, getModuleById } = useModule();

  const [isUpdating, setIsUpdating] = useState(false);

  const handleModuleStoreChange = async (moduleId: string) => {
    if (!workspaceSlug || !issueDetail || !moduleId || !projectId) return;

    setIsUpdating(true);
    await addIssueToModule(workspaceSlug.toString(), projectId?.toString(), moduleId, [issueDetail.id])
      .then(async () => {
        handleIssueUpdate && (await handleIssueUpdate());
      })
      .finally(() => {
        setIsUpdating(false);
      });
  };

  const handleRemoveIssueFromModule = (bridgeId: string, moduleId: string) => {
    if (!workspaceSlug || !projectId || !issueDetail) return;

    setIsUpdating(true);
    removeIssueFromModule(workspaceSlug.toString(), projectId.toString(), moduleId, issueDetail.id)
      .then(async () => {
        handleIssueUpdate && (await handleIssueUpdate());
        mutate(ISSUE_DETAILS(issueDetail.id));

        mutate(MODULE_ISSUES(moduleId));
      })
      .catch((e) => {
        console.error(e);
      })
      .finally(() => {
        setIsUpdating(false);
      });
  };

  const options = projectModuleIds?.map((moduleId) => {
    const moduleDetail = getModuleById(moduleId);
    return {
      value: moduleId,
      query: moduleDetail?.name ?? "",
      content: (
        <div className="flex items-center gap-1.5 truncate">
          <span className="flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center">
            <DiceIcon />
          </span>
          <span className="flex-grow truncate">{moduleDetail?.name}</span>
        </div>
      ),
    };
  });

  // derived values
  const issueModule = issueDetail?.issue_module;
  const selectedModule = issueModule?.module ? getModuleById(issueModule?.module) : null;
  const disableSelect = disabled || isUpdating;

  return (
    <div className="flex items-center gap-1">
      <CustomSearchSelect
        value={issueModule?.module_detail.id}
        onChange={(value: any) => {
          value === issueModule?.module_detail.id
            ? handleRemoveIssueFromModule(issueModule?.id ?? "", issueModule?.module ?? "")
            : handleModuleChange
            ? handleModuleChange(value)
            : handleModuleStoreChange(value);
        }}
        options={options}
        customButton={
          <div>
            <Tooltip position="left" tooltipContent={`${selectedModule?.name ?? "No module"}`}>
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
                  <span className="truncate">{selectedModule?.name ?? "No module"}</span>
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
