// layouts
import { AppLayout } from "layouts/app-layout";
import { WorkspaceSettingLayout } from "layouts/settings-layout";
// components
import { WorkspaceSettingHeader } from "components/headers";
import { WorkspaceDetails } from "components/workspace";
// types
import type { NextPage } from "next";

const WorkspaceSettings: NextPage = () => (
  <AppLayout header={<WorkspaceSettingHeader title="General Settings" />}>
    <WorkspaceSettingLayout>
      <WorkspaceDetails />
    </WorkspaceSettingLayout>
  </AppLayout>
);

export default WorkspaceSettings;
