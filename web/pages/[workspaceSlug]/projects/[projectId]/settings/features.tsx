import React from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// layouts
import { AppLayout } from "layouts/app-layout";
import { ProjectSettingLayout } from "layouts/setting-layout";
// hooks
import useUserAuth from "hooks/use-user-auth";
// components
import { ProjectSettingHeader } from "components/headers";
import { ProjectFeaturesList } from "components/project";
// types
import type { NextPage } from "next";

const FeaturesSettings: NextPage = () => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const {} = useUserAuth();

  const { user: userStore } = useMobxStore();

  const { data: memberDetails } = useSWR(
    workspaceSlug && projectId ? `PROJECT_MEMBERS_ME_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId
      ? () => userStore.fetchUserProjectInfo(workspaceSlug.toString(), projectId.toString())
      : null
  );

  const isAdmin = memberDetails?.role === 20;

  return (
    <AppLayout header={<ProjectSettingHeader title="Features Settings" />} withProjectWrapper>
      <ProjectSettingLayout>
        <section className={`pr-9 py-8 w-full overflow-y-auto ${isAdmin ? "" : "opacity-60"}`}>
          <div className="flex items-center py-3.5 border-b border-custom-border-200">
            <h3 className="text-xl font-medium">Features</h3>
          </div>
          <ProjectFeaturesList />
        </section>
      </ProjectSettingLayout>
    </AppLayout>
  );
};

export default FeaturesSettings;
