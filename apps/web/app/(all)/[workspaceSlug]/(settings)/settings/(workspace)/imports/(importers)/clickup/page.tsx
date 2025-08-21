"use client";

import { FC, Fragment, useEffect } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane web components
import { E_FEATURE_FLAGS } from "@plane/constants";
import { AuthenticationRoot, StepsRoot } from "@/plane-web/components/importers/clickup";
//  plane web hooks
import { ClickUpDashboardRoot } from "@/plane-web/components/importers/clickup/dashboard/root";
import { DashboardLoaderRoot } from "@/plane-web/components/importers/common/dashboard";
import { useClickUpImporter, useFlag } from "@/plane-web/hooks/store";

const ClickUpImporter: FC = observer(() => {
  const {
    user,
    workspace,
    dashboardView,
    resetImporterData,
    auth: { currentAuth, authVerification },
    job: { workspaceId: serviceWorkspaceId, setDefaultServiceConfig },
  } = useClickUpImporter();

  // derived values
  const workspaceSlug = workspace?.slug || undefined;
  const workspaceId = workspace?.id || undefined;
  const userId = user?.id || undefined;

  // feature flag
  const isFeatureEnabled = useFlag(workspaceSlug?.toString(), E_FEATURE_FLAGS.CLICKUP_IMPORTER) || false;

  // validating the importer is authenticated or not
  const { isLoading: importerAuthIsLoading } = useSWR(
    workspaceSlug && userId && !currentAuth ? `IMPORTER_AUTHENTICATION_CLICKUP_${workspaceSlug}_${user?.id}` : null,
    workspaceSlug && userId && !currentAuth ? async () => authVerification() : null,
    { errorRetryCount: 0 }
  );

  // initiating job service config
  useEffect(() => {
    if (workspaceId && workspaceSlug && userId && workspaceId != serviceWorkspaceId) {
      setDefaultServiceConfig(workspaceId, undefined);
    }
    return () => {
      resetImporterData();
    };
  }, [workspaceId, userId, serviceWorkspaceId, setDefaultServiceConfig, resetImporterData, workspaceSlug]);

  if (!isFeatureEnabled) {
    return (
      <div className="text-custom-text-200 relative flex justify-center items-center">
        <div className="flex flex-col items-center justify-center">
          <div className="text-custom-text-200 text-2xl font-medium">ClickUp Importer is not enabled</div>
        </div>
      </div>
    );
  }

  if (importerAuthIsLoading) return <DashboardLoaderRoot />;

  if (!currentAuth)
    return (
      <div className="text-custom-text-200 relative flex justify-center items-center">
        Not able to detect login. Please try again later.
      </div>
    );

  return (
    <Fragment>
      {!currentAuth?.isAuthenticated ? (
        <AuthenticationRoot />
      ) : (
        <Fragment>{dashboardView ? <ClickUpDashboardRoot /> : <StepsRoot />}</Fragment>
      )}
    </Fragment>
  );
});

export default ClickUpImporter;
