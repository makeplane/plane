import { ReactElement } from "react";
// layouts
import { AppLayout } from "layouts/app-layout";
import { WorkspaceSettingLayout } from "layouts/settings-layout";
// components
import { WorkspaceSettingHeader } from "components/headers";
import { WorkspaceDetails } from "components/workspace";
// types
import { NextPageWithLayout } from "lib/types";

const WorkspaceSettingsPage: NextPageWithLayout = () => <WorkspaceDetails />;

WorkspaceSettingsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<WorkspaceSettingHeader title="General Settings" />}>
      <WorkspaceSettingLayout>{page}</WorkspaceSettingLayout>
    </AppLayout>
  );
};

export default WorkspaceSettingsPage;
