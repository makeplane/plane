import { ReactElement } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// layouts
import { AppLayout } from "layouts/app-layout";
import { ProjectSettingLayout } from "layouts/settings-layout";
// components
import { ProjectSettingHeader } from "components/headers";
import { ProjectFeaturesList } from "components/project";
// types
import { NextPageWithLayout } from "types/app";

const FeaturesSettingsPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store
  const {
    user: { fetchUserProjectInfo },
  } = useMobxStore();

  const { data: memberDetails } = useSWR(
    workspaceSlug && projectId ? `PROJECT_MEMBERS_ME_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchUserProjectInfo(workspaceSlug.toString(), projectId.toString()) : null
  );

  const isAdmin = memberDetails?.role === 20;

  return (
    <section className={`pr-9 py-8 w-full overflow-y-auto ${isAdmin ? "" : "opacity-60"}`}>
      <div className="flex items-center py-3.5 border-b border-custom-border-200">
        <h3 className="text-xl font-medium">Features</h3>
      </div>
      <ProjectFeaturesList />
    </section>
  );
};

FeaturesSettingsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<ProjectSettingHeader title="Features Settings" />} withProjectWrapper>
      <ProjectSettingLayout>{page}</ProjectSettingLayout>
    </AppLayout>
  );
};

export default FeaturesSettingsPage;
