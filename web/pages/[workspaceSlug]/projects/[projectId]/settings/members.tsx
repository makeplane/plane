import { ReactElement } from "react";
// layouts
import { AppLayout } from "layouts/app-layout";
import { ProjectSettingLayout } from "layouts/settings-layout";
// components
import { ProjectSettingHeader } from "components/headers";
import { ProjectMemberList, ProjectSettingsMemberDefaults } from "components/project";
// types
import { NextPageWithLayout } from "lib/types";

const MembersSettingsPage: NextPageWithLayout = () => (
  <section className={`w-full overflow-y-auto py-8 pr-9`}>
    <ProjectSettingsMemberDefaults />
    <ProjectMemberList />
  </section>
);

MembersSettingsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<ProjectSettingHeader title="Members Settings" />} withProjectWrapper>
      <ProjectSettingLayout>{page}</ProjectSettingLayout>
    </AppLayout>
  );
};

export default MembersSettingsPage;
