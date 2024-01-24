import { useState, ReactElement } from "react";
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
import { NextPageWithLayout } from "types/app";
// fetch-keys
import { useMobxStore } from "lib/mobx/store-provider";
import { observer } from "mobx-react-lite";

const GeneralSettingsPage: NextPageWithLayout = observer(() => {
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
    workspaceSlug && projectId ? `PROJECT_DETAILS_${projectId}` : null,
    workspaceSlug && projectId
      ? () => projectStore.fetchProjectDetails(workspaceSlug.toString(), projectId.toString())
      : null
  );

  // const currentNetwork = NETWORK_CHOICES.find((n) => n.key === projectDetails?.network);
  // const selectedNetwork = NETWORK_CHOICES.find((n) => n.key === watch("network"));

  const isAdmin = currentProjectDetails?.member_role === 20;

  return (
    <>
      {currentProjectDetails && (
        <DeleteProjectModal
          project={currentProjectDetails}
          isOpen={Boolean(selectProject)}
          onClose={() => setSelectedProject(null)}
        />
      )}

      <div className={`w-full overflow-y-auto py-8 pr-9 ${isAdmin ? "" : "opacity-60"}`}>
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
    </>
  );
});

GeneralSettingsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<ProjectSettingHeader title="General Settings" />} withProjectWrapper>
      <ProjectSettingLayout>{page}</ProjectSettingLayout>
    </AppLayout>
  );
};

export default GeneralSettingsPage;
