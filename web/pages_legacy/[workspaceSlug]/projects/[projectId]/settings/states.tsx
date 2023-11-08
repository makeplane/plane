import { ReactElement } from "react";
// layout
import { AppLayout } from "layouts/app-layout";
import { ProjectSettingLayout } from "layouts/settings-layout";
// components
import { ProjectSettingStateList } from "components/states";
import { ProjectSettingHeader } from "components/headers";
// types
import { NextPageWithLayout } from "types/app";

const StatesSettingsPage: NextPageWithLayout = () => (
  <div className="pr-9 py-8 gap-10 w-full overflow-y-auto">
    <div className="flex items-center py-3.5 border-b border-custom-border-100">
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
