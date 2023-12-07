import { ReactElement } from "react";
// layouts
import { AppLayout } from "layouts/app-layout";
import { ProjectSettingLayout } from "layouts/settings-layout";
// components
import { ProjectSettingHeader } from "components/headers";
import { EstimatesList } from "components/estimates";
// types
import { NextPageWithLayout } from "types/app";
import { useMobxStore } from "lib/mobx/store-provider";
import { EUserWorkspaceRoles } from "constants/workspace";
import { observer } from "mobx-react-lite";

const EstimatesSettingsPage: NextPageWithLayout = observer(() => {
  const {
    user: { currentProjectRole },
  } = useMobxStore();

  const isAdmin = currentProjectRole === EUserWorkspaceRoles.ADMIN;

  return (
    <div className={`pr-9 py-8 w-full overflow-y-auto ${isAdmin ? "" : "opacity-60 pointer-events-none"}`}>
      <EstimatesList />
    </div>
  );
});

EstimatesSettingsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<ProjectSettingHeader title="Estimates Settings" />} withProjectWrapper>
      <ProjectSettingLayout>{page}</ProjectSettingLayout>
    </AppLayout>
  );
};

export default EstimatesSettingsPage;
