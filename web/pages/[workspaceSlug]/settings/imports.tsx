import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// layouts
import { WorkspaceSettingLayout } from "layouts/settings-layout";
import { AppLayout } from "layouts/app-layout";
// components
import IntegrationGuide from "components/integration/guide";
import { WorkspaceSettingHeader } from "components/headers";
// types
import { NextPageWithLayout } from "types/app";
// constants
import { EUserWorkspaceRoles } from "constants/workspace";

const ImportsPage: NextPageWithLayout = observer(() => {
  const {
    user: { currentWorkspaceRole },
  } = useMobxStore();

  const isAdmin = currentWorkspaceRole === EUserWorkspaceRoles.ADMIN;

  if (!isAdmin)
    return (
      <div className="mt-10 flex h-full w-full justify-center p-4">
        <p className="text-sm text-custom-text-300">You are not authorized to access this page.</p>
      </div>
    );

  return (
    <section className="w-full overflow-y-auto py-8 pr-9">
      <div className="flex items-center border-b border-custom-border-100 py-3.5">
        <h3 className="text-xl font-medium">Imports</h3>
      </div>
      <IntegrationGuide />
    </section>
  );
});

ImportsPage.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <AppLayout header={<WorkspaceSettingHeader title="Import Settings" />}>
      <WorkspaceSettingLayout>{page}</WorkspaceSettingLayout>
    </AppLayout>
  );
};

export default ImportsPage;
