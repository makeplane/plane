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

import React from "react";
import { observer } from "mobx-react";
// ui
import { useTranslation } from "@plane/i18n";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { CustomSearchSelect } from "@plane/ui";
// components
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useProjectAdvanced } from "@/plane-web/hooks/store/projects/use-projects";
// plane web types
import type { TProject } from "@/types";

type ProjectOptionProps = {
  project: TProject;
  isEpicsEnabled: boolean;
  isEpic: boolean;
};

function ProjectOption({ project, isEpicsEnabled, isEpic }: ProjectOptionProps) {
  return (
    <div className="flex items-center gap-2 w-full">
      <span className="grid place-items-center shrink-0 h-4 w-4">
        <Logo logo={project.logo_props} size={12} />
      </span>
      <p className="grow truncate flex items-center justify-between gap-3">
        <span>{project.name}</span>
        {!isEpicsEnabled && isEpic && <span className="text-placeholder text-11">Epics not enabled</span>}
      </p>
    </div>
  );
}

type Props = {
  value: string | null;
  onChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
  currentProjectId?: string;
  isEpic?: boolean;
};

export const ProjectDropdown = observer(function ProjectDropdown(props: Props) {
  const { t } = useTranslation();
  const { value, onChange, placeholder = "Select project", disabled = false, currentProjectId, isEpic = false } = props;

  // store hooks
  const { joinedProjectIds, getProjectById } = useProject();
  const { getProjectFeatures } = useProjectAdvanced();

  const options =
    joinedProjectIds
      ?.reduce<
        Array<{
          value: string;
          query: string;
          content: React.ReactNode;
          disabled: boolean;
          isEpicsEnabled: boolean;
        }>
      >((acc, projectId) => {
        const projectDetails = getProjectById(projectId);
        if (!projectDetails || projectId === currentProjectId) return acc;

        const projectFeatures = getProjectFeatures(projectId);
        const isEpicsEnabled = projectFeatures?.is_epic_enabled ?? false;

        acc.push({
          value: projectId,
          query: projectDetails.name,
          content: <ProjectOption project={projectDetails} isEpicsEnabled={isEpicsEnabled} isEpic={isEpic} />,
          disabled: !isEpicsEnabled && isEpic,
          isEpicsEnabled,
        });

        return acc;
      }, [])
      .sort((a, b) => {
        // Sort enabled projects first
        if (a.isEpicsEnabled !== b.isEpicsEnabled) {
          return a.isEpicsEnabled ? -1 : 1;
        }
        // Then sort alphabetically
        return a.query.localeCompare(b.query);
      }) || [];

  const selectedProject = value ? getProjectById(value) : null;

  return (
    <CustomSearchSelect
      value={value}
      onChange={onChange}
      options={options}
      disabled={disabled}
      label={
        <div className="w-full truncate text-left">
          {selectedProject ? (
            <div className="flex items-center gap-2 truncate">
              <span className="grid place-items-center flex-shrink-0 h-4 w-4">
                <Logo logo={selectedProject.logo_props} size={12} />
              </span>
              <span className="truncate">{selectedProject.name}</span>
            </div>
          ) : (
            <span className="text-placeholder">{placeholder}</span>
          )}
        </div>
      }
    />
  );
});
