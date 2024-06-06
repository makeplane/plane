import { observer } from "mobx-react";
// components
import { ArrowUpDown } from "lucide-react";
import { PageHead } from "@/components/core";
import { WorkspaceSettingHeader } from "@/components/headers";
import IntegrationGuide from "@/components/integration/guide";
// constants
import { EUserWorkspaceRoles } from "@/constants/workspace";
// hooks
import { useInstance, useUser, useWorkspace } from "@/hooks/store";
// layouts
import { AppLayout } from "@/layouts/app-layout";
import { WorkspaceSettingLayout } from "@/layouts/settings-layout";
// types
import { NextPageWithLayout } from "@/lib/types";

const ImportsPage: NextPageWithLayout = observer(() => {
  // store hooks
  const { instance } = useInstance();
  const {
    membership: { currentWorkspaceRole },
  } = useUser();
  const { currentWorkspace } = useWorkspace();

  // derived values
  const isAdmin = currentWorkspaceRole === EUserWorkspaceRoles.ADMIN;
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Imports` : undefined;

  if (!isAdmin)
    return (
      <>
        <PageHead title={pageTitle} />
        <div className="mt-10 flex h-full w-full justify-center p-4">
          <p className="text-sm text-custom-text-300">You are not authorized to access this page.</p>
        </div>
      </>
    );

  if (instance?.product === "plane-one")
    return (
      <div className="flex justify-center py-28 h-full w-full">
        <div className="text-center flex flex-col gap-10 items-center">
          <div className="flex items-center justify-center h-28 w-28 bg-custom-background-90 rounded-full">
            <ArrowUpDown className="h-12 w-12 text-custom-text-400" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-medium text-custom-text-300 whitespace-pre-line">
              Importers for Plane One will be coming soon. Stay tuned!!!
            </h3>
            <p className="text-base font-medium text-custom-text-400 whitespace-pre-line">
              For requests on specific importer, reach out to{" "}
              <a href="mailto:support@plane.so" className="text-custom-primary-200 hover:underline">
                support@plane.so
              </a>
            </p>
          </div>
        </div>
      </div>
    );

  return (
    <>
      <PageHead title={pageTitle} />
      <section className="w-full overflow-y-auto py-8 pr-9">
        <div className="flex items-center border-b border-custom-border-100 py-3.5">
          <h3 className="text-xl font-medium">Imports</h3>
        </div>
        <IntegrationGuide />
      </section>
    </>
  );
});

ImportsPage.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <AppLayout header={<WorkspaceSettingHeader />}>
      <WorkspaceSettingLayout>{page}</WorkspaceSettingLayout>
    </AppLayout>
  );
};

export default ImportsPage;
