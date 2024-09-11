"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// components
import { PageHead } from "@/components/core";
import {
  ArchiveRestoreProjectModal,
  ArchiveProjectSelection,
  DeleteProjectModal,
  DeleteProjectSection,
  ProjectDetailsForm,
  ProjectDetailsFormLoader,
} from "@/components/project";
// hooks
import { useProject, useUserPermissions } from "@/hooks/store";
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";

const GeneralSettingsPage = observer(() => {
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
  // const currentNetwork = NETWORK_CHOICES.find((n) => n.key === projectDetails?.network);
  // const selectedNetwork = NETWORK_CHOICES.find((n) => n.key === watch("network"));

  return (
    <>
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

      <div className={`w-full overflow-y-auto ${isAdmin ? "" : "opacity-60"}`}>
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
    </>
  );
});

export default GeneralSettingsPage;
