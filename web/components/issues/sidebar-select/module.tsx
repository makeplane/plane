import React from "react";
import { useRouter } from "next/router";
import useSWR, { mutate } from "swr";
// services
import { ModuleService } from "services/module.service";
// ui
import { CustomSearchSelect, DiceIcon, Tooltip } from "@plane/ui";
// types
import { IIssue } from "types";
// fetch-keys
import { ISSUE_DETAILS, MODULE_ISSUES, MODULE_LIST } from "constants/fetch-keys";

type Props = {
  issueDetail: IIssue | undefined;
  handleModuleChange: (moduleId: string) => void;
  disabled?: boolean;
};

const moduleService = new ModuleService();

export const SidebarModuleSelect: React.FC<Props> = ({ issueDetail, handleModuleChange, disabled = false }) => {
  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;

  const { data: modules } = useSWR(
    workspaceSlug && projectId ? MODULE_LIST(projectId as string) : null,
    workspaceSlug && projectId ? () => moduleService.getModules(workspaceSlug as string, projectId as string) : null
  );

  const removeIssueFromModule = (bridgeId: string, moduleId: string) => {
    if (!workspaceSlug || !projectId) return;

    moduleService
      .removeIssueFromModule(workspaceSlug as string, projectId as string, moduleId, bridgeId)
      .then(() => {
        mutate(ISSUE_DETAILS(issueId as string));

        mutate(MODULE_ISSUES(moduleId));
      })
      .catch((e) => {
        console.log(e);
      });
  };

  const options = modules?.map((module) => ({
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

  return (
    <CustomSearchSelect
      value={issueModule?.module_detail.id}
      onChange={(value: any) => {
        value === issueModule?.module_detail.id
          ? removeIssueFromModule(issueModule?.id ?? "", issueModule?.module ?? "")
          : handleModuleChange(value);
      }}
      options={options}
      customButton={
        <div>
          <Tooltip
            position="left"
            tooltipContent={`${modules?.find((m) => m.id === issueModule?.module)?.name ?? "No module"}`}
          >
            <button
              type="button"
              className={`bg-custom-background-80 text-xs rounded px-2.5 py-0.5 w-full flex ${
                disabled ? "cursor-not-allowed" : ""
              }`}
            >
              <span
                className={`flex items-center gap-1.5 truncate ${
                  issueModule ? "text-custom-text-100" : "text-custom-text-200"
                }`}
              >
                {issueModule && <DiceIcon className="h-3.5 w-3.5" />}
                {modules?.find((m) => m.id === issueModule?.module)?.name ?? "No module"}
              </span>
            </button>
          </Tooltip>
        </div>
      }
      width="max-w-[10rem]"
      noChevron
      disabled={disabled}
    />
  );
};
