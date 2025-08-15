"use client";
import { observer } from "mobx-react";

// component
import Link from "next/link";
import useSWR from "swr";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { Button } from "@plane/ui";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsHeading } from "@/components/settings/heading";
import { EmailSettingsLoader } from "@/components/ui/loader/settings/email";
// constants
import { APPLICATIONS_LIST } from "@/constants/fetch-keys";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user/user-permissions";
// plane web components
import { AppListRoot } from "@/plane-web/components/marketplace";
import { useApplications } from "@/plane-web/hooks/store";

const ApplicationsListPage = observer(() => {
  // store hooks
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { slug: workspaceSlug } = currentWorkspace || {};
  const { fetchApplications, getApplicationsForWorkspace } = useApplications();

  // derived values
  const canPerformWorkspaceAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Applications` : undefined;
  const applications = getApplicationsForWorkspace(workspaceSlug || "");

  const { data, isLoading } = useSWR(
    workspaceSlug ? APPLICATIONS_LIST(workspaceSlug) : null,
    workspaceSlug ? async () => fetchApplications() : null
  );

  if (!data || isLoading || !applications) {
    return <EmailSettingsLoader />;
  }

  if (workspaceUserInfo && !canPerformWorkspaceAdminActions) {
    return <NotAuthorizedView section="settings" className="h-auto" />;
  }

  return (
    <>
      <PageHead title={pageTitle} />
      <section className="w-full overflow-y-auto">
        <SettingsHeading
          title={"Work with your Plane data in third-party apps or you own."}
          description="View all the integrations in use by this workspace or you"
          appendToRight={
            <Link href={`create`}>
              <Button variant="primary">Build your own</Button>
            </Link>
          }
        />
        {workspaceSlug && <AppListRoot apps={applications} />}
      </section>
    </>
  );
});

export default ApplicationsListPage;
