// react
import React, { useState } from "react";

// next
import { useRouter } from "next/router";

// swr
import useSWR, { mutate } from "swr";

// services
import modulesService from "services/modules.service";

// hooks
import useUser from "hooks/use-user";

// fetch keys
import { ISSUE_DETAILS, MODULE_LIST, MODULE_ISSUES } from "constants/fetch-keys";

// icons
import { ChevronDown } from "lucide-react";

// components
import { WebViewModal } from "components/web-view";

// types
import { IModule, IIssueModule } from "types";

type Props = {
  disabled?: boolean;
  value?: IIssueModule | null;
};

export const ModuleSelect: React.FC<Props> = (props) => {
  const { disabled = false, value } = props;

  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;

  const { data: modules } = useSWR(
    workspaceSlug && projectId ? MODULE_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => modulesService.getModules(workspaceSlug as string, projectId as string)
      : null
  );

  const { user } = useUser();

  const handleModuleChange = (moduleDetail: IModule) => {
    if (!workspaceSlug || !projectId || !issueId) return;

    modulesService
      .addIssuesToModule(
        workspaceSlug as string,
        projectId as string,
        moduleDetail.id,
        {
          issues: [issueId.toString()],
        },
        user
      )
      .then(() => {
        mutate(ISSUE_DETAILS(issueId.toString()));
      });
  };

  const removeIssueFromModule = (bridgeId?: string, moduleId?: string) => {
    if (!workspaceSlug || !projectId || !moduleId || !bridgeId) return;

    mutate(
      ISSUE_DETAILS(issueId as string),
      (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          issue_module: null,
        };
      },
      false
    );

    modulesService
      .removeIssueFromModule(workspaceSlug as string, projectId as string, moduleId, bridgeId)
      .then(() => {
        mutate(MODULE_ISSUES(moduleId));
        mutate(ISSUE_DETAILS(issueId as string));
      })
      .catch((e) => {
        console.log(e);
      });
  };

  return (
    <>
      <WebViewModal
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        modalTitle="Select Module"
      >
        <WebViewModal.Options
          options={[
            ...(modules ?? []).map((mod) => ({
              checked: mod.id === value?.module,
              label: mod.name,
              value: mod.id,
              onClick: () => {
                handleModuleChange(mod);
                setIsBottomSheetOpen(false);
              },
            })),
            {
              checked: !value,
              label: "None",
              onClick: () => {
                setIsBottomSheetOpen(false);
                removeIssueFromModule(value?.id, value?.module);
              },
              value: "none",
            },
          ]}
        />
      </WebViewModal>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsBottomSheetOpen(true)}
        className={
          "relative w-full px-2.5 py-0.5 text-base flex justify-between items-center gap-0.5 text-custom-text-100"
        }
      >
        <span className="text-custom-text-200">
          {value?.module_detail?.name ?? "Select module"}
        </span>
        <ChevronDown className="w-4 h-4 text-custom-text-200" />
      </button>
    </>
  );
};
