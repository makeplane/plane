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
// public images
import GitlabLogo from "@/public/services/gitlab.svg";

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
    data: { gitlabRepositoryIds, gitlabRepositoryById },
  } = useGitlabIntegration();

  // derived values
  const repositories = (gitlabRepositoryIds || [])
    .map((id) => {
      const repository = gitlabRepositoryById(id);
      return repository || undefined;
    })
    .filter((repo) => repo !== undefined && repo !== null);

  const workspaceSlug = workspace?.slug || undefined;
  const planeProjectIds = (workspaceSlug && projectIdsByWorkspaceSlug(workspaceSlug)) || [];
  const planeProjects = planeProjectIds
    .map((id) => (id && getProjectById(id)) || undefined)
    .filter((project) => project !== undefined && project !== null);

  return (
    <div className="relative space-y-4 text-sm">
      <div className="space-y-1">
        <div className="text-custom-text-200">Gitlab Repository</div>
        <Dropdown
          dropdownOptions={(repositories || [])?.map((repo) => ({
            key: repo?.id.toString() || "",
            label: repo?.name || "",
            value: repo?.id.toString() || "",
            data: repo,
          }))}
          value={value?.entityId || undefined}
          placeHolder="Choose Repository..."
          onChange={(value: string | undefined) => handleChange("entityId", value || undefined)}
          iconExtractor={() => (
            <div className="w-4 h-4 flex-shrink-0 overflow-hidden relative flex justify-center items-center">
              <Image src={GitlabLogo} layout="fill" objectFit="contain" alt="Gitlab Logo" />
            </div>
          )}
          queryExtractor={(option) => option.name}
        />
      </div>

      <div className="space-y-1">
        <div className="text-custom-text-200">Plane Project</div>
        <Dropdown
          dropdownOptions={(planeProjects || [])?.map((project) => ({
            key: project?.id || "",
            label: project?.name || "",
            value: project?.id || "",
            data: project,
          }))}
          value={value?.projectId || undefined}
          placeHolder="Choose Project..."
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
