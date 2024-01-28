import { ReactElement } from "react";
// layout
import { AppLayout } from "layouts/app-layout";
import { ProjectSettingLayout } from "layouts/settings-layout";
// components
import { ProjectSettingStateList } from "components/states";
import { ProjectSettingHeader } from "components/headers";
// types
import { NextPageWithLayout } from "lib/types";

const StatesSettingsPage: NextPageWithLayout = () => (
  <div className="w-full gap-10 overflow-y-auto py-8 pr-9">
    <div className="flex items-center border-b border-custom-border-100 py-3.5">
      <h3 className="text-xl font-medium">States</h3>
    </div>
    <ProjectSettingStateList />
  </div>
);

StatesSettingsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout withProjectWrapper header={<ProjectSettingHeader title="States Settings" />}>
      <ProjectSettingLayout>{page}</ProjectSettingLayout>
    </AppLayout>
  );
};

export default StatesSettingsPage;
