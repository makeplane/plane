"use client";

import { FC, Fragment, useEffect } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane web components
import { AuthenticationRoot, Dashboard, StepsRoot, DashboardLoaderRoot } from "@/plane-web/components/importers/asana";
//  plane web hooks
import { useFlag, useAsanaImporter } from "@/plane-web/hooks/store";
import { E_FEATURE_FLAGS } from "@/plane-web/types/feature-flag";

const AsanaImporter: FC = observer(() => {
  const {
    user,
    workspace,
    externalApiToken,
    fetchExternalApiToken,
    dashboardView,
    resetImporterData,
    auth: { currentAuth, authVerification },
    job: { workspaceId: serviceWorkspaceId, setDefaultServiceConfig },
  } = useAsanaImporter();

  // derived values
  const workspaceSlug = workspace?.slug || undefined;
  const workspaceId = workspace?.id || undefined;
  const userId = user?.id || undefined;
  const isFeatureEnabled =
    (workspaceSlug && useFlag(workspaceSlug?.toString(), E_FEATURE_FLAGS.ASANA_IMPORTER)) || false;

  // fetching external api token
  const { isLoading: externalApiTokenIsLoading } = useSWR(
    workspaceSlug && !externalApiToken ? `IMPORTER_EXTERNAL_SERVICE_TOKEN` : null,
    workspaceSlug && !externalApiToken ? async () => fetchExternalApiToken(workspaceSlug) : null,
    { errorRetryCount: 0 }
  );

  // validating the importer is authenticated or not
  const { isLoading: importerAuthIsLoading } = useSWR(
    workspaceSlug && externalApiToken && userId ? `IMPORTER_AUTHENTICATION_ASANA_${workspaceSlug}_${userId}` : null,
    workspaceSlug && externalApiToken && userId ? async () => authVerification() : null,
    { errorRetryCount: 0 }
  );

  useEffect(() => {
    if (workspaceId && userId && externalApiToken && workspaceId != serviceWorkspaceId) {
      setDefaultServiceConfig(workspaceId, externalApiToken);
    }
    return () => {
      resetImporterData();
    };
  }, [workspaceId, userId, externalApiToken, serviceWorkspaceId, setDefaultServiceConfig, resetImporterData]);

  if (!isFeatureEnabled) return null;

  if ((!externalApiToken && externalApiTokenIsLoading) || (!currentAuth && importerAuthIsLoading))
    return <DashboardLoaderRoot />;

  if (!externalApiToken)
    return (
      <div className="text-custom-text-200 relative flex justify-center items-center">
        Not able to access the external api token. Please try again later.
      </div>
    );

  return (
    <Fragment>
      {!currentAuth?.isAuthenticated ? (
        <AuthenticationRoot />
      ) : (
        <Fragment>{dashboardView ? <Dashboard /> : <StepsRoot />}</Fragment>
      )}
    </Fragment>
  );
});

export default AsanaImporter;
