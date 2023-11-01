import React from "react";

// layouts
import { AppLayout } from "layouts/app-layout";
import { ProjectSettingLayout } from "layouts/settings-layout";
// components
import { ProjectSettingsLabelList } from "components/labels";
import { ProjectSettingHeader } from "components/headers";
// types
import type { NextPage } from "next";

const LabelsSettings: NextPage = () => (
  <AppLayout withProjectWrapper header={<ProjectSettingHeader title="Labels Settings" />}>
    <ProjectSettingLayout>
      <div className="pr-9 py-8 gap-10 w-full overflow-y-auto">
        <ProjectSettingsLabelList />
      </div>
    </ProjectSettingLayout>
  </AppLayout>
);

export default LabelsSettings;
