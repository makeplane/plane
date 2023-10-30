import React from "react";
// layouts
import { AppLayout } from "layouts/app-layout";
import { WorkspaceSettingLayout } from "layouts/setting-layout";
// components
import { WorkspaceSettingHeader } from "components/headers";
// types
import type { NextPage } from "next";
import { WorkspaceDetails } from "components/workspace";

const WorkspaceSettings: NextPage = () => (
  <AppLayout header={<WorkspaceSettingHeader title="General Settings" />}>
    <WorkspaceSettingLayout>
      <WorkspaceDetails />
    </WorkspaceSettingLayout>
  </AppLayout>
);

export default WorkspaceSettings;
