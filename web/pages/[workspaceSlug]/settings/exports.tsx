import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// layout
import { AppLayout } from "layouts/app-layout";
import { WorkspaceSettingLayout } from "layouts/settings-layout";
// components
import { WorkspaceSettingHeader } from "components/headers";
import ExportGuide from "components/exporter/guide";
// types
import { NextPageWithLayout } from "types/app";
// constants
import { EUserWorkspaceRoles } from "constants/workspace";

const ExportsPage: NextPageWithLayout = observer(() => {
  const {
    user: { currentWorkspaceRole },
  } = useMobxStore();

  const hasPageAccess =
    currentWorkspaceRole && [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER].includes(currentWorkspaceRole);

  if (!hasPageAccess)
    return (
      <div className="h-full w-full flex justify-center mt-10 p-4">
        <p className="text-custom-text-300 text-sm">You are not authorized to access this page.</p>
      </div>
    );

  return (
    <div className="pr-9 py-8 w-full overflow-y-auto">
      <div className="flex items-center py-3.5 border-b border-custom-border-100">
        <h3 className="text-xl font-medium">Exports</h3>
      </div>
      <ExportGuide />
    </div>
  );
});

ExportsPage.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <AppLayout header={<WorkspaceSettingHeader title="Export Settings" />}>
      <WorkspaceSettingLayout>{page}</WorkspaceSettingLayout>
    </AppLayout>
  );
};

export default ExportsPage;
