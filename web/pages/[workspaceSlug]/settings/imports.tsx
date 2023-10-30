// layouts
import { WorkspaceSettingLayout } from "layouts/setting-layout";
// components
import { AppLayout } from "layouts/app-layout";
import IntegrationGuide from "components/integration/guide";
import { WorkspaceSettingHeader } from "components/headers";
// types
import type { NextPage } from "next";

const ImportExport: NextPage = () => (
  <AppLayout header={<WorkspaceSettingHeader title="Import Settings" />}>
    <WorkspaceSettingLayout>
      <section className="pr-9 py-8 w-full overflow-y-auto">
        <div className="flex items-center py-3.5 border-b border-custom-border-200">
          <h3 className="text-xl font-medium">Imports</h3>
        </div>
        <IntegrationGuide />
      </section>
    </WorkspaceSettingLayout>
  </AppLayout>
);

export default ImportExport;
