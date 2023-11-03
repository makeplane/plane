import { ReactElement } from "react";
// layouts
import { AppLayout } from "layouts/app-layout";
import { ProjectSettingLayout } from "layouts/settings-layout";
// components
import { ProjectSettingHeader } from "components/headers";
import { ProjectMemberList, ProjectSettingsMemberDefaults } from "components/project";
// types
import { NextPageWithLayout } from "types/app";

const MembersSettingsPage: NextPageWithLayout = () => (
  <section className={`pr-9 py-8 w-full overflow-y-auto`}>
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
