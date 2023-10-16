import React from "react";
import { useRouter } from "next/router";
import useSWR, { mutate } from "swr";
// services
import { ModuleService } from "services/module.service";
// ui
import { CustomSelect } from "components/ui";
import { Spinner, Tooltip } from "@plane/ui";
// helper
import { truncateText } from "helpers/string.helper";
// types
import { IIssue, IModule } from "types";
// fetch-keys
import { ISSUE_DETAILS, MODULE_ISSUES, MODULE_LIST } from "constants/fetch-keys";

type Props = {
  issueDetail: IIssue | undefined;
  handleModuleChange: (module: IModule) => void;
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

  const issueModule = issueDetail?.issue_module;

  return (
    <CustomSelect
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
              <span className={`truncate ${issueModule ? "text-custom-text-100" : "text-custom-text-200"}`}>
                {modules?.find((m) => m.id === issueModule?.module)?.name ?? "No module"}
              </span>
            </button>
          </Tooltip>
        </div>
      }
      value={issueModule ? issueModule.module_detail?.id : null}
      onChange={(value: any) => {
        !value
          ? removeIssueFromModule(issueModule?.id ?? "", issueModule?.module ?? "")
          : handleModuleChange(modules?.find((m) => m.id === value) as IModule);
      }}
      width="w-full"
      maxHeight="rg"
      disabled={disabled}
    >
      {modules ? (
        modules.length > 0 ? (
          <>
            {modules.map((option) => (
              <CustomSelect.Option key={option.id} value={option.id}>
                <Tooltip position="left-bottom" tooltipContent={option.name}>
                  <span className="w-full truncate">{truncateText(option.name, 25)}</span>
                </Tooltip>
              </CustomSelect.Option>
            ))}
            <CustomSelect.Option value={null}>None</CustomSelect.Option>
          </>
        ) : (
          <div className="text-center">No modules found</div>
        )
      ) : (
        <Spinner />
      )}
    </CustomSelect>
  );
};
