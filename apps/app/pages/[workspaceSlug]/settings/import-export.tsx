import { useRouter } from "next/router";

import useSWR from "swr";

// services
import workspaceService from "services/workspace.service";
// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout";
import { SettingsHeader } from "components/workspace";
// components
import IntegrationGuide from "components/integration/guide";
import { IntegrationAndImportExportBanner } from "components/ui";
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
      <div className="p-8 space-y-4">
        <SettingsHeader />
        <IntegrationAndImportExportBanner bannerName="Import/ Export" />
        <IntegrationGuide />
      </div>
    </WorkspaceAuthorizationLayout>
  );
};

export default ImportExport;
