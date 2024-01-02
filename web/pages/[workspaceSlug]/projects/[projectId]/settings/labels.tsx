import { ReactElement } from "react";
// layouts
import { AppLayout } from "layouts/app-layout";
import { ProjectSettingLayout } from "layouts/settings-layout";
// components
import { ProjectSettingsLabelList } from "components/labels";
import { ProjectSettingHeader } from "components/headers";
// types
import { NextPageWithLayout } from "lib/types";

const LabelsSettingsPage: NextPageWithLayout = () => (
  <div className="w-full gap-10 overflow-y-auto py-8 pr-9">
    <ProjectSettingsLabelList />
  </div>
);

LabelsSettingsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout withProjectWrapper header={<ProjectSettingHeader title="Labels Settings" />}>
      <ProjectSettingLayout>{page}</ProjectSettingLayout>
    </AppLayout>
  );
};

export default LabelsSettingsPage;
