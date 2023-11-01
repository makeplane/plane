// layouts
import { AppLayout } from "layouts/app-layout";
import { ProjectSettingLayout } from "layouts/settings-layout";
// components
import { ProjectSettingHeader } from "components/headers";
import { ProjectMemberList, ProjectSettingsMemberDefaults } from "components/project";
// types
import type { NextPage } from "next";

const MembersSettings: NextPage = () => (
  <AppLayout header={<ProjectSettingHeader title="Members Settings" />} withProjectWrapper>
    <ProjectSettingLayout>
      <section className={`pr-9 py-8 w-full overflow-y-auto`}>
        <ProjectSettingsMemberDefaults />
        <ProjectMemberList />
      </section>
    </ProjectSettingLayout>
  </AppLayout>
);

export default MembersSettings;
