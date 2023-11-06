import { ReactElement } from "react";
// layouts
import { AppLayout } from "layouts/app-layout";
import { ProjectSettingLayout } from "layouts/settings-layout";
// components
import { ProjectSettingHeader } from "components/headers";
import { EstimatesList } from "components/estimates/estimate-list";
// types
import { NextPageWithLayout } from "types/app";

const EstimatesSettingsPage: NextPageWithLayout = () => (
  <div className="pr-9 py-8 w-full overflow-y-auto">
    <EstimatesList />
  </div>
);

EstimatesSettingsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<ProjectSettingHeader title="Estimates Settings" />} withProjectWrapper>
      <ProjectSettingLayout>{page}; </ProjectSettingLayout>
    </AppLayout>
  );
};

export default EstimatesSettingsPage;
