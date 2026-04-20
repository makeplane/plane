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
// components
import { InitiativeScopeProjectsEmptyState } from "@/components/issues/issue-layouts/empty-states/initiative-scope-project";
import { ListLayoutLoader } from "@/components/ui/loader/layouts/list-layout-loader";
// types
import type { TProjectProperty } from "@/store/project/permissions/root";
// local imports
import { ProjectList } from "../../details/main/collapsible-section/projects/project-list";

type Props = {
  projectIds: string[];
  workspaceSlug: string;
  initiativeId: string;
  permissions: {
    canRemoveProject: boolean;
    canEditProjectProperty: (projectId: string, property: TProjectProperty) => boolean;
  };
  isDataLoading?: boolean;
};

export const InitiativeScopeProjectList = observer(function InitiativeScopeProjectList(props: Props) {
  const { projectIds, workspaceSlug, initiativeId, permissions, isDataLoading } = props;

  if (isDataLoading) return <ListLayoutLoader />;

  if (projectIds.length === 0) return <InitiativeScopeProjectsEmptyState />;

  return (
    <div className="h-full w-full overflow-y-auto">
      <ProjectList
        workspaceSlug={workspaceSlug}
        initiativeId={initiativeId}
        projectIds={projectIds}
        permissions={{
          canRemove: permissions.canRemoveProject,
          canEditProperty: permissions.canEditProjectProperty,
        }}
      />
    </div>
  );
});
