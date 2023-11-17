import { ReactElement } from "react";
// layouts
import { AppLayout } from "layouts/app-layout";
import { ProjectSettingLayout } from "layouts/settings-layout";
// components
import { ProjectSettingsLabelList } from "components/labels";
import { ProjectSettingHeader } from "components/headers";
// types
import { NextPageWithLayout } from "types/app";

const LabelsSettingsPage: NextPageWithLayout = () => (
  <div className="pr-9 py-8 gap-10 w-full overflow-y-auto">
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
