import { ReactElement } from "react";
// layout
import { AppLayout } from "layouts/app-layout";
import { WorkspaceSettingLayout } from "layouts/settings-layout";
// components
import { WorkspaceSettingHeader } from "components/headers";
import ExportGuide from "components/exporter/guide";
// types
import { NextPageWithLayout } from "types/app";

const ExportsPage: NextPageWithLayout = () => (
  <div className="pr-9 py-8 w-full overflow-y-auto">
    <div className="flex items-center py-3.5 border-b border-custom-border-100">
      <h3 className="text-xl font-medium">Exports</h3>
    </div>
    <ExportGuide />
  </div>
);

ExportsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<WorkspaceSettingHeader title="Export Settings" />}>
      <WorkspaceSettingLayout>{page}</WorkspaceSettingLayout>
    </AppLayout>
  );
};

export default ExportsPage;
