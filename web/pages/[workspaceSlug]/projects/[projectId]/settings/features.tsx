import { ReactElement } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import useSWR from "swr";
// hooks
import { PageHead } from "@/components/core";
import { ProjectSettingHeader } from "@/components/headers";
import { ProjectFeaturesList } from "@/components/project";
import { EUserProjectRoles } from "@/constants/project";
import { useProject, useUser } from "@/hooks/store";
// layouts
import { AppLayout } from "@/layouts/app-layout";
import { ProjectSettingLayout } from "@/layouts/settings-layout";
// components
// types
import { NextPageWithLayout } from "@/lib/types";
// constants

const FeaturesSettingsPage: NextPageWithLayout = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store
  const {
    membership: { fetchUserProjectInfo },
  } = useUser();
  const { currentProjectDetails } = useProject();
  // fetch the project details
  const { data: memberDetails } = useSWR(
    workspaceSlug && projectId ? `PROJECT_MEMBERS_ME_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchUserProjectInfo(workspaceSlug.toString(), projectId.toString()) : null
  );
  // derived values
  const isAdmin = memberDetails?.role === EUserProjectRoles.ADMIN;
  const pageTitle = currentProjectDetails?.name ? `${currentProjectDetails?.name} - Features` : undefined;

  if (!workspaceSlug || !projectId) return null;

  return (
    <>
      <PageHead title={pageTitle} />
      <section className={`w-full overflow-y-auto py-8 pr-9 ${isAdmin ? "" : "opacity-60"}`}>
        <div className="flex items-center border-b border-custom-border-100 py-3.5">
          <h3 className="text-xl font-medium">Features</h3>
        </div>
        <ProjectFeaturesList
          workspaceSlug={workspaceSlug.toString()}
          projectId={projectId.toString()}
          isAdmin={isAdmin}
        />
      </section>
    </>
  );
});

FeaturesSettingsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<ProjectSettingHeader />} withProjectWrapper>
      <ProjectSettingLayout>{page}</ProjectSettingLayout>
    </AppLayout>
  );
};

export default FeaturesSettingsPage;
