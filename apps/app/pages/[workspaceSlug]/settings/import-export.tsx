import { useRouter } from "next/router";

// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout";
import { SettingsHeader } from "components/workspace";
// components
import IntegrationGuide from "components/integration/guide";
// ui
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// types
import type { NextPage } from "next";

const ImportExport: NextPage = () => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  return (
    <WorkspaceAuthorizationLayout
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title={`${workspaceSlug ?? "Workspace"}`} link={`/${workspaceSlug}`} />
          <BreadcrumbItem title="Import/ Export Settings" />
        </Breadcrumbs>
      }
    >
      <div className="px-24 py-8">
        <SettingsHeader />
        <IntegrationGuide />
      </div>
    </WorkspaceAuthorizationLayout>
  );
};

export default ImportExport;
