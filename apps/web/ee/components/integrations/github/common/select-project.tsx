"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { Briefcase } from "lucide-react";
// components
import { useTranslation } from "@plane/i18n";
import { Logo } from "@/components/common/logo";
// plane web components
import { Dropdown } from "@/plane-web/components/importers/ui";
// plane web hooks
import { useGithubIntegration } from "@/plane-web/hooks/store";
// plane web types
import { TProjectMap } from "@/plane-web/types/integrations";
// public images

type TSelectProject = {
  value: TProjectMap;
  handleChange: <T extends keyof TProjectMap>(key: T, value: TProjectMap[T]) => void;
  isEnterprise: boolean;
  excludeProjectIds?: string[];
};

export const SelectProject: FC<TSelectProject> = observer((props) => {
  // props
  const { value, handleChange, isEnterprise, excludeProjectIds } = props;

  // hooks
  const { t } = useTranslation();
  const { workspace, projectIdsByWorkspaceSlug, getProjectById } = useGithubIntegration(isEnterprise);

  // derived values
  const workspaceSlug = workspace?.slug || undefined;
  const planeProjectIds = (workspaceSlug && projectIdsByWorkspaceSlug(workspaceSlug)) || [];
  const planeProjects = planeProjectIds
    .filter((id) => !excludeProjectIds?.includes(id))
    .map((id) => (id && getProjectById(id)) || undefined)
    .filter((project) => project !== undefined && project !== null);

  return (
    <>
      <div className="text-sm text-custom-text-200">Plane Project</div>
      <Dropdown
        dropdownOptions={(planeProjects || [])?.map((project) => ({
          key: project?.id || "",
          label: project?.name || "",
          value: project?.id || "",
          data: project,
        }))}
        value={value?.projectId || undefined}
        placeHolder={t("integrations.choose_project")}
        onChange={(value: string | undefined) => handleChange("projectId", value || undefined)}
        iconExtractor={(option) => (
          <div className="w-4.5 h-4.5 flex-shrink-0 overflow-hidden relative flex justify-center items-center">
            {option && option?.logo_props ? (
              <Logo logo={option?.logo_props} size={14} />
            ) : (
              <Briefcase className="w-4 h-4" />
            )}
          </div>
        )}
        queryExtractor={(option) => option.name}
      />
    </>
  );
});
