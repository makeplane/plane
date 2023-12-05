import React, { useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { mutate } from "swr";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// ui
import { CustomSearchSelect, DiceIcon, Spinner, Tooltip } from "@plane/ui";
// types
import { IIssue } from "types";
// fetch-keys
import { ISSUE_DETAILS, MODULE_ISSUES } from "constants/fetch-keys";

type Props = {
  issueDetail: IIssue | undefined;
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
    module: { projectModules },
    moduleIssues: { removeIssueFromModule, addIssueToModule },
  } = useMobxStore();

  const [isUpdating, setIsUpdating] = useState(false);

  const handleModuleStoreChange = async (moduleId: string) => {
    if (!workspaceSlug || !issueDetail || !moduleId) return;

    setIsUpdating(true);
    await addIssueToModule(workspaceSlug.toString(), moduleId, [issueDetail.id], false, projectId?.toString())
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
    removeIssueFromModule(workspaceSlug.toString(), projectId.toString(), moduleId, issueDetail.id, bridgeId)
      .then(async () => {
        handleIssueUpdate && (await handleIssueUpdate());
        mutate(ISSUE_DETAILS(issueDetail.id));

        mutate(MODULE_ISSUES(moduleId));
      })
      .catch((e) => {
        console.log(e);
      })
      .finally(() => {
        setIsUpdating(false);
      });
  };

  const options = projectModules?.map((module) => ({
    value: module.id,
    query: module.name,
    content: (
      <div className="flex items-center gap-1.5 truncate">
        <span className="flex justify-center items-center flex-shrink-0 w-3.5 h-3.5">
          <DiceIcon />
        </span>
        <span className="truncate flex-grow">{module.name}</span>
      </div>
    ),
  }));

  const issueModule = issueDetail?.issue_module;

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
            <Tooltip
              position="left"
              tooltipContent={`${projectModules?.find((m) => m.id === issueModule?.module)?.name ?? "No module"}`}
            >
              <button
                type="button"
                className={`bg-custom-background-80 text-xs rounded px-2.5 py-0.5 w-full flex items-center ${
                  disableSelect ? "cursor-not-allowed" : ""
                } max-w-[10rem]`}
              >
                <span
                  className={`flex items-center gap-1.5 truncate ${
                    issueModule ? "text-custom-text-100" : "text-custom-text-200"
                  }`}
                >
                  <span className="flex-shrink-0">{issueModule && <DiceIcon className="h-3.5 w-3.5" />}</span>
                  <span className="truncate">
                    {projectModules?.find((m) => m.id === issueModule?.module)?.name ?? "No module"}
                  </span>
                </span>
              </button>
            </Tooltip>
          </div>
        }
        width="max-w-[10rem]"
        noChevron
        disabled={disableSelect}
      />
      {isUpdating && <Spinner className="w-4 h-4" />}
    </div>
  );
});
