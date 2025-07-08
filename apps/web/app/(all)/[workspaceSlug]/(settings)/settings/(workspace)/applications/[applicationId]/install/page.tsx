"use client";

import { observer } from "mobx-react";

// component
import { useParams } from "next/navigation";
import useSWR from "swr";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { NotAuthorizedView } from "@/components/auth-screens";
import { PageHead } from "@/components/core";
// hooks
import { EmailSettingsLoader } from "@/components/ui";
import { APPLICATION_DETAILS } from "@/constants/fetch-keys";
import { useUserPermissions, useWorkspace } from "@/hooks/store";
// plane web components
import { ApplicationInstallationDetails } from "@/plane-web/components/marketplace/applications";
import { useApplications } from "@/plane-web/hooks/store";

const ApplicationInstallPage: React.FC = observer(() => {
  // store hooks
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { applicationId } = useParams();
  const { getApplicationById, fetchApplication } = useApplications();

  // derived values
  const canPerformWorkspaceAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Install Application` : undefined;

  const application = getApplicationById(applicationId?.toString() || "");
  const { data, isLoading } = useSWR(
    applicationId ? APPLICATION_DETAILS(applicationId.toString()) : null,
    applicationId ? async () => fetchApplication(applicationId.toString()) : null
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
