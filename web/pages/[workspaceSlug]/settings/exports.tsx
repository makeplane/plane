// layout
import { AppLayout } from "layouts/app-layout";
import { WorkspaceSettingLayout } from "layouts/settings-layout";
// components
import { WorkspaceSettingHeader } from "components/headers";
import ExportGuide from "components/exporter/guide";
// types
import type { NextPage } from "next";
// helper

const ImportExport: NextPage = () => (
  <AppLayout header={<WorkspaceSettingHeader title="Export Settings" />}>
    <WorkspaceSettingLayout>
      <div className="pr-9 py-8 w-full overflow-y-auto">
        <div className="flex items-center py-3.5 border-b border-custom-border-200">
          <h3 className="text-xl font-medium">Exports</h3>
        </div>
        <ExportGuide />
      </div>
    </WorkspaceSettingLayout>
  </AppLayout>
);

export default ImportExport;
