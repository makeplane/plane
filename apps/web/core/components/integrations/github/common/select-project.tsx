/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { FC } from "react";
import { observer } from "mobx-react";
// components
import { useTranslation } from "@plane/i18n";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { ProjectIcon } from "@plane/propel/icons";
// plane web components
import { Dropdown } from "@/components/importers/ui";
// plane web hooks
import { useGithubIntegration } from "@/plane-web/hooks/store";
// plane web types
import type { TProjectMap } from "@/types/integrations";
// public images

type TSelectProject = {
  value: TProjectMap;
  handleChange: <T extends keyof TProjectMap>(key: T, value: TProjectMap[T]) => void;
  isEnterprise: boolean;
  excludeProjectIds?: string[];
};

export const SelectProject = observer(function SelectProject(props: TSelectProject) {
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
      <div className="text-body-xs-regular text-secondary">Plane Project</div>
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
              <ProjectIcon className="w-4 h-4" />
            )}
          </div>
        )}
        queryExtractor={(option) => option.name}
      />
    </>
  );
});
