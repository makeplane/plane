// layouts
import { WorkspaceSettingLayout } from "layouts/setting-layout/workspace-setting-layout";
// components
import IntegrationGuide from "components/integration/guide";
import { WorkspaceSettingHeader } from "components/headers";
// types
import type { NextPage } from "next";

const ImportExport: NextPage = () => (
  <WorkspaceSettingLayout header={<WorkspaceSettingHeader title="Import Settings" />}>
    <section className="pr-9 py-8 w-full overflow-y-auto">
      <div className="flex items-center py-3.5 border-b border-custom-border-200">
        <h3 className="text-xl font-medium">Imports</h3>
      </div>
      <IntegrationGuide />
    </section>
  </WorkspaceSettingLayout>
);

export default ImportExport;
