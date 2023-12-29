import { observer } from "mobx-react-lite";
// hooks
import { useUser } from "hooks/store";
// layout
import { AppLayout } from "layouts/app-layout";
import { WorkspaceSettingLayout } from "layouts/settings-layout";
// components
import { WorkspaceSettingHeader } from "components/headers";
import ExportGuide from "components/exporter/guide";
// types
import { NextPageWithLayout } from "lib/types";
// constants
import { EUserWorkspaceRoles } from "constants/workspace";

const ExportsPage: NextPageWithLayout = observer(() => {
  // store hooks
  const {
    membership: { currentWorkspaceRole },
  } = useUser();

  const hasPageAccess =
    currentWorkspaceRole && [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER].includes(currentWorkspaceRole);

  if (!hasPageAccess)
    return (
      <div className="mt-10 flex h-full w-full justify-center p-4">
        <p className="text-sm text-custom-text-300">You are not authorized to access this page.</p>
      </div>
    );

  return (
    <div className="w-full overflow-y-auto py-8 pr-9">
      <div className="flex items-center border-b border-custom-border-100 py-3.5">
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
