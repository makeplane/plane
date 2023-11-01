import React from "react";
// layouts
import { AppLayout } from "layouts/app-layout";
import { ProjectSettingLayout } from "layouts/setting-layout";
// components
import { ProjectSettingHeader } from "components/headers";
import { EstimatesList } from "components/estimates/estimate-list";
// types
import type { NextPage } from "next";

const EstimatesSettings: NextPage = () => (
  <AppLayout header={<ProjectSettingHeader title="Estimates Settings" />} withProjectWrapper>
    <ProjectSettingLayout>
      <div className="pr-9 py-8 w-full overflow-y-auto">
        <EstimatesList />
      </div>
    </ProjectSettingLayout>
  </AppLayout>
);

export default EstimatesSettings;
