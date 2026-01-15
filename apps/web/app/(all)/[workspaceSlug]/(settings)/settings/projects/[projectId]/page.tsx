import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
// components
import { PageHead } from "@/components/core/page-title";
import { DeleteProjectModal } from "@/components/project/delete-project-modal";
import { ProjectDetailsForm } from "@/components/project/form";
import { ProjectDetailsFormLoader } from "@/components/project/form-loader";
import { ArchiveRestoreProjectModal } from "@/components/project/settings/archive-project/archive-restore-modal";
import { ArchiveProjectSelection } from "@/components/project/settings/archive-project/selection";
import { DeleteProjectSection } from "@/components/project/settings/delete-project-section";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import type { Route } from "./+types/page";

function ProjectSettingsPage({ params }: Route.ComponentProps) {
  // states
  const [selectProject, setSelectedProject] = useState<string | null>(null);
  const [archiveProject, setArchiveProject] = useState<boolean>(false);
  // router
  const { workspaceSlug, projectId } = params;
  // store hooks
  const { currentProjectDetails } = useProject();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT, workspaceSlug, projectId);

  const pageTitle = currentProjectDetails?.name ? `${currentProjectDetails?.name} - General Settings` : undefined;

  return (
    <SettingsContentWrapper>
      <PageHead title={pageTitle} />
      {currentProjectDetails && (
        <>
          <ArchiveRestoreProjectModal
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            isOpen={archiveProject}
            onClose={() => setArchiveProject(false)}
            archive
          />
          <DeleteProjectModal
            project={currentProjectDetails}
            isOpen={Boolean(selectProject)}
            onClose={() => setSelectedProject(null)}
          />
        </>
      )}

      <div className={`w-full ${isAdmin ? "" : "opacity-60"}`}>
        {currentProjectDetails ? (
          <ProjectDetailsForm
            project={currentProjectDetails}
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            isAdmin={isAdmin}
          />
        ) : (
          <ProjectDetailsFormLoader />
        )}

        {isAdmin && currentProjectDetails && (
          <>
            <ArchiveProjectSelection
              projectDetails={currentProjectDetails}
              handleArchive={() => setArchiveProject(true)}
            />
            <DeleteProjectSection
              projectDetails={currentProjectDetails}
              handleDelete={() => setSelectedProject(currentProjectDetails.id ?? null)}
            />
          </>
        )}
      </div>
    </SettingsContentWrapper>
  );
}

export default observer(ProjectSettingsPage);
