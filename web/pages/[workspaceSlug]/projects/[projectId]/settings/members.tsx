import { ReactElement } from "react";
import { observer } from "mobx-react";
// layouts
// components
import { PageHead } from "@/components/core";
import { ProjectSettingHeader } from "@/components/headers";
import { ProjectMemberList, ProjectSettingsMemberDefaults } from "@/components/project";
// types
// hooks
import { useProject } from "@/hooks/store";
import { AppLayout } from "@/layouts/app-layout";
import { ProjectSettingLayout } from "@/layouts/settings-layout";
import { NextPageWithLayout } from "@/lib/types";

const MembersSettingsPage: NextPageWithLayout = observer(() => {
  // store
  const { currentProjectDetails } = useProject();
  // derived values
  const pageTitle = currentProjectDetails?.name ? `${currentProjectDetails?.name} - Members` : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <section className={`w-full overflow-y-auto py-8 pr-9`}>
        <ProjectSettingsMemberDefaults />
        <ProjectMemberList />
      </section>
    </>
  );
});

MembersSettingsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<ProjectSettingHeader />} withProjectWrapper>
      <ProjectSettingLayout>{page}</ProjectSettingLayout>
    </AppLayout>
  );
};

export default MembersSettingsPage;
