import React from "react";
// layout
import { AppLayout } from "layouts/app-layout";
// components
import { ProjectSettingStateList } from "components/states";
import { ProjectSettingLayout } from "layouts/setting-layout";
import { ProjectSettingHeader } from "components/headers";
// types
import type { NextPage } from "next";

const StatesSettings: NextPage = () => (
  <AppLayout withProjectWrapper header={<ProjectSettingHeader title="States Settings" />}>
    <ProjectSettingLayout>
      <div className="pr-9 py-8 gap-10 w-full overflow-y-auto">
        <div className="flex items-center py-3.5 border-b border-custom-border-200">
          <h3 className="text-xl font-medium">States</h3>
        </div>

        <ProjectSettingStateList />
      </div>
    </ProjectSettingLayout>
  </AppLayout>
);

export default StatesSettings;
