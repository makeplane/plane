import { ReactElement } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
// components
import { PageHead } from "@/components/core";
import { EstimateRoot } from "@/components/estimates";
import { ProjectSettingHeader } from "@/components/headers";
// constants
import { EUserProjectRoles } from "@/constants/project";
// hooks
import { useUser, useProject } from "@/hooks/store";
// layouts
import { AppLayout } from "@/layouts/app-layout";
import { ProjectSettingLayout } from "@/layouts/settings-layout";
// types
import { NextPageWithLayout } from "@/lib/types";

const EstimatesSettingsPage: NextPageWithLayout = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { currentProjectDetails } = useProject();

  // derived values
  const isAdmin = currentProjectRole === EUserProjectRoles.ADMIN;
  const pageTitle = currentProjectDetails?.name ? `${currentProjectDetails?.name} - Estimates` : undefined;

  if (!workspaceSlug || !projectId) return <></>;
  return (
    <>
      <PageHead title={pageTitle} />
      <div className={`w-full overflow-y-auto py-8 pr-9 ${isAdmin ? "" : "pointer-events-none opacity-60"}`}>
        <EstimateRoot workspaceSlug={workspaceSlug?.toString()} projectId={projectId?.toString()} isAdmin={isAdmin} />
      </div>
    </>
  );
});

EstimatesSettingsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<ProjectSettingHeader />} withProjectWrapper>
      <ProjectSettingLayout>{page}</ProjectSettingLayout>
    </AppLayout>
  );
};

export default EstimatesSettingsPage;
