import { ReactElement } from "react";
// layouts
import { WorkspaceSettingLayout } from "layouts/settings-layout";
import { AppLayout } from "layouts/app-layout";
// components
import IntegrationGuide from "components/integration/guide";
import { WorkspaceSettingHeader } from "components/headers";
// types
import { NextPageWithLayout } from "types/app";

const ImportsPage: NextPageWithLayout = () => (
  <section className="pr-9 py-8 w-full overflow-y-auto">
    <div className="flex items-center py-3.5 border-b border-custom-border-200">
      <h3 className="text-xl font-medium">Imports</h3>
    </div>
    <IntegrationGuide />
  </section>
);

ImportsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<WorkspaceSettingHeader title="Import Settings" />}>
      <WorkspaceSettingLayout>{page}</WorkspaceSettingLayout>
    </AppLayout>
  );
};

export default ImportsPage;
