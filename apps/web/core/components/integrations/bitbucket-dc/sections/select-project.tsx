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

import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { ProjectIcon } from "@plane/propel/icons";
import { Dropdown } from "@/components/importers/ui";
import { useBitbucketDCIntegration } from "@/plane-web/hooks/store";
import type { TProjectMap } from "@/types/integrations";

type TSelectBitbucketProject = {
  value: TProjectMap;
  handleChange: <T extends keyof TProjectMap>(key: T, value: TProjectMap[T]) => void;
  excludeProjectIds?: string[];
};

export const SelectBitbucketProject = observer(function SelectBitbucketProject({
  value,
  handleChange,
  excludeProjectIds,
}: TSelectBitbucketProject) {
  const { t } = useTranslation();
  const { workspace, projectIdsByWorkspaceSlug, getProjectById } = useBitbucketDCIntegration();

  const workspaceSlug = workspace?.slug;
  const planeProjectIds = (workspaceSlug && projectIdsByWorkspaceSlug(workspaceSlug)) || [];
  const planeProjects = planeProjectIds
    .filter((id) => !excludeProjectIds?.includes(id))
    .map((id) => getProjectById(id))
    .filter((p) => p != null);

  return (
    <>
      <div className="text-body-xs-regular text-secondary">Plane Project</div>
      <Dropdown
        dropdownOptions={planeProjects.map((project) => ({
          key: project.id,
          label: project.name,
          value: project.id,
          data: project,
        }))}
        value={value?.projectId}
        placeHolder={t("integrations.choose_project")}
        onChange={(val: string | undefined) => handleChange("projectId", val)}
        iconExtractor={(option) => (
          <div className="w-4.5 h-4.5 flex-shrink-0 overflow-hidden relative flex justify-center items-center">
            {option?.logo_props ? <Logo logo={option.logo_props} size={14} /> : <ProjectIcon className="w-4 h-4" />}
          </div>
        )}
        queryExtractor={(option) => option.name}
      />
    </>
  );
});
