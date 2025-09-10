"use client";

import { observer } from "mobx-react";

// component
import { useParams } from "next/navigation";
import useSWR from "swr";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
// hooks
import { EmailSettingsLoader } from "@/components/ui/loader/settings/email";
import { APPLICATION_DETAILS } from "@/constants/fetch-keys";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
// plane web components
import { ApplicationInstallationDetails } from "@/plane-web/components/marketplace/applications";
import { useApplications } from "@/plane-web/hooks/store";

const ApplicationInstallPage: React.FC = observer(() => {
  // store hooks
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { appSlug } = useParams();
  const { getApplicationBySlug, fetchApplication } = useApplications();

  // derived values
  const canPerformWorkspaceAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Install Application` : undefined;

  const application = getApplicationBySlug(appSlug?.toString() || "");
  const { data, isLoading } = useSWR(
    appSlug ? APPLICATION_DETAILS(appSlug.toString()) : null,
    appSlug ? async () => fetchApplication(appSlug.toString()) : null
  );

  if (!data || !application || isLoading) {
    return <EmailSettingsLoader />;
  }

  if (workspaceUserInfo && !canPerformWorkspaceAdminActions) {
    return <NotAuthorizedView section="settings" />;
  }

  return (
    <>
      <PageHead title={pageTitle} />
      <ApplicationInstallationDetails app={application} />
    </>
  );
});

export default ApplicationInstallPage;
