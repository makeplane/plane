"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import { Briefcase } from "lucide-react";
// components
import { Logo } from "@/components/common";
// plane web components
import { Dropdown } from "@/plane-web/components/importers/ui";
// plane web hooks
import { useGitlabIntegration } from "@/plane-web/hooks/store";
// plane web types
import { TProjectMap } from "@/plane-web/types/integrations";
import { useTranslation } from "@plane/i18n";
import { EConnectionType } from "@plane/etl/gitlab";
// public images

type TProjectForm = {
  value: TProjectMap;
  handleChange: <T extends keyof TProjectMap>(key: T, value: TProjectMap[T]) => void;
};

export const ProjectForm: FC<TProjectForm> = observer((props) => {
  // props
  const { value, handleChange } = props;

  // hooks
  const {
    workspace,
    projectIdsByWorkspaceSlug,
    getProjectById,
    entityConnection: { entityConnectionIds, entityConnectionById }
  } = useGitlabIntegration();
  const { t } = useTranslation();

  // derived values
  const workspaceSlug = workspace?.slug || undefined;

  // existing connections
  const entityConnections = entityConnectionIds.map((id) => {
    const entityConnection = entityConnectionById(id);
    if (!entityConnection || entityConnection.type !== EConnectionType.PLANE_PROJECT) {
      return;
    }
    return entityConnection;
  });

  const connectedProjects = entityConnections.map((entityConnection) => entityConnection?.project_id);


  const planeProjectIds = (workspaceSlug && projectIdsByWorkspaceSlug(workspaceSlug)) || [];
  const planeProjects = planeProjectIds
    .map((id) => (id && getProjectById(id)) || undefined)
    .filter((project) => project !== undefined && project !== null && !connectedProjects.includes(project.id));

  return (
    <div className="relative space-y-4 text-sm">
      <div className="space-y-1">
        <div className="text-custom-text-200">Plane {t("common.project")}</div>
        <Dropdown
          dropdownOptions={(planeProjects || [])?.map((project) => ({
            key: project?.id || "",
            label: project?.name || "",
            value: project?.id || "",
            data: project,
          }))}
          value={value?.projectId || undefined}
          placeHolder={t("gitlab_integration.choose_project")}
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
      </div>
    </div>
  );
});
