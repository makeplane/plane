import { useState } from "react";
import { useRouter } from "next/router";

import useSWR from "swr";
// layouts
import { AppLayout } from "layouts/app-layout";
import { ProjectSettingLayout } from "layouts/settings-layout";
// components
import { ProjectSettingHeader } from "components/headers";
import {
  DeleteProjectModal,
  DeleteProjectSection,
  ProjectDetailsForm,
  ProjectDetailsFormLoader,
} from "components/project";
// types
import type { NextPage } from "next";
// fetch-keys
import { useMobxStore } from "lib/mobx/store-provider";
import { observer } from "mobx-react-lite";

const GeneralSettings: NextPage = observer(() => {
  // store
  const { project: projectStore } = useMobxStore();
  const { currentProjectDetails } = projectStore;
  // states
  const [selectProject, setSelectedProject] = useState<string | null>(null);
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // api call to fetch project details
  useSWR(
    workspaceSlug && projectId ? "PROJECT_DETAILS" : null,
    workspaceSlug && projectId
      ? () => projectStore.fetchProjectDetails(workspaceSlug.toString(), projectId.toString())
      : null
  );

  // const currentNetwork = NETWORK_CHOICES.find((n) => n.key === projectDetails?.network);
  // const selectedNetwork = NETWORK_CHOICES.find((n) => n.key === watch("network"));

  const isAdmin = currentProjectDetails?.member_role === 20;

  return (
    <AppLayout header={<ProjectSettingHeader title="General Settings" />} withProjectWrapper>
      <ProjectSettingLayout>
        {currentProjectDetails && (
          <DeleteProjectModal
            project={currentProjectDetails}
            isOpen={Boolean(selectProject)}
            onClose={() => setSelectedProject(null)}
          />
        )}

        <div className={`pr-9 py-8 w-full overflow-y-auto ${isAdmin ? "" : "opacity-60"}`}>
          {currentProjectDetails && workspaceSlug ? (
            <ProjectDetailsForm
              project={currentProjectDetails}
              workspaceSlug={workspaceSlug.toString()}
              isAdmin={isAdmin}
            />
          ) : (
            <ProjectDetailsFormLoader />
          )}

          {isAdmin && (
            <DeleteProjectSection
              projectDetails={currentProjectDetails}
              handleDelete={() => setSelectedProject(currentProjectDetails.id ?? null)}
            />
          )}
        </div>
      </ProjectSettingLayout>
    </AppLayout>
  );
});

export default GeneralSettings;
