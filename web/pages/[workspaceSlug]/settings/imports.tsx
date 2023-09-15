import { useRouter } from "next/router";

import useSWR from "swr";

// services
import workspaceService from "services/workspace.service";
// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout";
// components
import IntegrationGuide from "components/integration/guide";
import { SettingsSidebar } from "components/project";
// ui
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// types
import type { NextPage } from "next";
// fetch-keys
import { WORKSPACE_DETAILS } from "constants/fetch-keys";
// helper
import { truncateText } from "helpers/string.helper";

const ImportExport: NextPage = () => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { data: activeWorkspace } = useSWR(
    workspaceSlug ? WORKSPACE_DETAILS(workspaceSlug as string) : null,
    () => (workspaceSlug ? workspaceService.getWorkspace(workspaceSlug as string) : null)
  );

  return (
    <WorkspaceAuthorizationLayout
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem
            title={`${truncateText(activeWorkspace?.name ?? "Workspace", 32)}`}
            link={`/${workspaceSlug}`}
            linkTruncate
          />
          <BreadcrumbItem title="Import/ Export Settings" unshrinkTitle />
        </Breadcrumbs>
      }
    >
      <div className="flex flex-row gap-2 h-full overflow-hidden">
        <div className="w-80 py-8">
          <SettingsSidebar />
        </div>
        <section className="pr-9 py-8 w-full">
          <div className="flex items-center py-3.5 border-b border-custom-border-200">
            <h3 className="text-xl font-medium">Imports</h3>
          </div>
          <IntegrationGuide />
          <div className="flex items-center py-3.5 border-b border-custom-border-200">
            <h3 className="text-xl font-medium">Previous Imports</h3>
          </div>
        </section>
      </div>
    </WorkspaceAuthorizationLayout>
  );
};

export default ImportExport;
