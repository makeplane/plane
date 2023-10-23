// components
import ExportGuide from "components/exporter/guide";
// types
import type { NextPage } from "next";
// helper
import { WorkspaceSettingLayout } from "layouts/setting-layout/workspace-setting-layout";
import { WorkspaceSettingHeader } from "components/headers";

const ImportExport: NextPage = () => (
  <WorkspaceSettingLayout header={<WorkspaceSettingHeader title="Export Settings" />}>
    <div className="pr-9 py-8 w-full overflow-y-auto">
      <div className="flex items-center py-3.5 border-b border-custom-border-200">
        <h3 className="text-xl font-medium">Exports</h3>
      </div>
      <ExportGuide />
    </div>
  </WorkspaceSettingLayout>
);

export default ImportExport;
