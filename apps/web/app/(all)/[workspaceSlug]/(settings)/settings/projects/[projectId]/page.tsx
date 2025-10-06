"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
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

const ProjectSettingsPage = observer(() => {
  // states
  const [selectProject, setSelectedProject] = useState<string | null>(null);
  const [archiveProject, setArchiveProject] = useState<boolean>(false);
  // router
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { currentProjectDetails, fetchProjectDetails } = useProject();
  const { allowPermissions } = useUserPermissions();

  // api call to fetch project details
  // TODO: removed this API if not necessary
  const { isLoading } = useSWR(
    workspaceSlug && projectId ? `PROJECT_DETAILS_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchProjectDetails(workspaceSlug.toString(), projectId.toString()) : null
  );
  // derived values
  const isAdmin = allowPermissions(
    [EUserPermissions.ADMIN],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug.toString(),
    projectId.toString()
  );

  const pageTitle = currentProjectDetails?.name ? `${currentProjectDetails?.name} - General Settings` : undefined;

  return (
    <SettingsContentWrapper>
      <PageHead title={pageTitle} />
      {currentProjectDetails && workspaceSlug && projectId && (
        <>
          <ArchiveRestoreProjectModal
            workspaceSlug={workspaceSlug.toString()}
            projectId={projectId.toString()}
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
        {currentProjectDetails && workspaceSlug && projectId && !isLoading ? (
          <ProjectDetailsForm
            project={currentProjectDetails}
            workspaceSlug={workspaceSlug.toString()}
            projectId={projectId.toString()}
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
});

export default ProjectSettingsPage;
