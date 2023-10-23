import { useRouter } from "next/router";
import Link from "next/link";

import useSWR from "swr";

// services
import { WorkspaceService } from "services/workspace.service";
// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout-legacy";
// components
import IntegrationGuide from "components/integration/guide";
import { SettingsSidebar } from "components/project";
// ui
import { BreadcrumbItem, Breadcrumbs } from "@plane/ui";
// types
import type { NextPage } from "next";
// fetch-keys
import { WORKSPACE_DETAILS } from "constants/fetch-keys";
// helper
import { truncateText } from "helpers/string.helper";

// services
const workspaceService = new WorkspaceService();

const ImportExport: NextPage = () => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { data: activeWorkspace } = useSWR(workspaceSlug ? WORKSPACE_DETAILS(workspaceSlug as string) : null, () =>
    workspaceSlug ? workspaceService.getWorkspace(workspaceSlug as string) : null
  );

  return (
    <WorkspaceAuthorizationLayout
      breadcrumbs={
        <Breadcrumbs onBack={() => router.back()}>
          <BreadcrumbItem
            link={
              <Link href={`/${workspaceSlug}`}>
                <a className={`border-r-2 border-custom-sidebar-border-200 px-3 text-sm `}>
                  <p className="truncate">{`${truncateText(activeWorkspace?.name ?? "Workspace", 32)}`}</p>
                </a>
              </Link>
            }
          />
          <BreadcrumbItem title="Import/ Export Settings" unshrinkTitle />
        </Breadcrumbs>
      }
    >
      <div className="flex flex-row gap-2 h-full">
        <div className="w-80 pt-8 overflow-y-hidden flex-shrink-0">
          <SettingsSidebar />
        </div>
        <section className="pr-9 py-8 w-full overflow-y-auto">
          <div className="flex items-center py-3.5 border-b border-custom-border-200">
            <h3 className="text-xl font-medium">Imports</h3>
          </div>
          <IntegrationGuide />
        </section>
      </div>
    </WorkspaceAuthorizationLayout>
  );
};

export default ImportExport;
