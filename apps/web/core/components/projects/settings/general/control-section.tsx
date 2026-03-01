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

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "react-router";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
// components
import { SettingsBoxedControlItem } from "@/components/settings/boxed-control-item";
import { ArchiveRestoreProjectModal } from "@/components/projects/modals/archive-restore-modal";
import { DeleteProjectModal } from "@/components/projects/modals/delete-project-modal";
// hooks
import { useProject } from "@/hooks/store/use-project";

type Props = {
  projectId: string;
};

export const GeneralProjectSettingsControlSection = observer(function GeneralProjectSettingsControlSection(
  props: Props
) {
  const { projectId } = props;
  // states
  const [selectProject, setSelectedProject] = useState<string | null>(null);
  const [archiveProject, setArchiveProject] = useState<boolean>(false);
  // params
  const { workspaceSlug } = useParams();
  // store hooks
  const { currentProjectDetails } = useProject();
  // translation
  const { t } = useTranslation();

  if (!currentProjectDetails) return null;

  return (
    <div className="mt-10">
      {workspaceSlug && (
        <ArchiveRestoreProjectModal
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          isOpen={archiveProject}
          onClose={() => setArchiveProject(false)}
          archive
        />
      )}
      <DeleteProjectModal
        project={currentProjectDetails}
        isOpen={Boolean(selectProject)}
        onClose={() => setSelectedProject(null)}
      />
      <div className="rounded-lg border border-subtle bg-layer-2">
        {/* Project Selector */}
        <SettingsBoxedControlItem
          className="rounded-b-none border-0 border-b"
          title={t("archive")}
          description="Archiving a project will unlist your project from your side navigation although you will still be able to access it from your projects page. You can restore the project or delete it whenever you want."
          control={
            <Button variant="secondary" onClick={() => setArchiveProject(true)}>
              {t("archive")}
            </Button>
          }
        />
        {/* Format Selector */}
        <SettingsBoxedControlItem
          className="rounded-t-none border-0"
          title={t("delete")}
          description="When deleting a project, all of the data and resources within that project will be permanently removed and cannot be recovered."
          control={
            <Button variant="error-outline" onClick={() => setSelectedProject(currentProjectDetails.id ?? null)}>
              {t("delete")}
            </Button>
          }
        />
      </div>
    </div>
  );
});
