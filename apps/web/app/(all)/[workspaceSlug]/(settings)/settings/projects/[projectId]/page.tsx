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
import { PageHead } from "@/components/core/page-title";
import { GeneralProjectSettingsControlSection } from "@/components/projects/settings/general/control-section";
import { ProjectDetailsForm } from "@/components/projects/settings/general/form";
import { ProjectDetailsFormLoader } from "@/components/projects/settings/general/form-loader";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
// hooks
import { useProject } from "@/hooks/store/use-project";
// local imports
import type { Route } from "./+types/page";
import { GeneralProjectSettingsHeader } from "./header";
import type { TProjectProperty } from "@/store/project/permissions/root";

function ProjectSettingsPage({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug, projectId } = params;
  // store hooks
  const { currentProjectDetails, permissions } = useProject();
  // derived values
  const pageTitle = currentProjectDetails?.name ? `${currentProjectDetails?.name} - General Settings` : undefined;
  // auth
  const projectPermissions = {
    canEdit: permissions.getCanEdit(workspaceSlug, projectId),
    canEditProperty: (property: TProjectProperty) => permissions.getCanEditProperty(workspaceSlug, projectId, property),
    canArchive: permissions.getCanArchive(workspaceSlug, projectId),
    canDelete: permissions.getCanDelete(workspaceSlug, projectId),
  };

  return (
    <SettingsContentWrapper header={<GeneralProjectSettingsHeader />}>
      <PageHead title={pageTitle} />
      <div className="w-full">
        <div className={projectPermissions.canEdit ? "" : "opacity-60"}>
          {currentProjectDetails ? (
            <ProjectDetailsForm
              project={currentProjectDetails}
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              permissions={projectPermissions}
            />
          ) : (
            <ProjectDetailsFormLoader />
          )}
        </div>
        <GeneralProjectSettingsControlSection
          projectId={projectId}
          workspaceSlug={workspaceSlug}
          permissions={projectPermissions}
        />
      </div>
    </SettingsContentWrapper>
  );
}

export default observer(ProjectSettingsPage);
