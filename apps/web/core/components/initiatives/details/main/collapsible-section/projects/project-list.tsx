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
// local components
import { ProjectItem } from "./project-list-item";
import type { TProjectProperty } from "@/store/project/permissions/root";

type ProjectListProps = {
  workspaceSlug: string;
  projectIds: string[];
  initiativeId: string;
  permissions: {
    canRemove: boolean;
    canEditProperty: (projectId: string, property: TProjectProperty) => boolean;
  };
};

export const ProjectList = observer(function ProjectList(props: ProjectListProps) {
  const { workspaceSlug, projectIds, initiativeId, permissions } = props;

  return (
    <>
      {projectIds.map((projectId) => (
        <ProjectItem
          key={projectId}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          initiativeId={initiativeId}
          permissions={{
            canRemove: permissions.canRemove,
            canEditProperty: (property: TProjectProperty) => permissions.canEditProperty(projectId, property),
          }}
        />
      ))}
    </>
  );
});
